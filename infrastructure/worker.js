const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://dansmith-dev.github.io",
];

function corsHeaders(request) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders(request) });
        }

        if (url.pathname === "/exchange") return handleExchange(request, url, env);

        return new Response("Not found", { status: 404, headers: corsHeaders(request) });
    },
};

async function handleExchange(request, url, env) {
    const code = url.searchParams.get("code");
    if (!code) return new Response("Missing code", { status: 400, headers: corsHeaders(request) });

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
            headers: { "content-type": "application/json", ...corsHeaders(request) },
        });
    }

    return new Response(JSON.stringify({ token: tokenJson.access_token }), {
        headers: { "content-type": "application/json", ...corsHeaders(request) },
    });
}