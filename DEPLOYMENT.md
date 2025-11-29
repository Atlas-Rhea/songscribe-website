# Deployment Guide

## Issue: 3D Logo Not Working in Production

The site was recently migrated to Vite and now requires a build step. Cloudflare Pages needs to be configured to build the site before deployment.

## Solution

### Update Cloudflare Pages Build Settings

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to your **Pages** project for `songscribe.io`
3. Go to **Settings** → **Builds & deployments**
4. Update the build configuration:
   - **Build command**: `npm install && npm run build`
   - **Build output directory**: `dist`
   - **Framework preset**: Vite (or None if Vite preset not available)
   - **Node version**: 18 or higher

### What Changed

- The site now uses Vite with ES modules (`import` statements)
- The source code in `src/` needs to be bundled for production
- The build process:
  - Bundles JavaScript modules into a single file
  - Processes CSS imports
  - Copies `_redirects` and `functions/_headers` to the output directory
  - Outputs everything to the `dist/` folder

### Verification

After updating the build settings, trigger a new deployment. The 3D logo should work correctly because:

1. ✅ JavaScript modules are properly bundled
2. ✅ CSS is processed and included
3. ✅ All assets are in the correct locations
4. ✅ Cloudflare-specific files (`_redirects`, `functions/_headers`) are copied

### Local Testing

To test the production build locally:

```bash
npm run build
npm run preview
```

This will build the site and serve it from the `dist/` folder, matching the production environment.

