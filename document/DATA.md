# Data Files

## Bundled GeoJSON (`src/data/`)

### santa_rosa_boundaries.json
Santa Rosa city boundary polygon. Used by `HotspotMap`, `EvacMap`, and `FlowEngine` components as an overlay and for clipping/containment checks.

### flood_zones.json
4 flood zone polygons with severity levels:

| Zone Name | Severity | Geometry |
|-----------|----------|----------|
| Tagapo River Channel | Danger | Polygon |
| Balibago Creek Basin | Warning | Polygon |
| Dita Low-Lying Area | Watch | Polygon |
| Laguna de Bay Lakeshore | Danger | Polygon |

Used as offline fallback by `FlowEngine` view when Supabase `flood_zones` table is unreachable.

### evac_routes.json
3 evacuation route LineStrings:

| Route Name | Barangay | Risk Level | Evac Hub |
|------------|----------|------------|----------|
| Macabling Evacuation Corridor | Macabling | Low | Macabling Elementary School |
| Tagapo River Alternate Route | Tagapo | Moderate | Tagapo Barangay Hall |
| Coastal Balibago Emergency Cut | Balibago | High | Balibago Elementary School |

Used as offline fallback by `EvacMap` and `FlowEngine` views.

## Disaster Guides (`src/guides/`)

Markdown files with YAML frontmatter loaded by `guidesStore` via `import.meta.glob`.

### flood-safety.md
- **Category**: flood
- **Content**: Immediate household safety (electrical shutoff, valuables), evacuation protocol per CDRRMO alert levels, designated evacuation centers in Santa Rosa.

### typhoon-preparedness.md
- **Category**: typhoon
- **Content**: Before/during/after typhoon phases: structural security, 3L/person/day emergency kit, hotline numbers, rising water warning signs, recovery procedures.

### earthquake-drill.md
- **Category**: earthquake
- **Content**: Duck/Cover/Hold during shaking, post-shaking evacuation checklist, safe zones identification.
