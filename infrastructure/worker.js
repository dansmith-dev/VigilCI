const ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "https://dansmith-dev.github.io",
];

function corsHeaders(request) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
        if (url.pathname === "/analyze" && request.method === "POST") return handleAnalyze(request, env);

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

async function handleAnalyze(request, env) {
    let body;
    try {
        body = await request.json();
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
            status: 400,
            headers: { "content-type": "application/json", ...corsHeaders(request) },
        });
    }

    const { testName, timeline, regressions } = body;
    if (!testName || !timeline || !regressions) {
        return new Response(JSON.stringify({ error: "Missing required fields: testName, timeline, regressions" }), {
            status: 400,
            headers: { "content-type": "application/json", ...corsHeaders(request) },
        });
    }

    const timelineText = timeline
        .map((t) => `  ${t.timestamp} | commit ${t.commit.slice(0, 7)} | ${t.segments.map((s) => `${s.name}: ${s.averageMs.toFixed(1)}ms`).join(", ")}`)
        .join("\n");

    const regressionsText = regressions
        .map((r) => {
            let text = `--- Commit ${r.commit.slice(0, 7)} (${r.message})\n`;
            text += `    Slowdown: ${r.segment} went from ${r.previousMs.toFixed(1)}ms to ${r.currentMs.toFixed(1)}ms (+${r.deltaMs.toFixed(1)}ms)\n`;
            if (r.diff) {
                const truncated = r.diff.length > 1500 ? r.diff.slice(0, 1500) + "\n... (truncated)" : r.diff;
                text += `    Diff:\n${truncated}`;
            }
            return text;
        })
        .join("\n\n");

    const prompt = `You are a performance analysis assistant for CI test results. Be concise and specific.

    Test: "${testName}"
    
    Timeline (chronological):
    ${timelineText}
    
    Commits that introduced slowdowns:
    ${regressionsText}
    
    Provide a brief analysis:
    1. Which changes most likely caused each regression and why
    2. Patterns in the code that explain the slowdown
    3. Specific suggestions for improvement
    
    Keep the response under 300 words. Use plain text, not markdown.`;

    try {
        const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "user", content: prompt }],
            max_tokens: 512,
        });

        const analysis = aiResponse.response || aiResponse.result || "No analysis generated.";

        return new Response(JSON.stringify({ analysis }), {
            headers: { "content-type": "application/json", ...corsHeaders(request) },
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "AI analysis failed: " + (err.message || "unknown error") }), {
            status: 500,
            headers: { "content-type": "application/json", ...corsHeaders(request) },
        });
    }
}
