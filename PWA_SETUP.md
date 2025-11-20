# PWA Setup Guide

This guide documents the Progressive Web App (PWA) features for FoodieHub.

## Features

- Web App Manifest (`/manifest.json`)
- Custom service worker (`/sw.js`)
- Offline fallback page (`/offline`)
- Basic asset caching
- Installable experience with theme color and icon

## Files

| File | Purpose |
| --- | --- |
| `app/manifest.ts` | Generates the manifest served at `/manifest.json` |
| `public/icons/icon.svg` | Base icon used for the PWA |
| `public/sw.js` | Service worker handling caching/offline logic |
| `components/providers.tsx` | Registers the service worker on the client |
| `app/offline/page.tsx` | Offline fallback page |

## Customizing the Icon

Replace `public/icons/icon.svg` with your own PNG or SVG icon (recommended sizes: `192x192` and `512x512`). Update `app/manifest.ts` with the correct file names/sizes if you add additional icons.

## Service Worker Behavior

- Pre-caches key assets including the offline page and manifest
- Serves cached assets when offline
- Provides `/offline` fallback for navigation requests
- Skips caching for API routes and non-GET requests

## Development Notes

- Service workers only register in production builds. Use `npm run build && npm start` to test locally.
- When updating the service worker, increment the `CACHE_NAME` to force clients to fetch the new version.
- The service worker requires HTTPS in production (except on `localhost`).

## Testing Checklist

1. Run `npm run build && npm start`
2. Open the app in Chrome/Edge
3. In DevTools > Application tab, verify:
   - Manifest is detected
   - Service worker is installed and activated
4. Use the “Add to home screen” or “Install” prompt
5. Switch to offline mode, confirm the offline page displays for navigations

## Deployment Requirements

- Ensure `/sw.js`, `/icons/icon.svg`, and `/manifest.json` are deployed in the `public` directory.
- Set appropriate caching headers (default Vercel behavior works).


