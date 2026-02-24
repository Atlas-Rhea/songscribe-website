/**
 * Cloudflare Pages Middleware
 * Routes tuner.songscribe.io requests to serve files from the /tuner/ subfolder.
 */
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  if (url.hostname === "tuner.songscribe.io") {
    const newPath = url.pathname === "/" ? "/tuner/" : `/tuner${url.pathname}`;
    let newPath = url.pathname === "/" ? "/tuner/index.html" : `/tuner${url.pathname}`;
    if (!newPath.includes(".")) newPath += ".html";
    const resp = await env.ASSETS.fetch(`https://songscribe.io${newPath}`);
    const body = await resp.text();
    const title = body.match(/<title>(.*?)<\/title>/)?.[1] || "no title found";
    return new Response(`DEBUG: path=${newPath}, title=${title}`, { status: 200 });
  }

  return next();
}
