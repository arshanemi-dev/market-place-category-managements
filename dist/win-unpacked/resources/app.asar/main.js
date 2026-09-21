const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_FILE_NAME = 'marketplace_rules.json';

// Next to the app while developing; a packaged app lives in a read-only asar,
// so it keeps the file in the per-user data folder instead.
const DATA_FILE = app.isPackaged
  ? path.join(app.getPath('userData'), DATA_FILE_NAME)
  : path.join(__dirname, DATA_FILE_NAME);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

function writeData(data) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true, file: DATA_FILE };
  } catch (err) {
    console.error('Error writing file:', err);
    return { success: false, file: DATA_FILE, error: err.message };
  }
}

// Reads the data file. `data` is null when the file is missing, empty or unreadable,
// which tells the renderer to seed defaults and save them (that creates the file).
ipcMain.handle('read-json', async () => {
  if (!fs.existsSync(DATA_FILE)) return { data: null, file: DATA_FILE };

  let raw = '';
  try {
    raw = fs.readFileSync(DATA_FILE, 'utf-8').replace(/^﻿/, '').trim();
    if (!raw) return { data: null, file: DATA_FILE };
    return { data: JSON.parse(raw), file: DATA_FILE };
  } catch (err) {
    console.error('Error reading file:', err);
    // Keep a copy so the auto-save that follows can't destroy a hand-edited file.
    const backup = `${DATA_FILE}.bak`;
    try {
      fs.copyFileSync(DATA_FILE, backup);
      return { data: null, file: DATA_FILE, backup };
    } catch (copyErr) {
      console.error('Error backing up file:', copyErr);
      return { data: null, file: DATA_FILE };
    }
  }
});

// Debounced auto-save from the renderer
ipcMain.handle('write-json', async (event, data) => writeData(data));

// Synchronous variant so a pending edit can still be flushed while the window closes
ipcMain.on('write-json-sync', (event, data) => {
  event.returnValue = writeData(data);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
