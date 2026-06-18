const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Record = require('./models/Record');

const app = express();
app.use(express.json());
app.use(express.static('public')); // 託管前端網頁

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB 連線成功'))
    .catch(err => console.error(err));

// 簡單的模擬 Session 驗證中間件 (Middleware)
// 挑戰需求：未登入直接進入 /api/accounts 必須回傳 401
const authMiddleware = (req, res, next) => {
    // 這裡示範從 headers 拿取 token 或 userid（實務上可用 JWT 或 express-session）
    const userId = req.headers['authorization']; 
    if (!userId) {
        return res.status(401).json({ message: '未登入，拒絕存取' });
    }
    req.userId = userId;
    next();
};

// 1. 註冊 API (含密碼長度限制加分項)
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (password.length < 6) {
        return res.status(400).json({ message: '密碼少於 6 個字' });
    }
    try {
        const user = new User({ username, password });
        await user.save();
        res.status(201).json({ message: '註冊成功' });
    } catch (err) {
        res.status(400).json({ message: '帳號已被註冊' });
    }
});

// 2. 登入 API
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(400).json({ message: '帳號或密碼錯誤' });
    }
    // 登入成功，將用戶 ID 回傳給前端儲存
    res.json({ message: '登入成功', userId: user._id });
});

// 3. 獲取特定用戶的記帳資料 (防護隔離 + 自動計算加分項)
app.get('/api/accounts', authMiddleware, async (req, res) => {
    const records = await Record.find({ userId: req.userId });
    
    // 挑戰加分項：後端也可以順便算好，或者讓前端算。這裡示範後端回傳明細
    res.json(records);
});

// 4. 新增記帳 (SPA 局部更新)
app.post('/api/accounts', authMiddleware, async (req, res) => {
    const { category, amount, type, description } = req.body;
    const record = new Record({
        userId: req.userId,
        category,
        amount,
        type,
        description
    });
    await record.save();
    res.status(201).json(record);
});

// 5. 刪除記帳
app.delete('/api/accounts/:id', authMiddleware, async (req, res) => {
    await Record.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: '刪除成功' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`伺服器運行於 http://localhost:${PORT}`));