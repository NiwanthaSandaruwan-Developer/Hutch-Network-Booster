# ⚡ Hutch Turbo Booster Desktop Application


<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows" />
  <img src="https://img.shields.io/badge/Built%20With-Electron-47848F?style=for-the-badge&logo=electron" />
  <img src="https://img.shields.io/badge/Language-PowerShell-5391FE?style=for-the-badge&logo=powershell" />
  <img src="https://img.shields.io/badge/License-All%20Rights%20Reserved-red?style=for-the-badge" />
</p>

<p align="center">
  A sleek Electron desktop app that keeps your Hutch connection fast and alive. Auto-detects your active network adapter, runs a PowerShell keep-alive script in the background, and displays real-time download/upload speeds on a live dashboard. <strong>Simple. Fast. Always on.</strong>
</p>

---

## 📸 Screenshots

| Dashboard Running | Live Speed Monitor |
|---|---|
| <img width="100%" height="auto" alt="Dashboard" src="https://github.com/user-attachments/assets/a0a2d5e6-eba1-446a-a463-0b1b652a27d6" /> | <img width="100%" height="auto" alt="Live Monitor" src="https://github.com/user-attachments/assets/eeaf9af8-944e-4411-b39d-1b1615a91161" /> |

---

## ✨ Features

- 🔍 **Auto Adapter Detection** — Automatically detects your most active network adapter (Wi-Fi or Ethernet)
- ⚡ **Turbo Keep-Alive** — Sends lightweight background pings to keep your Hutch connection awake and at full speed
- 📊 **Real-Time Speed Graph** — Live animated download/upload speed graph with peak tracking
- 📋 **Activity Log** — See exactly what the booster is doing in real time
- 🧮 **Session Usage Tracker** — Monitors total data downloaded and uploaded per session
- 🎨 **Modern Dark UI** — Sleek dark themed interface built for a smooth experience

---

## 🚀 How It Works

```
You Click "Start Turbo"
        │
        ▼
renderer.js sends ipcRenderer.send('start-turbo')
        │
        ▼
main.js receives signal → spawns hutch_dashboard.ps1 via child_process
        │
        ▼
PowerShell Script:
  ├── Detects active network adapter
  ├── Pings hutch.lk / cloudflare.com / google.com (keep-alive)
  └── Reads adapter speeds → sends output back to UI
        │
        ▼
Live speed bars, graph & activity log update in real time
```

When you click **Stop Turbo**, the app runs `taskkill` to fully terminate the PowerShell process tree.

---

## 🗂️ Project Structure

```
Hutch-Network-Booster/
│
├── main.js                    # Electron backend — window creation, IPC, process spawning
├── package.json               # App config, electron-builder settings, build scripts
│
├── src/
│   ├── index.html             # Main dashboard UI
│   ├── splash.html            # Loading splash screen (shows 3.5s on launch)
│   ├── style.css              # Dark/RGB modern styling
│   └── renderer.js            # Frontend logic — buttons, animations, IPC communication
│
└── Hutch Booster Files/
    └── hutch_dashboard.ps1    # The engine — keep-alive pings + speed monitoring
```

---

## 🛠️ Installation & Setup

### Prerequisites
- Windows 10 / 11
- [Node.js](https://nodejs.org/) (v16 or higher)
- PowerShell 5.1+ (pre-installed on Windows)

### Run from Source

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/Hutch-Network-Booster.git

# 2. Navigate into the project
cd Hutch-Network-Booster

# 3. Install dependencies
npm install

# 4. Start the app
npm start
```

### Build Installer (.exe)

```bash
npm run dist
```
The installer will be generated in the `dist/` folder.

---

## ⚙️ How the PowerShell Engine Works

The `hutch_dashboard.ps1` script is the core of the app. It:

1. Runs `Get-NetAdapterStatistics` to find your most active network adapter
2. Loops `Invoke-WebRequest` calls to `hutch.lk`, `cloudflare.com`, and `google.com` — keeping the connection from throttling or dropping
3. Continuously reads adapter byte counters and calculates live MB/s speeds

> **Why does this work?** Some cellular/ISP networks throttle or downgrade idle connections. Constant lightweight traffic keeps the connection flagged as active, preventing speed drops.

---

## 📦 Build Notes

The `package.json` uses `asarUnpack` for the `Hutch Booster Files/` folder. This ensures `hutch_dashboard.ps1` is **not** locked inside the compiled `.asar` bundle — it's extracted alongside the `.exe` so Windows PowerShell can physically locate and execute it without permission issues.

---

## ⚠️ Disclaimer

This tool is designed specifically for **Hutch network connections** in Sri Lanka. Results may vary depending on your network configuration, signal strength, and ISP policies. This app does not bypass any network restrictions or modify any system settings.

---

## © License

**© 2025 All Rights Reserved.**

This software is provided for free personal use only.
Modification, redistribution, or use of the source code in derivative works is **strictly prohibited** without explicit written permission from the author.

---

<p align="center">Made with ❤️ for Hutch users in Sri Lanka</p>
