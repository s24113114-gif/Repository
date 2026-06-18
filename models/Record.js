const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true }, // 挑戰加分項：餐飲、交通、娛樂
    amount: { type: Number, required: true },   // 金額
    type: { type: String, enum: ['income', 'expense'], required: true }, // 收入或支出
    description: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Record', RecordSchema);