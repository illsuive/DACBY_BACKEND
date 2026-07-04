import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    productName: {
        type: String,
        required: [true, 'Product name is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED'],
        default: 'PENDING'
    },
    orderStatus: {
        type: String,
        enum: ['PLACED', 'PROCESSING', 'READY_TO_SHIP', 'DELIVERED'],
        default: 'PLACED',
        index: true
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },
    isPaused: { type: Boolean, default: false }
}, {
    timestamps: true 
});

const Order = mongoose.model('Order', orderSchema);

export default Order;