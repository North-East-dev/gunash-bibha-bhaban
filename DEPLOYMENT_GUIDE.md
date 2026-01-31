# 🚀 Gunash Padmawati Bibha Bhaban - Website Deployment Guide

This website now features a **Smart Admin Panel** that allows you to edit content without touching code.

## 🏗️ Architecture Overview

- **Public Website**: Built with HTML/CSS/JS (Lightweight & Fast).
- **Content System**:
  - **Mode 1 (Static)**: Reads from `content.json`. Updates require uploading a new file.
  - **Mode 2 (Instant)**: Reads from **Firebase Realtime Database**. Updates happen instantly when you click "Save" in the admin panel.
- **Admin Panel**: Located at `/admin`. Password protected (default: `admin123`).

---

## 🛠️ Step 1: Run Locally (Test on your computer)

1. Open the project folder in VS Code.
2. Install the "Live Server" extension if you haven't.
3. Right-click `index.html` -> **Open with Live Server**.
4. To test the admin panel, go to `http://127.0.0.1:5500/admin/index.html` (port may vary).
   - Password: `admin123`

---

## ⚡ Step 2: Enable Instant Updates (Firebase Setup)

To allow the admin panel to update the site instantly without you needing to upload files every time, we use **Firebase** (a free Google service).

1.  **Create a Firebase Project**:
    *   Go to [Firebase Console](https://console.firebase.google.com/).
    *   Click **Add project** -> Name it "GPBB-Website" -> Continue -> (Disable Analytics for simplicity) -> Create Project.

2.  **Create Database**:
    *   In the left sidebar, click **Build** -> **Realtime Database**.
    *   Click **Create Database**.
    *   Choose a location (e.g., Singapore or United States).
    *   **IMPORTANT**: Choose **Start in test mode**. (This allows reading/writing without complex rules setup initially).
    *   Click **Enable**.

3.  **Get Configuration**:
    *   Click the **Project Settings** (gear icon) next to "Project Overview".
    *   Scroll down to "Your apps".
    *   Click the **</> (Web)** icon.
    *   Register app (Nickname: "Website") -> Click **Register app**.
    *   **Copy the `firebaseConfig` object** (everything inside the `{ ... }`).

4.  **Connect Your Code**:
    *   Open the file `js/firebase-config.js` in your project folder.
    *   Paste the config object into the `FIREBASE_CONFIG` variable.
    *   Save the file.

Now your Admin Panel and Public Website are connected!

---

## 🚀 Step 3: Deploy to GitHub Pages

1.  **Upload/Push** all files to your GitHub repository.
2.  Go to your Repository **Settings** -> **Pages**.
3.  Under **Source**, select `main` branch (or `master`) and `/root` folder.
4.  Click **Save**.
5.  Your site will be live at `https://your-username.github.io/repo-name/`.
6.  Your admin panel will be at `https://your-username.github.io/repo-name/admin/`.

---

## 📝 How to Use the Admin Panel

1.  Go to `/admin` on your live site.
2.  Login with `admin123`.
3.  Edit text, change numbers, or paste new image URLs.
4.  Click **Save Changes**.
    *   **If Firebase is connected**: The public site updates instantly!
    *   **If NOT connected**: It will download a `content.json` file. You must upload this file to your GitHub repository manually to apply changes.

## 🔒 Security Note

- The current admin password (`admin123`) is basic. To change it, open `admin/admin.js` and search for `admin123`.
- Firebase "Test Mode" is open for development. For production, you should update Firebase Rules to allow *read* for everyone but *write* only for authenticated users (requires enabling Firebase Auth). For now, the hidden admin URL + obscure password provides basic protection for a non-critical info site.
