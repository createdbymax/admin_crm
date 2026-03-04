const { app, BrowserWindow, shell } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

const isDev = !app.isPackaged;
let nextServerProcess = null;

const DEFAULT_PORT = 5173;
const LOCAL_ORIGIN = `http://127.0.0.1:${DEFAULT_PORT}`;

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: 'Lost Hills CRM',
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const startUrl = process.env.ELECTRON_START_URL || LOCAL_ORIGIN;
  win.loadURL(startUrl);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(LOCAL_ORIGIN)) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith(LOCAL_ORIGIN)) {
      return;
    }
    event.preventDefault();
    shell.openExternal(url);
  });

  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }
}

function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error("Timed out waiting for local server."));
          return;
        }
        setTimeout(attempt, 300);
      });
    };

    attempt();
  });
}

async function startNextServer() {
  if (nextServerProcess) {
    return;
  }

  const serverPath = path.join(__dirname, "next-dist", "server.js");
  nextServerProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(DEFAULT_PORT)
    },
    stdio: "inherit"
  });

  nextServerProcess.on("exit", () => {
    nextServerProcess = null;
  });

  await waitForServer(LOCAL_ORIGIN);
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [mainWindow] = BrowserWindow.getAllWindows();
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

app.whenReady().then(() => {
  if (isDev) {
    createWindow();
    return;
  }

  startNextServer()
    .then(() => createWindow())
    .catch((error) => {
      console.error("Failed to start Next server:", error);
      app.quit();
    });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  if (nextServerProcess) {
    nextServerProcess.kill();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
