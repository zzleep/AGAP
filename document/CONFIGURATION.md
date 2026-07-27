# Configuration Reference

## Environment Variables (`.env`)

```
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# OpenWeatherMap (Required for weather features)
VITE_OPENWEATHER_API_KEY=your-openweather-api-key-here

# Backend secrets (NEVER prefix with VITE_)
GEMINI_API_KEY=your-gemini-api-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
```

## Build Configuration

### Vite (`vite.config.js`)
- **Plugins**: `@vitejs/plugin-vue`, `vite-plugin-pwa`
- **Resolve alias**: `@` -> `./src`
- **PWA config**:
  - Auto-register, auto-update
  - Manifest: name, icons (192x192, 512x512 SVG), standalone display
  - Workbox: CacheFirst for Leaflet tiles (1000 entries, 30-day TTL)
  - Workbox: BackgroundSync for `sos_reports` POST (24-hour retention, `sos-queue`)

### TailwindCSS (`tailwind.config.js`)
- **Content**: `index.html`, `src/**/*.{vue,js,ts,jsx,tsx}`
- **Custom colors**:
  - `brand`: dark (#0f172a), card (#1e293b), border (#334155), primary (#2563eb)
  - `emergency`: red, orange, yellow, green, amber
- **Custom animation**: `pulse-fast` (1s pulse)

### PostCSS (`postcss.config.js`)
- **Plugins**: `tailwindcss`, `autoprefixer`

## PWA / Service Worker

- **Registration**: Auto by `vite-plugin-pwa`
- **Precached assets**: `**/*.{js,css,html,ico,png,svg,json,md,woff2}`
- **Tile caching**: CacheFirst for `*.tile.openstreetmap.org` (30-day TTL, 1000 entries)
- **Background Sync**: NetworkOnly POST to `sos_reports` endpoint, queued in `sos-queue` (24-hour max retention)
- **Theme color**: `#0f172a` (slate-900)

## CSS / Theming

- **Base**: TailwindCSS with dark theme defaults
- **Background**: `#0f172a` (slate-900)
- **Text**: `#f8fafc` (slate-50)
- **Leaflet overrides**: Dark tile appearance via CSS filter/opacity on `.leaflet-container`
- **PWA viewport**: `viewport-fit=cover`, `user-scalable=no`, black-translucent status bar
