# Deployment Guide

## 1. Firebase Setup (Database)
Since GitHub Pages is static (read-only), we use Firebase Realtime Database to store your website content so you can edit it dynamically.

1.  Go to [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project (e.g., "gunash-venue-cms").
3.  **Authentication**:
    *   Go to **Build > Authentication**.
    *   (Optional) Enable Email/Password if you want strictly secure admin access later, but for now our code uses a simple password check.
4.  **Realtime Database**:
    *   Go to **Build > Realtime Database**.
    *   Click **Create Database**.
    *   Choose a location (e.g., Singapore or US).
    *   **Security Rules**: Start in **Test Mode** or use these rules:
        ```json
        {
          "rules": {
            ".read": true,
            ".write": true
          }
        }
        ```
        *(Note: In a production app, you should restrict `.write` to authenticated users only. Since we are using a simple client-side password, anyone with the API key *could* technically write, but for a small personal site this is often acceptable risk if you keep backups. For better security, enable Firebase Auth in the code.)*
5.  **Get Configuration**:
    *   Go to **Project Settings** (gear icon).
    *   Scroll to **Your apps** > **Web app** > **</>**.
    *   Copy the `firebaseConfig` object.
    *   Paste it into `js/firebase-config.js`.

## 2. Deploying to GitHub Pages
1.  Upload all files to your GitHub repository.
2.  Go to **Settings > Pages**.
3.  Select **Source**: `Deploy from a branch` (usually `main` or `master`).
4.  Save. Your site will be live at `https://yourusername.github.io/your-repo/`.

## 3. Using the Admin Panel
1.  Navigate to `https://yourusername.github.io/your-repo/admin/`.
2.  Login with the password (default: `admin123` - change this in `admin/admin.js`).
3.  Make edits.
4.  Click **Save Changes**.
    *   This updates the Firebase Database.
    *   The public website (`index.html`) automatically fetches the latest data from Firebase.

## 4. Backup & Safety
*   Use the **Download Backup** button in the Admin Panel regularly.
*   If anything breaks, use **Restore from File** to upload your `content.json` or a previous backup.
