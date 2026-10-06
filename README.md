# TRMG Fall 2026 Conference App

Live at: https://<nacm-github-account>.github.io/trmg-fall-2026/

## Updating (all in the CONFIG block near the top of the <script> in index.html)
- **Roster:** Google Sheet → File → Share → Publish to web → pick the tab → CSV → paste the link into `ROSTER_CSV_URL`.
  Columns: `Company, First Name, Last Name, Type, Email` (Type = Member or Associate).
  Members show name + company; Associates also show email. Sheet edits appear in the app automatically (Google refreshes its published copy every ~5 min).
- **Wifi:** fill in `WIFI_NETWORK` and `WIFI_PASSWORD`.
- **Hotel map:** upload the image next to index.html (e.g. `hotel-map.jpg`) and set `HOTEL_MAP_IMG: "hotel-map.jpg"`.
- **Agenda changes:** edit the `DAYS` list (24-hour times, Eastern).

## Testing
Add `?now=2026-10-19T09:45` to the URL to preview the "Happening now / Up next" cards for any time.
