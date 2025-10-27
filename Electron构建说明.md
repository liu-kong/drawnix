# Drawnix Electron 应用构建说明

## 项目概述

Drawnix 是一个基于 Electron 的桌面绘图应用，使用 React + TypeScript + Vite 构建前端界面，通过 Electron 打包成跨平台桌面应用。

## 项目结构

```
drawnix-develop/
├── electron/
│   └── main.js                 # Electron 主进程文件
├── apps/web/                   # React Web 应用
│   ├── src/                    # 源代码
│   ├── index.html              # HTML 模板
│   └── vite.config.ts          # Vite 构建配置
├── scripts/
│   └── fix-html-for-electron.js # Electron 适配脚本
├── package.json                # 项目配置和依赖
└── dist-electron/              # Electron 打包输出目录
```

## 核心文件分析

### 1. Electron 主进程 (electron/main.js)

```javascript
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,      // 禁用 Node.js 集成
      contextIsolation: true,      // 启用上下文隔离
      enableRemoteModule: false,   // 禁用远程模块
      webSecurity: false,          // 禁用 Web 安全（用于本地文件访问）
      allowRunningInsecureContent: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  // 根据环境加载不同的内容
  if (isDev) {
    mainWindow.loadURL('http://localhost:4200'); // 开发环境
  } else {
    const indexPath = path.join(__dirname, '../dist/apps/web/index.html');
    mainWindow.loadFile(indexPath); // 生产环境
  }

  // 开发环境打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// 应用生命周期管理
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

**关键特性：**
- 环境检测：通过 `NODE_ENV` 区分开发和生产环境
- 安全配置：禁用 Node.js 集成，启用上下文隔离
- 跨平台支持：针对 macOS 特殊处理窗口关闭逻辑
- 隐藏菜单栏：Windows 下隐藏默认菜单

### 2. 构建配置 (package.json)

```json
{
  "main": "electron/main.js",
  "scripts": {
    "electron": "electron .",
    "electron:dev": "set NODE_ENV=development && electron .",
    "electron:pack": "electron-builder",
    "electron:dist": "npm run build:web && electron-builder",
    "build:electron": "npm run build:web && node scripts/fix-html-for-electron.js",
    "electron:dist:fixed": "npm run build:electron && electron-builder"
  },
  "build": {
    "appId": "com.drawnix.app",
    "productName": "Drawnix",
    "directories": {
      "output": "dist-electron"
    },
    "files": [
      "electron/main.js",
      "dist/apps/web/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns"
    },
    "linux": {
      "target": "AppImage",
      "icon": "assets/icon.png"
    }
  }
}
```

**构建配置说明：**
- **入口文件**：`electron/main.js`
- **输出目录**：`dist-electron/`
- **包含文件**：Electron 主进程、构建后的 Web 应用、依赖包
- **多平台支持**：Windows (NSIS)、macOS (DMG)、Linux (AppImage)

### 3. Web 应用构建 (apps/web/vite.config.ts)

```typescript
export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/web',
  base: './',                    // 相对路径，适配 Electron

  server: {
    port: 7200,
    host: 'localhost',
  },

  build: {
    outDir: '../../dist/apps/web',  // 输出到项目根目录的 dist
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
```

**关键配置：**
- `base: './'`：使用相对路径，确保在 Electron 中正确加载资源
- 输出目录：`../../dist/apps/web`，与 Electron 主进程中的路径对应

### 4. Electron 适配脚本 (scripts/fix-html-for-electron.js)

```javascript
const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../dist/apps/web/index.html');

try {
  let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  // 替换 <base href="/" /> 为 <base href="./" />
  htmlContent = htmlContent.replace('<base href="/" />', '<base href="./" />');
  
  // 移除外部分析脚本
  htmlContent = htmlContent.replace(/<script defer src="https:\/\/cloud\.umami\.is\/script\.js".*?><\/script>/g, '');
  
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log('HTML fixed successfully for Electron!');
} catch (error) {
  console.error('Error fixing HTML:', error);
  process.exit(1);
}
```

**适配处理：**
- 修正 base href 路径为相对路径
- 移除可能阻塞应用的外部脚本

## 构建流程

### 开发环境

1. **启动 Web 开发服务器**
   ```bash
   npm run start
   # 或
   nx serve web --host=0.0.0.0
   ```
   启动 Vite 开发服务器，通常在 `http://localhost:7200`

2. **启动 Electron 开发模式**
   ```bash
   npm run electron:dev
   # 或
   set NODE_ENV=development && electron .
   ```
   Electron 会加载开发服务器的 URL

### 生产环境构建

1. **构建 Web 应用**
   ```bash
   npm run build:web
   # 或
   nx build web
   ```
   输出到 `dist/apps/web/` 目录

2. **Electron 适配处理**
   ```bash
   npm run build:electron
   ```
   执行 `fix-html-for-electron.js` 脚本，修正 HTML 文件

3. **打包 Electron 应用**
   ```bash
   npm run electron:dist:fixed
   ```
   使用 electron-builder 打包成可执行文件

### 一键构建命令

```bash
# 完整构建流程
npm run electron:dist:fixed

# 等价于
npm run build:web && node scripts/fix-html-for-electron.js && electron-builder
```

## 技术栈

- **前端框架**：React 18.3.1 + TypeScript
- **构建工具**：Vite 6.2.2
- **桌面框架**：Electron 37.3.1
- **打包工具**：electron-builder 26.0.12
- **项目管理**：Nx 19.3.0 (Monorepo)

## 安全特性

1. **上下文隔离**：`contextIsolation: true`
2. **禁用 Node.js 集成**：`nodeIntegration: false`
3. **禁用远程模块**：`enableRemoteModule: false`
4. **Web 安全配置**：根据需要调整 `webSecurity`

## 跨平台支持

### Windows
- 安装包格式：NSIS
- 图标：`assets/icon.ico`
- 输出：`dist-electron/Drawnix Setup x.x.x.exe`

### macOS
- 安装包格式：DMG
- 图标：`assets/icon.icns`
- 输出：`dist-electron/Drawnix-x.x.x.dmg`

### Linux
- 安装包格式：AppImage
- 图标：`assets/icon.png`
- 输出：`dist-electron/Drawnix-x.x.x.AppImage`

### 其他重要配置
- `node_modules/`：依赖包目录
- `dist/`：Web 应用构建输出
- `.nx/cache`：Nx 缓存目录
- 环境变量文件：`.env*`
- 各种日志和缓存文件

## 开发注意事项

1. **路径问题**：确保所有资源使用相对路径
2. **环境变量**：通过 `NODE_ENV` 区分开发和生产环境
3. **端口配置**：开发服务器端口需要与 Electron 主进程中的 URL 匹配
4. **构建顺序**：必须先构建 Web 应用，再进行 Electron 打包
5. **图标文件**：确保各平台图标文件存在且格式正确
6. **版本控制**：构建产物和平台特定包已被忽略，只提交源代码

## 故障排除

### 常见问题

1. **应用白屏**
   - 检查 `main.js` 中的文件路径是否正确
   - 确认 Web 应用已正确构建

2. **资源加载失败**
   - 检查 `base href` 配置
   - 确认使用了相对路径

3. **打包失败**
   - 检查图标文件是否存在
   - 确认所有依赖已正确安装

### 调试技巧

1. **开启开发者工具**：开发环境下自动开启
2. **查看控制台日志**：Electron 主进程和渲染进程都有日志输出
3. **检查网络请求**：确认资源加载路径正确

## 总结

Drawnix 的 Electron 构建采用了现代化的技术栈，通过 Vite 构建 React 应用，使用 Electron 打包成桌面应用。整个构建流程清晰，支持多平台发布，具备良好的安全性和可维护性。
