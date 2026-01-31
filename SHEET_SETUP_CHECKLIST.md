# Why form data might not appear in your Google Sheet

Follow these steps so enquiries show up in your sheet.

---

## 1. Run `setup()` once

In Google Apps Script:

1. Open your project: [script.google.com](https://script.google.com)
2. Open the spreadsheet that should receive the data (same Google account).
3. In the script editor, select the function **`setup`** in the dropdown.
4. Click **Run** (▶).
5. If asked, approve permissions (review and allow).

Until `setup()` is run, the script does not know which spreadsheet to use, so no rows are written.

---

## 2. Sheet tab and headers

- The tab name must be **exactly** `Sheet1` (or change `sheetName` in the script to match).
- **Row 1** must be headers. Use these **exact** names (order can change):

  | Name | Phone | Duration | Date | Details | Timestamp | WhatsApp Reply Link |

  You can use fewer columns (e.g. only Name, Phone, Duration, Date, Details). The script fills Timestamp and WhatsApp Reply Link only if those columns exist.

---

## 3. Use the corrected script

Copy the full code from **`GoogleAppsScript_Code.gs`** into your Apps Script project (replace all existing code). The fix for writing one row is:

- **Wrong:** `getRange(nextRow, 1, nextRow, newRow.length)` → writes many rows.
- **Correct:** `getRange(nextRow, 1, 1, newRow.length)` → writes one row.

---

## 4. Deploy as Web app

1. In Apps Script: **Deploy** → **New deployment**.
2. Click the gear icon → **Web app**.
3. **Execute as:** Me  
4. **Who has access:** Anyone (or “Anyone, even anonymous” if you want).
5. Click **Deploy** and copy the **Web app URL**.
6. In **index.html**, set `scriptURL` to this exact URL (the one ending in `/exec`).

After changing the script, create a **New version** in **Deploy** → **Manage deployments** → Edit (pencil) → **Version** → **New version** → **Deploy**. The URL stays the same.

---

## 5. Test from a real URL (not file://)

Opening **index.html** from your PC (e.g. double‑click, or `file:///...`) can block the request in some browsers.

- Upload the site to **Google Drive** (as a site or shared HTML), or  
- Use **GitHub Pages**, **Netlify**, or any web host, and open the site with `https://...`.

Then submit the form from that URL and check the sheet.

---

## 6. Check script URL in index.html

In **index.html**, the line should be:

```javascript
const scriptURL = "https://script.google.com/macros/s/AKfycbztI-7SfuvC9uoD158jVcPmbcNLPIq95kbJM6sTVHDqA5Az6vP6KRyjNrhleAGQgNl/exec";
```

If you deployed a new Web app, replace with your new URL.

---

## Quick checklist

- [ ] `setup()` run once with the correct spreadsheet open  
- [ ] Sheet tab name is `Sheet1` (or script updated)  
- [ ] Row 1 has headers: Name, Phone, Duration, Date, Details (and optionally Timestamp, WhatsApp Reply Link)  
- [ ] Full code from `GoogleAppsScript_Code.gs` is in the project  
- [ ] Web app deployed; **index.html** uses that exact Web app URL  
- [ ] Form tested from a real web URL (not file://)

After this, new submissions should appear as new rows in your sheet.
