export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/exchange") return handleExchange(request, url, env);
        if (url.pathname.startsWith("/github/")) return handleGitHubProxy(request, url, env);

        return new Response("Not found", { status: 404 });
    },
};

async function handleExchange(request, url, env) {
    const code = url.searchParams.get("code");
    if (!code) return new Response("Missing code", { status: 400 });

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
        return new Response(JSON.stringify(tokenJson), { status: 400 });
    }

    return new Response(null, {
        status: 302,
        headers: {
            "Location": "http://localhost:5173/VigilCI/",
            "Set-Cookie": [
                `gh_token=${tokenJson.access_token}`,
                "HttpOnly",
                "Secure",
                "SameSite=Strict",
                "Path=/",
                "Max-Age=28800",
            ].join("; "),
        },
    });
}

async function handleGitHubProxy(request, url, env) {
    const cookie = request.headers.get("Cookie") ?? "";
    const token = cookie.split(";").find(c => c.trim().startsWith("gh_token="))
        ?.split("=")[1]?.trim();

    if (!token) return new Response("Unauthorised", { status: 401 });

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
            "Access-Control-Allow-Origin": "http://localhost:5173",
            "Access-Control-Allow-Credentials": "true",
        },
    });
}