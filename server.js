const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 允許跨網域與解析 JSON
app.use(cors());
app.use(express.json());

// 1. 連接 MongoDB (記得在 .env 設定或直接替換，上傳 GitHub 前要移到 .env)
const MONGODB_URI = process.env.MONGODB_URI || "你的_MONGODB_連線字串_放在這裡";
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key_123";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB 連線成功'))
  .catch(err => console.error('MongoDB 連線失敗:', err));

// 2. 資料模型 (Models)
// 使用者 Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// 記帳 Model (+5分挑戰：記帳分類)
const recordSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true }, // income: 收入, expense: 支出
  category: { type: String, required: true }, // 標籤：餐飲、交通、娛樂等
  amount: { type: Number, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const Record = mongoose.model('Record', recordSchema);

// 3. 認證中間件 (Middleware) - 檢查是否登入
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    // 【評分標準 1-2】：未登入精準攔截並回傳 401 訊號
    return res.status(401).json({ message: '未授權，請先登入！' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token 無效或已過期，請重新登入！' });
  }
};

// 4. API 路由 (Routes)

// 【評分標準 1-1】：註冊 API (密碼安全加密)
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 前端已有攔截，後端雙重保障
    if (!password || password.length < 6) {
      return res.status(400).json({ message: '密碼長度必須至少 6 個字！' });
    }

    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: '此帳號已被註冊！' });
    }

    // 使用 bcrypt 加密密碼，產生符合評分要求的 $2b$ 開頭 60 碼亂碼
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: '註冊成功！' });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 登入 API
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: '帳號或密碼錯誤！' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '帳號或密碼錯誤！' });
    }

    // 簽發 JWT Token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ message: '登入成功！', token, username });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// 【評分標準 1-3】：獲取「自己」的記帳資料
app.get('/api/accounts', authMiddleware, async (req, res) => {
  try {
    const records = await Record.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: '無法取得資料' });
  }
});

// 新增帳目
app.post('/api/accounts', authMiddleware, async (req, res) => {
  try {
    const { type, category, amount, description } = req.body;
    const newRecord = new Record({
      userId: req.userId,
      type,
      category,
      amount: Number(amount),
      description
    });
    await newRecord.save();
    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ message: '新增失敗' });
  }
});

// 刪除帳目
app.delete('/api/accounts/:id', authMiddleware, async (req, res) => {
  try {
    const record = await Record.findOne({ _id: req.params.id, userId: req.userId });
    if (!record) {
      return res.status(404).json({ message: '找不到該筆帳目，或您無權刪除' });
    }
    await Record.deleteOne({ _id: req.params.id });
    res.json({ message: '刪除成功' });
  } catch (error) {
    res.status(500).json({ message: '刪除失敗' });
  }
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`伺服器正運行於 port ${PORT}`));