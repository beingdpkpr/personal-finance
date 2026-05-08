# Mobile

DKP Finance is a **Progressive Web App (PWA)** — no separate native app is needed.

## Install on Android

1. Open the app in Chrome
2. Tap the three-dot menu → **Add to Home screen**
3. The app opens full-screen with a dark status bar matching the UI

## Install on iOS

1. Open the app in Safari
2. Tap the Share icon → **Add to Home Screen**

## What's included

- Offline shell — Workbox service worker precaches all JS/CSS/HTML/fonts at build time
- Google Fonts cached for 1 year (CacheFirst)
- `display: standalone` — no browser chrome when launched from home screen
- Theme colour `#08080a` matches the app on Android

## Icons

| File | Size | Use |
|---|---|---|
| `public/icon-192.png` | 192×192 | Android home screen |
| `public/icon-512.png` | 512×512 | Android splash / maskable adaptive icon |
| `public/apple-touch-icon.png` | 180×180 | iOS home screen |
| `public/favicon.svg` | 32×32 | Browser tab |
