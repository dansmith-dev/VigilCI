export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname !== "/exchange") {
            return new Response("Not found", { status: 404 });
        }

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
            return new Response(JSON.stringify(tokenJson, null, 2), {
                status: 400,
                headers: { "content-type": "application/json" },
            });
        }

        return Response.redirect(
            `http://localhost:5173/VigilCI/#token=${encodeURIComponent(tokenJson.access_token)}`,
            302
        );
    },
};