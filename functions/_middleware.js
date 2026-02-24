/**
 * Cloudflare Pages Middleware
 * Routes tuner.songscribe.io requests to serve files from the /tuner/ subfolder.
 */
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (url.hostname === "tuner.songscribe.io") {
    return new Response("MIDDLEWARE RUNNING - path: " + url.pathname, { status: 200 });
  }

  return next();
}
