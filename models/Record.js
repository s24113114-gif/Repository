const mongoose = require('mongoose');

const RecordSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true }, // 收入或支出
    category: { type: String, required: true }, // 滿足挑戰加分：餐飲、交通、娛樂、其他
    amount: { type: Number, required: true },   // 金額
    description: { type: String, default: '' }, // 備註
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Record', RecordSchema);