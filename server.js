require('dotenv').config(); // 載入環境變數（讀取 .env 檔案）
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中間件 (Middleware) ====================
app.use(express.json()); // 解析 JSON 格式的請求主體
app.use(express.urlencoded({ extended: true })); // 解析 URL 編碼的資料
app.use(express.static(path.join(__dirname, 'public'))); // 託管前端靜態網頁檔案 (public 資料夾)

// ==================== MongoDB 資料庫連線 ====================
// 從環境變數讀取連線字串
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('❌ 錯誤：找不到 MONGODB_URI 環境變數！請檢查你的 .env 檔案。');
  process.exit(1);
}

mongoose.connect(mongoURI)
  .then(() => {
    console.log('-------------------------------------------');
    console.log('🎉 MongoDB 連線成功了！你的雲端資料庫已順利打通！');
    console.log('-------------------------------------------');
  })
  .catch((err) => {
    console.log('-------------------------------------------');
    console.log('❌ MongoDB 連線失敗！');
    console.log('錯誤原因：', err.message);
    console.log('💡 提示：如果出現 ECONNREFUSED，請嘗試切換為「手機熱點網路」再測試一遍！');
    console.log('-------------------------------------------');
  });

// ==================== 路由設定 (Routes) ====================
// 測試用 API 路由，用來檢查後端是否正常運作
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '伺服器運作正常！' });
});

// 如果有其他 API 路由（例如使用者、記帳紀錄），請加在下方：
// app.use('/api/users', require('./routes/users'));
// app.use('/api/records', require('./routes/records'));

// 後端萬用路由：確保前端 SPA 頁面重新整理時不會 404
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== 啟動伺服器 ====================
app.listen(PORT, () => {
  console.log('===========================================');
  console.log(`🚀 伺服器啟動成功！`);
  console.log(`📱 執行網址：http://localhost:${PORT}`);
  console.log('===========================================');
});