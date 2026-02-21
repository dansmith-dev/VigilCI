export default {
    async fetch(request, env, ctx) {
        return new Response("Worker is live ✅", {
            headers: { "content-type": "text/plain" },
        });
    },
};