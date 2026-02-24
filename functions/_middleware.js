/**
 * Cloudflare Pages Middleware
 * - Routes tuner.songscribe.io to serve files from /tuner/ subfolder
 * - Redirects songscribe.io/tuner/* to tuner.songscribe.io/*
 */
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  // Redirect songscribe.io/tuner paths to tuner subdomain
  if (url.hostname === "songscribe.io" && url.pathname.startsWith("/tuner")) {
    const subPath = url.pathname.replace(/^\/tuner\/?/, "/");
    return Response.redirect(`https://tuner.songscribe.io${subPath}`, 301);
  }

  // Serve tuner subdomain from /tuner/ subfolder
  if (url.hostname === "tuner.songscribe.io") {
    let assetPath = url.pathname === "/" ? "/tuner/index.html" : `/tuner${url.pathname}`;
    if (!assetPath.includes(".")) assetPath += ".html";
    return env.ASSETS.fetch(`https://songscribe.io${assetPath}`);
  }

  return next();
}
