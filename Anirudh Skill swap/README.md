# 🎓 Skill Swap Platform

A gamified peer-to-peer knowledge exchange and skill-sharing web platform built for students and classmates.

![Skill Swap Platform](https://img.shields.io/badge/Status-Ready%20for%20Deploy-success)
![Hosting](https://img.shields.io/badge/Hosting-GitHub%20Pages-blue)
![Database](https://img.shields.io/badge/Backend-Google%20Apps%20Script%20%26%20Sheets-green)

---

## ✨ Features

- 🔐 **Authentication System**: Secure student registration and login with local session caching.
- 🧭 **Peer Discovery Directory**: Search classmates by name or skills offered/wanted with instant live filtering.
- 📅 **Session Scheduling**: Book teaching sessions with classmates and track status (`pending`, `completed`).
- 📂 **Knowledge Base & Resource Directory**: Share Google Drive links, study guides, and files with categorization.
- 🎮 **Gamification HUD**:
  - Gain EXP (+50) and Coins (+100) on session completion.
  - Dynamic Ranks (`IRON II` → `BRONZE II` → `SILVER II` → `GOLD II` → `PLATINUM II` → `RADIANT`).
  - Animated progress bar tracking level progression.

---

## 🏗️ Architecture

- **Frontend**: Static HTML5, Bootstrap 5, FontAwesome 6, custom dark cyber theme (`style.css`), vanilla JavaScript.
- **Hosting**: Free static hosting via **GitHub Pages**.
- **Backend API**: Serverless RESTful endpoint via **Google Apps Script (`Code.gs`)**.
- **Database**: **Google Sheets** stored in **Google Drive** with tables:
  - `Users`: Accounts, credentials, skills, XP, coins, ranks.
  - `Resources`: Learning documents, categories, and Google Drive links.
  - `Sessions`: Scheduled learning sessions, swap status, and feedback.

---

## 🚀 Quick Deployment Guide

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for full walkthrough:

1. **Deploy Backend**:
   - Copy [google-apps-script/Code.gs](google-apps-script/Code.gs) into [Google Apps Script](https://script.google.com/).
   - Run `setupDatabase` once to authorize Google Drive & initialize tables.
   - Deploy as **Web App** with access set to **Anyone**.
2. **Configure Frontend**:
   - Paste the deployment URL into `API_URL` in [js/db.js](js/db.js).
3. **Publish on GitHub Pages**:
   - Push this repo to GitHub.
   - Go to **Settings** > **Pages** > Select branch `main` and root `/` > **Save**.

---

## 📁 Project Structure

```
Anirudh Skill swap/
├── .gitignore
├── DEPLOYMENT_GUIDE.md
├── README.md
├── index.html            # GitHub Pages root router
├── login.html            # Authentication portal
├── dashboard.html        # Operations center & student HUD
├── css/
│   └── style.css         # Dark theme styling
├── js/
│   └── db.js             # Client API wrapper
└── google-apps-script/
    ├── Code.gs           # Serverless Google Apps Script backend
    └── appsscript.json   # Google Apps Script manifest & scopes
```
