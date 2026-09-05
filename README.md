# HappyJourney

Crowd-sensed road damage detection and accountability, set in Guwahati, Assam.
Citizens report potholes just by driving; authorities cannot close a ticket
until the road itself says it is fixed.

Fourteen screens, two skins sharing one design language:

| | Citizen (`concrete`, white) | Authority (`asphalt`, black) |
|---|---|---|
| `/` | C1 home | |
| `/drive` | C2 drive HUD (full bleed) | |
| `/drive/mobile` | C3 phone frames | |
| `/routes` | C4 route comparison | |
| `/reports` | C5 my reports | |
| `/board` | C6 public accountability board | |
| | | `/console` A1 command centre |
| | | `/tickets` A2 ticket queue |
| | | `/tickets/[id]` A3 ticket detail (no sidebar) |
| | | `/verification` A4 verification queue |
| | | `/escalations` A5 escalation ladder |
| | | `/forecast` A6 predictive maintenance |
| | | `/contractors` A7 contractors and work orders |
| | | `/model` A8 detection quality |

## Run

```bash
npm install
npm run dev
```

## Layout

```
app/(citizen)/    light theme, TopNav
app/(authority)/  dark theme, Rail + TopBar + per-screen Sidebar
components/system/  Panel Chip Btn Bar KpiTile StatPlate Avatar Stat, ThemeProvider
components/chrome/  TopNav Rail TopBar Sidebar JurisdictionTree FilterGroup Brand Icons
components/data/    RoadMap RoughnessTrace Charts EvidenceFrame
lib/tokens.ts       colours, tone/severity mapping, derived colour rules
lib/types.ts        the domain shapes
lib/fixtures/       mock data, one file per domain
```

Screens are designed at 1440 × 1024 and fit that height with no page scroll —
long tables scroll inside their panel instead.

## Notes on the visuals

- **No tile provider.** `RoadMap` renders a deterministic SVG from a fixed road
  graph of Guwahati arterials in normalised `[0,1]` space, so one graph serves a
  266 px thumbnail and a 1024 px full-bleed column. Swap in MapLibre later by
  keeping the props and restyling the tiles to the palette in the component.
- **No chart library.** `BarChart`, `LineChart` and `Gauge` are hand-rolled SVG
  so they match the hairline weights and the Geist numerals.
- **`EvidenceFrame`** generates a road-looking placeholder (perspective road,
  receding centre line, horizon silhouettes) plus the damage itself — pothole,
  alligator cracking, crack, or a repaired bitumen patch — with optional night
  wash and detection boxes.
- Every derived SVG coordinate is rounded: raw floats differ in the last digit
  between Node and the browser, which trips React hydration.
- Each map/frame instance gets a `useId()`-scoped gradient and filter id.

## Interaction that is live

- **Role switcher** in the TopBar (Ward Engineer → Executive Engineer →
  Commissioner) changes the breadcrumb, scope, queue size and KPI numbers.
- **Live detection feed** on A1 pushes a new row every few seconds, increments
  the open-damage KPI and announces politely.
- **Ticket actions** on A3 (acknowledge, assign contractor) append a fresh
  hash-chained row to the audit trail.
- **Verification** on A4: "Mark clean pass" advances the pass counter.
- **Route toggle** on C4 switches the highlighted route and the selected card.
- **Filters** on A2: the sidebar checkboxes filter the table client-side and the
  selection drives the bulk-assign toolbar.

## Sample data

`npm run seed` fills the database with enough road to work the ticketing system:
five authorities forming the full ladder (two Guwahati wards → east zone →
GMC commissioner → Assam PWD), three panel contractors, and twelve tickets
spread across every state, several already forwarded partway up the chain.
Audit chains are hash-linked exactly as the app writes them, so seeded tickets
verify as intact.

```
npm run seed                    insert or refresh it
npm run seed -- --reset         delete it, then insert it again
npm run seed -- --drop          delete it and stop
npm run seed -- --device <id>   report it as your browser (the rs_device cookie)
```

It only ever touches what it wrote — authorities `hj-`, contractors `hj-c-`,
tickets `HJ-<year>-`, defects and uploads `seed:`. Evidence thumbnails are flat
placeholders written to `public/seed/`, so nothing depends on the ML service
having seen these roads.

Worth trying: `HJ-<year>-0002` is old and never forwarded, `-0005` is already
with the state department so forwarding it must refuse, `-0010` is closed, and
`-0012` sits outside every jurisdiction and shows what an unowned ticket does.

## Known gaps

- Escalation is entirely manual: a ticket reaches its authority the moment it is
  opened, and climbs the ladder only when somebody presses "Forward to higher
  ups" (POST /api/tickets/{id}/forward). There are no SLA clocks and nothing
  escalates on a timer.
- Following a ticket (C1/C5) is not persisted.
- Responsive: the authority sidebar hides below 1200 px rather than collapsing
  to a 56 px icon strip with a slide-over; column dropping is implemented on the
  A2 queue table only.
# Nitin-Gadkari-ka-kamal
