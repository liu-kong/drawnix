const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: false,
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, '../assets/icon.png') // 可选：应用图标
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:4200'); // 开发环境
  } else {
    const indexPath = path.join(__dirname, '../dist/apps/web/index.html');
    console.log('Loading file from:', indexPath);
    mainWindow.loadFile(indexPath); // 生产环境
  }

  // 开发环境下打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  // 添加加载失败监听器
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('Failed to load:', errorCode, errorDescription, validatedURL);
  });
  
  // 添加DOM加载完成监听器
  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM is ready');
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

// 设置菜单（Windows - 隐藏菜单栏）
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
});