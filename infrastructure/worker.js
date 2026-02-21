const ALLOWED_ORIGIN = "https://daniel-smith.github.io";

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders() });
        }

        if (url.pathname === "/exchange") return handleExchange(request, url, env);

        return new Response("Not found", { status: 404, headers: corsHeaders() });
    },
};

async function handleExchange(request, url, env) {
    const code = url.searchParams.get("code");
    if (!code) return new Response("Missing code", { status: 400, headers: corsHeaders() });

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

    return new Response(JSON.stringify({ token: tokenJson.access_token }), {
        headers: { "content-type": "application/json", ...corsHeaders() },
    });
}