# Folder Structure & Architecture

## Core Architecture
This project uses a **Headless JSON CMS** approach.
- **Frontend**: Standard HTML/CSS/JS (`index.html`).
- **Data**: All text/images are stored in `content.json` (local) or Firebase (cloud).
- **Admin**: A separate interface (`admin/`) to edit the data.

## Directory Tree

```
/ (Root)
├── index.html            # Main public website
├── content.json          # Default content (fallback if Firebase is offline)
├── js/
│   ├── cms.js            # The brain: Fetches data & updates the DOM
│   ├── firebase-config.js# Firebase API keys
│   └── script.js         # Visual effects (parallax, scroll, etc.)
├── admin/
│   ├── index.html        # Admin Dashboard UI
│   ├── admin.js          # Admin logic (Login, Forms, Save to Firebase)
│   └── style.css         # Admin styling (if separate, or inline)
├── css/
│   └── style.css         # Main website styling
└── assets/               # Images and icons
```

## How It Works (Data Flow)

1.  **Public User** visits `index.html`.
    *   `js/cms.js` runs.
    *   It checks Firebase for the latest content.
    *   If found, it updates the page text/images instantly.
    *   If not found, it loads `content.json` as a backup.
2.  **Admin** visits `/admin/`.
    *   Logs in.
    *   Edits text or reorders images via Drag & Drop.
    *   Clicks "Save".
    *   `admin/admin.js` sends the new JSON object to Firebase.
```
