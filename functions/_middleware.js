/**
 * Cloudflare Pages Middleware
 * Routes tuner.songscribe.io requests to serve files from the /tuner/ subfolder.
 */
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (url.hostname === "tuner.songscribe.io") {
    const newPath = url.pathname === "/" ? "/tuner/" : `/tuner${url.pathname}`;
    const resp = await env.ASSETS.fetch(`https://songscribe.io${newPath}`);
    return new Response(
      `DEBUG: status=${resp.status}, location=${resp.headers.get("location")}, type=${resp.headers.get("content-type")}`,
      { status: 200 }
    );
  }

  return next();
}
