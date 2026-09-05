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

`npm run seed` fills the database with road damage to work the ticketing system
on — fourteen defects across every severity and damage class, including two
pairs close enough together to exercise clustering.

It seeds damage and nothing else. Authorities and contractors are real
organisations; whichever ones you have registered (MoRTH, NHAI, a ward office)
are the ones a ticket should route to, so the script never invents any. Nor does
it write tickets: once the defects exist it asks the running app to open them
through `POST /api/tickets`, so clustering, jurisdiction routing and the
hash-chained audit trail all come from `lib/tickets.ts` rather than a copy of
it. Start `npm run dev` first.

```
npm run seed                        insert it and open the tickets
npm run seed -- --reset             delete it, then do that again
npm run seed -- --drop              delete it and stop
npm run seed -- --near <lat,lng>    put the damage inside a jurisdiction of yours
npm run seed -- --url <origin>      the running app (default localhost:3000)
npm run seed -- --device <id>       file it under your rs_device cookie
npm run seed -- --no-tickets        write the defects and stop
```

Without `--near` the damage is centred on your most local registered
jurisdiction, so the tickets land with a real owner; with no jurisdictions
registered it falls back to Guwahati and reports the tickets as unowned. Only
the critical and high defects are ticketed, matching what the app auto-tickets
on upload — the six milder ones stay in the incoming pile. Evidence thumbnails
are flat placeholders in `public/seed/`, so nothing depends on the ML service
having seen these roads.

The script only removes what it wrote: uploads and defects prefixed `seed:`, and
the tickets covering those defects.

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
