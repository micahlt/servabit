const path = require('path');

const {
  app,
  BrowserWindow
} = require('electron');

global.dataDir = app.getPath('userData');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    transparent: true,
    frame: false,
    icon: path.join(__dirname, 'assets/icons/64x64.png')
  });
  // win.setMenu(null);
  win.loadFile('html/index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function() {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  });
});

app.on('window-all-closed', function() {
  if (process.platform !== 'darwin') app.quit();
})