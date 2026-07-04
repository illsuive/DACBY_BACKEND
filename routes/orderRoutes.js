import express from 'express';

const router = express.Router();

import { createOrder , getOrders , updateOrder , deleteOrder }  from '../controllers/orderController.js'

router.post('/orders', createOrder);

router.get('/orders', getOrders);

router.put('/orders/:id', updateOrder);

router.delete('/orders/:id', deleteOrder);

export default router;