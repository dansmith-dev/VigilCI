const ALLOWED_ORIGIN = "http://localhost:5173";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

function getToken(request) {
    const cookie = request.headers.get("Cookie") ?? "";
    return cookie.split(";").find(c => c.trim().startsWith("gh_token="))
        ?.split("=")[1]?.trim() ?? null;
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders() });
        }

        if (url.pathname === "/exchange")  return handleExchange(request, url, env);
        if (url.pathname === "/session")   return handleSession(request, url, env);
        if (url.pathname === "/logout")    return handleLogout(request, url, env);
        if (url.pathname.startsWith("/github/")) return handleGitHubProxy(request, url, env);

        return new Response("Not found", { status: 404, headers: corsHeaders() });
    },
};

async function handleExchange(request, url, env) {
    const code = url.searchParams.get("code");
    if (!code) {
        return new Response("Missing code", { status: 400, headers: corsHeaders() });
    }

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code,
        }),
    });

    const tokenJson = await tokenRes.json();
    if (!tokenJson.access_token) {
        return new Response(JSON.stringify(tokenJson), {
            status: 400,
            headers: { "content-type": "application/json", ...corsHeaders() },
        });
    }

    // Store token briefly in KV, redirect frontend with a one-time code
    const onetimeCode = crypto.randomUUID();
    await env.TOKEN_STORE.put(onetimeCode, tokenJson.access_token, { expirationTtl: 60 });

    return new Response(null, {
        status: 302,
        headers: {
            "Location": `${ALLOWED_ORIGIN}/VigilCI/?session=${onetimeCode}`,
            ...corsHeaders(),
        },
    });
}

async function handleSession(request, url, env) {
    const code = url.searchParams.get("code");
    if (!code) {
        return new Response("Missing code", { status: 400, headers: corsHeaders() });
    }

    const token = await env.TOKEN_STORE.get(code);
    if (!token) {
        return new Response("Invalid or expired code", { status: 400, headers: corsHeaders() });
    }

    await env.TOKEN_STORE.delete(code);

    return new Response(JSON.stringify({ ok: true }), {
        headers: {
            "content-type": "application/json",
            "Set-Cookie": [
                `gh_token=${token}`,
                "HttpOnly",
                "SameSite=Lax",
                "Path=/",
                "Max-Age=28800",
            ].join("; "),
            ...corsHeaders(),
        },
    });
}

async function handleGitHubProxy(request, url, env) {
    const token = getToken(request);
    if (!token) {
        return new Response("Unauthorised", { status: 401, headers: corsHeaders() });
    }

    const githubPath = url.pathname.replace(/^\/github/, "");
    const githubUrl = `https://api.github.com${githubPath}${url.search}`;

    const githubRes = await fetch(githubUrl, {
        method: request.method,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "User-Agent": "VigilCI",
            "Content-Type": request.headers.get("Content-Type") ?? "application/json",
        },
        body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
    });

    return new Response(githubRes.body, {
        status: githubRes.status,
        headers: {
            "content-type": githubRes.headers.get("content-type") ?? "application/json",
            ...corsHeaders(),
        },
    });
}

async function handleLogout(request, url, env) {
    return new Response(null, {
        status: 302,
        headers: {
            "Location": `${ALLOWED_ORIGIN}/VigilCI/`,
            "Set-Cookie": "gh_token=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
            ...corsHeaders(),
        },
    });
}