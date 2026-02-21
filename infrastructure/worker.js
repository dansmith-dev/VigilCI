export default {
    async fetch(request, env, ctx) {
        const code = request.headers.get("code");
        
        return new Response(code, {
            headers: { "content-type": "text/plain" },
        });
    },
};