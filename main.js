const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

function getPowerShellPath() {
  const sysRoot = process.env.SYSTEMROOT || 'C:\\Windows';
  return path.join(sysRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
}

let splashWindow;

function createWindow() {
  // Create Splash Window
  splashWindow = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    icon: path.join(__dirname, 'Assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'src', 'splash.html'));

  let iconPath;
  if (process.platform === 'win32') {
    iconPath = path.join(__dirname, 'Assets', 'Windows', 'Windows_icon.ico');
  } else if (process.platform === 'darwin') {
    iconPath = path.join(__dirname, 'Assets', 'macOS', 'MacOS_icon.icns');
  } else {
    iconPath = path.join(__dirname, 'Assets', 'Linux', 'Linux_icon.png');
  }

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 650,
    frame: false,
    resizable: true,
    show: false, // Don't show immediately
    icon: iconPath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false // For simplicity as requested, though usually not recommended for production
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  // After 3.5 seconds, hide splash and show main
  setTimeout(() => {
    if (splashWindow) splashWindow.close();
    mainWindow.show();
  }, 3500);

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (boosterProcess) boosterProcess.kill();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Window Controls
ipcMain.on('window-control', (event, action) => {
  if (!mainWindow) return;
  if (action === 'minimize') mainWindow.minimize();
  if (action === 'close') mainWindow.close();
});

// Adapter detection logic
ipcMain.on('get-adapter', (event) => {
  const powershellPath = getPowerShellPath();
  const scriptStr = 'Get-NetAdapterStatistics | Sort-Object ReceivedBytes -Descending | Select-Object -First 1 -ExpandProperty Name';
  const child = spawn(powershellPath, ['-Command', scriptStr]);

  child.stdout.on('data', (data) => {
    const name = data.toString().trim();
    if (name) {
      event.reply('adapter-found', name);
    }
  });

  child.stderr.on('data', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('script-output', `DEBUG Adapter Error: ${data.toString()}`);
    }
  });

  child.on('error', (err) => {
    event.reply('adapter-found', '');
    if (mainWindow) {
      mainWindow.webContents.send('script-output', `DEBUG Adapter Spawn Error: ${err.message}`);
    }
  });
});

// Turbo Control
ipcMain.on('start-turbo', (event, options) => {
  const interval = options?.interval || 1000;

  // Handle path for packed vs unpacked environment
  const baseDir = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar.unpacked')
    : __dirname;

  const scriptPath = path.join(baseDir, 'Hutch Booster Files', 'hutch_dashboard.ps1');
  const powershellPath = getPowerShellPath();

  if (mainWindow) {
    mainWindow.webContents.send('script-output', `DEBUG: Starting script from ${scriptPath}`);
  }

  boosterProcess = spawn(powershellPath, [
    '-ExecutionPolicy', 'Bypass',
    '-NoProfile',
    '-File', scriptPath,
    '-RefreshInterval', interval
  ], {
    cwd: path.join(baseDir, 'Hutch Booster Files')
  });

  boosterProcess.stdout.on('data', (data) => {
    mainWindow.webContents.send('script-output', data.toString());
  });

  boosterProcess.stderr.on('data', (data) => {
    mainWindow.webContents.send('script-output', `ERROR: ${data.toString()}`);
  });

  boosterProcess.on('close', (code) => {
    if (mainWindow) {
      mainWindow.webContents.send('script-output', `Process exited with code ${code}`);
      mainWindow.webContents.send('turbo-stopped');
    }
    boosterProcess = null;
  });
});

ipcMain.on('stop-turbo', (event) => {
  if (boosterProcess) {
    // Kill the process tree on Windows
    spawn('taskkill', ['/pid', boosterProcess.pid, '/f', '/t']);
    boosterProcess = null;
  }
});
