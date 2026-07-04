import Order from '../models/Order.js'
import OrderStatusHistory from '../models/OrderStatusHistory.js';
import SchedulerLog from '../models/SchedulerLog.js';

export const processScheduledTransitions = async (req, res) => {
  const startTime = performance.now();
  const now = new Date();

  // ==========================================
  // 🔐 INLINE AUTHENTICATION MIDDLEWARE LOGIC
  // ==========================================
  const secretKey = req.headers['x-scheduler-secret-key'];

  if (!process.env.SCHEDULER_SECRET_KEY) {
    console.error("CRITICAL CONFIG ERROR: SCHEDULER_SECRET_KEY is missing from .env");
    return res.status(500).json({
      success: false,
      message: "Internal server configuration mismatch."
    });
  }

  if (!secretKey || secretKey !== process.env.SCHEDULER_SECRET_KEY) {
    return res.status(401).json({
      success: false,
      message: "Access Denied: Invalid or missing x-scheduler-secret-key header tokens."
    });
  }
  // ==========================================

  let ordersProcessedCount = 0;
  let historyLogsToInsert = [];

  try {
    // 1. TRANSITION: PLACED -> PROCESSING (Older than 10 minutes)
    const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const placedOrders = await Order.find({
      orderStatus: 'PLACED',
      updatedAt: { $lte: tenMinsAgo } // ◄ SWAP THIS FROM createdAt TO updatedAt
    });

    // 2. TRANSITION: PROCESSING -> READY_TO_SHIP (Older than 20 minutes)
    const twentyMinsAgo = new Date(now.getTime() - 20 * 60 * 1000);
    const processingOrders = await Order.find({
      orderStatus: 'PROCESSING',
      updatedAt: { $lte: twentyMinsAgo }
    });

    const bulkUpdateOperations = [];

    // Process Placed transitions
    placedOrders.forEach(order => {
      bulkUpdateOperations.push({
        updateOne: {
          filter: { _id: order._id, orderStatus: 'PLACED' },
          update: { $set: { orderStatus: 'PROCESSING' } }
        }
      });
      historyLogsToInsert.push({
        orderId: order._id,
        previousStatus: 'PLACED',
        newStatus: 'PROCESSING'
      });
    });

    // Process Processing transitions
    processingOrders.forEach(order => {
      bulkUpdateOperations.push({
        updateOne: {
          filter: { _id: order._id, orderStatus: 'PROCESSING' },
          update: { $set: { orderStatus: 'READY_TO_SHIP' } }
        }
      });
      historyLogsToInsert.push({
        orderId: order._id,
        previousStatus: 'PROCESSING',
        newStatus: 'READY_TO_SHIP'
      });
    });

    // Execute updates atomically if changes exist
    if (bulkUpdateOperations.length > 0) {
      const result = await Order.bulkWrite(bulkUpdateOperations);
      ordersProcessedCount = result.modifiedCount;
      await OrderStatusHistory.insertMany(historyLogsToInsert);
    }

    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    // Save success metadata trace log
    await SchedulerLog.create({
      status: 'SUCCESS',
      ordersProcessed: ordersProcessedCount,
      executionTimeMs,
      details: `Successfully transformed ${ordersProcessedCount} orders.`
    });

    return res.status(200).json({
      success: true,
      message: 'Scheduler executed successfully.',
      ordersProcessed: ordersProcessedCount
    });

  } catch (error) {
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    // Save failure trace log
    await SchedulerLog.create({
      status: 'FAILED',
      ordersProcessed: 0,
      executionTimeMs,
      details: `Execution dropped due to error: ${error.message}`
    });

    return res.status(500).json({
      success: false,
      message: 'Scheduler task tracking failed.',
      error: error.message
    });
  }
};

export const getSchedulerLogs = async (req, res, next) => {
  try {
    const logs = await SchedulerLog.find()
      .sort({ createdAt: -1 }) // Aligned to standard Mongoose timestamp keys
      .limit(20);
      
    // ⚠️ CRITICAL: Frontend checks for the exact structural keys below
    return res.status(200).json({ 
      success: true, 
      data: logs 
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch logs from database engine.",
      error: error.message
    });
  }
};