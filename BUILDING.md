# Frontend assets

The site serves precompiled React and Tailwind assets to avoid downloading browser-side compilers at the event.

- Edit `src/index-app.jsx` for the camera homepage flow.
- Edit the other HTML/JS files for the admin, QR flow and uploads.
- Run `npm install` then `npm run build` after any UI/class changes.
- Commit `assets/build/index-app.js` and `assets/build/ui.css` with the source edits.
- Bump the `?v=` asset version in the affected pages for a release.

All photo previews use `/api/preview`. Production downloads and compositing must use `/api/image` (original bytes), never preview thumbnails. Automatic order downloads remain disabled.
