import mongoose from 'mongoose';

const schedulerLogSchema = new mongoose.Schema({
  triggeredAt: { 
    type: Date, 
    default: Date.now,
    index: true // Useful for sorting the dashboard log entries chronologically
  },
  status: { 
    type: String, 
    enum: ['SUCCESS', 'FAILED'], 
    required: true 
  },
  ordersProcessed: { 
    type: Number, 
    default: 0 
  },
  executionTimeMs: { 
    type: Number,
    required: true 
  },
  details: { 
    type: String, 
    default: 'Execution completed without errors.' 
  }
});

const SchedulerLog = mongoose.model('SchedulerLog', schedulerLogSchema);

export default SchedulerLog;