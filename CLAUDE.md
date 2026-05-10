# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-page event registration system. No build step, no dependencies, no package manager — just two files:

- `index.html` — entire frontend (HTML + CSS + JS in one file)
- `Code.gs` — Google Apps Script backend (deployed as a web app)

## Deployment

- **Frontend:** Netlify → `https://asvdj.netlify.app/` (push to `master` auto-deploys)
- **Backend:** Google Apps Script web app — URL is hardcoded in `index.html` as `APPS_SCRIPT_URL`
- To update the backend, edit `Code.gs` in the Apps Script editor and redeploy as a new version

## Architecture

### Two views, one HTML file

Routing is purely URL-param based — no router library:

```
?name=... present  →  show #eventView   (participant registration)
?name=... absent   →  show #builderView (organiser event setup)
```

Both `#builderView` and `#eventView` are in the DOM at load; the inactive one is `display:none`.

### Data flow

1. **Builder** encodes all event details (name, date, time, venue, about, program items) into URL query params and appends them to `SITE_BASE_URL`
2. **Event page** reads those params via `URLSearchParams`, renders the event info, then shows the 3-step registration form
3. **Form submission** sends a GET request (mode: `no-cors`) to `APPS_SCRIPT_URL` with all form fields as query params
4. **Apps Script** (`doGet`) saves a row to Google Sheets and sends a confirmation email

### Program schedule encoding

Each program item is encoded as a single `p` param: `time|title|description`. Multiple items use repeated `p` params (`params.getAll('p')`).

### Key constants (both files)

| Constant | File | Purpose |
|---|---|---|
| `APPS_SCRIPT_URL` | index.html | Google Apps Script web app endpoint |
| `SITE_BASE_URL` | index.html | Netlify URL used as base for generated links |
| `SPREADSHEET_ID` | Code.gs | Google Sheet where registrations are saved |
| `SHEET_NAME` | Code.gs | Sheet tab name (`Registrations`) |

### Apps Script functions

- `doGet(e)` — handles form submissions (GET with query params)
- `saveRegistration(p)` — deduplicates by email+event, appends row, sends email
- `sendConfirmationEmail(p)` — sends HTML confirmation email via `MailApp`
- `updateHeaders()` — run once manually to fix sheet column headers
- `testSave()` / `testEmail()` — manual test helpers, run from Apps Script editor

## Making changes

**Frontend only** (`index.html`): edit and push — Netlify deploys automatically.

**Backend** (`Code.gs`): copy changes into the Apps Script editor at `script.google.com`, save, then *Deploy → Manage deployments → New version*. The `APPS_SCRIPT_URL` in `index.html` stays the same across versions.

**Adding form fields**: update all three places — the HTML field, the `p` URLSearchParams object in the submit handler, and the `HEADERS` + `sheet.appendRow()` in `Code.gs`.
