const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Te rog adaugna numele abonamentului (ex: Netflix)']
    },
    price: {
        type: Number,
        required: [true, 'Cat costa abonamentul?']
    },
    currency: {
        type: String,
        enum: ['RON', 'USD', 'EUR', 'GBP'],
        default: 'RON'
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly'
    },
    startDate: {
        type: Date,
        required: true
    },
    nextPaymentDate: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: ['Entertainment', 'Utilities', 'Software', 'Health', 'Gym','Other'],
        default: 'Other'
    },
    color: {
        type: String,
        default: '#000000'
    },
    active: {
        type: Boolean,
        default: true
    }
});

subscriptionSchema.index({nextPaymentDate: 1, active: 1});

module.exports = mongoose.model('Subscription', subscriptionSchema);