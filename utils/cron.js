import cron from 'node-cron';
import axios from 'axios';

export const initScheduler = () => {
  // Fires every minute for development tracing updates
  cron.schedule('* * * * *', async () => {
    try {
      const PORT = process.env.PORT || 3000;
      
      console.log('⏰ Internal Cron Job triggered: Executing status matrix update...');
      
      // 💡 FIXED: Changed endpoint path structure from /api/process to /api/scheduler/process
      const response = await axios.post(`http://localhost:${PORT}/api/scheduler/process`, {}, {
        headers: {
          'x-scheduler-secret-key': process.env.SCHEDULER_SECRET_KEY
        }
      });
      
      console.log(`✅ Background Cron Success: ${response.data.message}`);
    } catch (error) {
      // This is what was catching your 404 message before
      console.error(`❌ Background Cron Error: ${error.message}`);
    }
  });
};