import express from 'express';
import { connectDB } from './config/DbConnection.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import "dotenv/config";

import orderRoutes from './routes/orderRoutes.js';
import schedulerRoutes from './routes/schedulerRoutes.js';
import {errorHandler } from './middleware/errorHandler.js'
import { initScheduler } from './utils/cron.js'; 

const app = express();

app.use(bodyParser.json());

app.use(cors({
  origin: 'https://astounding-quokka-a1fe75.netlify.app',
  credentials: true,
}))

app.use(express.json());
app.use('/api', orderRoutes);
app.use('/api/scheduler', schedulerRoutes);

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in production grid on port ${PORT}`);
    
    initScheduler(); // ◄ 2. Fire up the continuous cron loop here!
  });
});
