export default {
    async fetch(request, env, ctx) {
        return new Response(request, {
            headers: { "content-type": "text/plain" },
        });
    },
};