import mongoose from 'mongoose';

const orderStatusHistorySchema = new mongoose.Schema({
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order', 
    required: true, 
    index: true // Crucial for loading historical logs for a single order quickly
  },
  previousStatus: { 
    type: String, 
    enum: ['PLACED', 'PROCESSING', 'READY_TO_SHIP', 'DELIVERED'],
    required: true 
  },
  newStatus: { 
    type: String, 
    enum: ['PLACED', 'PROCESSING', 'READY_TO_SHIP', 'DELIVERED'],
    required: true 
  },
  changedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const OrderStatusHistory = mongoose.model('OrderStatusHistory', orderStatusHistorySchema);

export default OrderStatusHistory;