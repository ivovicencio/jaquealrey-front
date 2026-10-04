const { app, BrowserWindow, Notification } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Hotel Jaque al Rey',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Cargamos la app desde localhost ya que el usuario confirmó que está corriendo ahí
  win.loadURL('http://localhost:4200');

  // Eliminamos el menú superior por defecto para que parezca una App nativa
  win.setMenuBarVisibility(false);

  win.on('notification', (event, notification) => {
    new Notification({
      title: notification.title,
      body: notification.body
    }).show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
