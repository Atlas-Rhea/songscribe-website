/**
 * Cloudflare Pages Middleware
 * Routes tuner.songscribe.io requests to serve files from the /tuner/ subfolder.
 */
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (url.hostname === "tuner.songscribe.io") {
    const newPath = url.pathname === "/" ? "/tuner/" : `/tuner${url.pathname}`;
    return env.ASSETS.fetch(`https://songscribe.io${newPath}`);
  }

  return next();
}
