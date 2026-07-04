import express from 'express';

const router = express.Router();

import {processScheduledTransitions , getSchedulerLogs}  from '../controllers/schedulerController.js'

router.post('/process', processScheduledTransitions);
router.get('/logs', getSchedulerLogs);

export default router;