# Changelog

## Report Selector Modal + Bulk History Actions + Gemini Confidence Fixes — 2026-07-27

Replaced hidden Ask Aegis button with always-visible trigger and full-screen report selector modal (single + bulk modes). Added bulk selection, delete, export, and tri-state select-all on the history log. Added confidence criteria to Gemini prompts and reduced token consumption (model reorder, output cap, fast-fail on 429, compressed prompts). Fixed Vue 3 `Set` reactivity crash and unclosed `</div>` build failure.

Commits: `e76bd0f`, `bb27ae5`, `a43c5ba`, `f99600d`

---

## Filipino (Tagalog) i18n Support — 2026-07-27

Added `vue-i18n` with `en`/`fil` locale files, persisted language toggle, and `$t()` migration across all 7 citizen views and composables. Filipino is the default locale.

Commits: `c4ce64e`, `9d97de8`

---

## GPS Accuracy Fix — 2026-07-27

Fixed inaccurate SOS coordinates by implementing two-phase GPS acquisition (high-accuracy → low-accuracy fallback), accuracy threshold validation, and fresh location fetch on SOS dispatch instead of stale cached data.

Commit: `fdb7f6e`

---

## Hotspot Map Fix — 2026-07-27

Added individual incident markers (SOS at exact GPS, community reports at barangay centers) to the density map. Corrected all 18 barangay coordinates from PhilAtlas data and updated map center to official city coordinates.

Commits: `fdb7f6e`, `8aedb42`, `c08278a`

---

## Seed Data & Barangay Lookup Fix — 2026-07-27

Removed hardcoded seed SOS/reports that polluted hotspot rankings. Replaced hardcoded `'Tagapo'` barangay with `findNearestBarangay()` GPS-based lookup across GPS composable, SOS dispatch, and store paths. Fixed `fetchActiveReports()` to clear data on empty Supabase results.

Commit: `fdb7f6e`

---

## Hardcoded Barangay Fallback Elimination — 2026-07-27

Removed all remaining hardcoded `'Tagapo'` fallbacks in the SOS dispatch chain (GPS composable, SOSView, useSOS composable, sosStore). Replaced with `findNearestBarangay()` computation from actual coordinates. Removed fake `'Op-01'` operator fallback.

Commit: `fdb7f6e`

---

## Live SOS Feed Polling Fallback — 2026-07-27

Added 10-second polling fallback and manual refresh button to the operator SOS feed (supplementing Realtime). Added HTTP error logging on SOS POST failures.

Commit: `df199c4`

---

## Multi-Scenario Aegis Advisory + Bug Fixes — 2026-07-27

Added 5 selectable disaster scenarios (Flood, Earthquake, Typhoon, Fire, Landslide) with tailored prompts and scenario badges. Fixed 17 bugs including: edge function catch returning raw error instead of structured fallback, duplicate `buildPrompt()`, try-scoped variable leaks in fallback paths, missing `scenario_type` in client fallback, `setInterval` leak on HMR, unbounded fetch, stale reactive references, null guards in sorting/dashboard, and missing DB indexes.

Commit: `e42d271`
