const { app, BrowserWindow, Notification } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  // Cargamos la URL de la app desplegada (ej: Vercel o Railway)
  // En desarrollo puede ser http://localhost:4200
  win.loadURL('https://jaquealrey.vercel.app');

  // Manejo de notificaciones nativas de Windows
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
