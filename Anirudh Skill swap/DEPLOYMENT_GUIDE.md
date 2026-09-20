# 🚀 Skill Swap - Deployment Guide

This guide walks you through deploying **Skill Swap**:
- **Backend & Database**: Google Drive & Google Sheets powered by Google Apps Script (100% free serverless REST API).
- **Frontend Hosting**: GitHub Pages (free SSL hosting).

---

## Part 1: Setup Google Drive & Google Apps Script Backend

### Step 1: Create the Google Apps Script Project
1. Open [script.google.com](https://script.google.com/) in your browser.
2. Click **+ New project**.
3. Rename the project at the top left to **Skill Swap Backend**.
4. In the editor, open the file named `Code.gs`.
5. Erase any default code and copy-paste the entire contents of [google-apps-script/Code.gs](file:///E:/esudasjp/Anirudh%20Skill%20swap/google-apps-script/Code.gs).

### Step 2: Initialize Database & Grant Permissions
> [!IMPORTANT]
> This step resolves the common Google Drive permission error:
> *"You do not have permission to call DriveApp..."*

1. At the top of the Apps Script toolbar, locate the function dropdown (it usually shows `myFunction` or `doGet`).
2. Select **`setupDatabase`**.
3. Click the **Run** button (▶).
4. Google will display a popup: **Authorization required**.
   - Click **Review permissions**.
   - Select your Google Account.
   - Click **Advanced** (bottom left of modal).
   - Click **Go to Skill Swap Backend (unsafe)**.
   - Click **Allow**.
5. Once the execution finishes, look at the **Execution log** at the bottom:
   - It will log: `SUCCESS! Database initialized.`
   - It will display your new Google Sheet URL and ID.
   - Check your Google Drive: you will see the new spreadsheet titled **Skill Swap Database** with sheets: `Users`, `Resources`, and `Sessions`!

### Step 3: Deploy as a Web App
1. At the top right of the Google Apps Script editor, click **Deploy** > **New deployment**.
2. Click the gear icon (⚙️) next to *Select type* and choose **Web app**.
3. Fill in the deployment settings:
   - **Description**: `Skill Swap API v1`
   - **Execute as**: `Me (<your-email>@gmail.com)`
   - **Who has access**: **`Anyone`** *(⚠️ Critical: Do NOT select "Only myself" or GitHub Pages will be blocked from accessing the database!)*
4. Click **Deploy**.
5. Copy the **Web app URL** (it ends with `/exec`).
   Example: `https://script.google.com/macros/s/AKfycb.../exec`

### Step 4: Link Web App URL in Frontend
1. Open [js/db.js](file:///E:/esudasjp/Anirudh%20Skill%20swap/js/db.js).
2. At Line 6, replace `API_URL` with your newly copied Web App URL:
   ```javascript
   const API_URL = 'https://script.google.com/macros/s/YOUR_NEW_DEPLOYMENT_ID/exec';
   ```
3. Save the file.

---

## Part 2: Host Frontend on GitHub Pages

### Step 1: Initialize Git Repository Locally
Open your terminal / PowerShell in this project folder:
```powershell
# 1. Initialize git
git init -b main

# 2. Add all project files
git add .

# 3. Create initial commit
git commit -m "Initial commit: Skill Swap Platform ready for GitHub Pages & Google Apps Script"
```

### Step 2: Create a Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Choose a repository name (e.g. `skill-swap`).
3. Leave it **Public** (required for free GitHub Pages).
4. Do **NOT** check "Add a README file" or ".gitignore" (we already created them).
5. Click **Create repository**.

### Step 3: Push Your Code to GitHub
Copy the commands shown on GitHub:
```powershell
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/skill-swap.git
git push -u origin main
```

### Step 4: Enable GitHub Pages
1. On your GitHub repository page, click **Settings** (top tabs).
2. On the left sidebar, click **Pages** (under the "Code and automation" section).
3. Under **Build and deployment**:
   - **Source**: Select `Deploy from a branch`.
   - **Branch**: Select `main` branch.
   - **Folder**: Select `/ (root)`.
4. Click **Save**.
5. Wait 1-2 minutes. Refresh the page until GitHub displays the green banner:
   > *"Your site is live at https://&lt;YOUR_GITHUB_USERNAME&gt;.github.io/skill-swap/"*

---

## 🛠️ Architecture Summary

```
+------------------------------------+
|  GitHub Pages (Frontend)           |
|  - index.html (Router)             |
|  - login.html                      |
|  - dashboard.html                  |
|  - js/db.js                        |
+-----------------+------------------+
                  |
         HTTPS POST (JSON)
                  |
                  v
+------------------------------------+
|  Google Apps Script (REST Web App) |
|  - Code.gs                         |
|  - Authentication & Actions API    |
+-----------------+------------------+
                  |
                  v
+------------------------------------+
|  Google Drive (Database Storage)   |
|  - "Skill Swap Database" (Sheets)  |
|    * Users Sheet                   |
|    * Resources Sheet               |
|    * Sessions Sheet                |
+------------------------------------+
```

---

## 💡 Troubleshooting & FAQ

- **Issue: "You do not have permission to call DriveApp..."**
  - **Solution**: Open the script at [script.google.com](https://script.google.com/), select `setupDatabase` in the function dropdown, click **Run**, and approve the Google authorization prompts.
- **Issue: CORS error in browser console (`Access-Control-Allow-Origin`)**
  - **Solution 1**: Ensure your Web App deployment has **Who has access** set to **`Anyone`**.
  - **Solution 2**: In [js/db.js](file:///E:/esudasjp/Anirudh%20Skill%20swap/js/db.js), requests are configured with `Content-Type: text/plain;charset=utf-8` to bypass preflight OPTIONS checks.
- **Issue: Changes to Apps Script aren't showing up**
  - **Solution**: Every time you edit `Code.gs`, click **Deploy** > **Manage deployments** > **Edit (pencil)** > **Version: New version** > **Deploy**.
