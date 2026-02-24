/**
 * Cloudflare Pages Middleware
 * - Routes tuner.songscribe.io to serve files from /tuner/ subfolder
 * - Redirects songscribe.io/tuner/* to tuner.songscribe.io/*
 */
export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);

  // Redirect www to non-www
  if (url.hostname === "www.songscribe.io") {
    url.hostname = "songscribe.io";
    return Response.redirect(url.toString(), 301);
  }

  // Redirect songscribe.io/tuner paths to tuner subdomain
  if (url.hostname === "songscribe.io" && url.pathname.startsWith("/tuner")) {
    const subPath = url.pathname.replace(/^\/tuner\/?/, "/");
    return Response.redirect(`https://tuner.songscribe.io${subPath}`, 301);
  }

  // Serve tuner subdomain
  if (url.hostname === "tuner.songscribe.io") {
    // Static assets (CSS, JS, images, fonts) — serve from project root
    if (url.pathname.startsWith("/assets/") || /\.(css|js|svg|png|jpg|gif|woff2?|ico)$/.test(url.pathname)) {
      return env.ASSETS.fetch(`https://songscribe.io${url.pathname}`);
    }

    // Pages — serve from /tuner/ subfolder
    let assetPath = url.pathname === "/" ? "/tuner/index.html" : `/tuner${url.pathname}`;
    if (!assetPath.includes(".")) assetPath += ".html";
    return env.ASSETS.fetch(`https://songscribe.io${assetPath}`);
  }

  return next();
}
