const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../dist/apps/web/index.html');

console.log('Fixing HTML for Electron...');

try {
  let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  
  // 替换 <base href="/" /> 为 <base href="./" />
  htmlContent = htmlContent.replace('<base href="/" />', '<base href="./" />');
  
  // 移除外部分析脚本，可能会阻塞Electron应用
  htmlContent = htmlContent.replace(/<script defer src="https:\/\/cloud\.umami\.is\/script\.js".*?><\/script>/g, '');
  
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log('HTML fixed successfully for Electron!');
} catch (error) {
  console.error('Error fixing HTML:', error);
  process.exit(1);
}
