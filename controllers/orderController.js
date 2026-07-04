import Order from '../models/Order.js'

export const createOrder = async (req, res) => {
  try {
    const { customerName, phoneNumber, productName, amount, idempotencyKey } = req.body;
    if (!customerName || !phoneNumber || !productName || amount === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation Failed: customerName, phoneNumber, productName, and amount are required.' 
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation Failed: amount must be a valid positive number.' 
      });
    }

    const newOrder = new Order({
      customerName: String(customerName).trim(),
      phoneNumber: String(phoneNumber).trim(),
      productName: String(productName).trim(),
      amount: parsedAmount,
      idempotencyKey: idempotencyKey ? String(idempotencyKey).trim() : undefined,
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED'
    });

    const savedOrder = await newOrder.save();
    return res.status(201).json({ success: true, data: savedOrder });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        message: 'Duplicate request blocked. An order with this execution signature already exists.' 
      });
    }
    return res.status(500).json({ success: false, message: 'Server fault processing creation.', error: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const query = {};
    const validStatuses = ['PLACED', 'PROCESSING', 'READY_TO_SHIP', 'DELIVERED'];
    
    if (status && status !== 'ALL') {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid query perimeter: status must be one of [${validStatuses.join(', ')}] or 'ALL'` 
        });
      }
      query.orderStatus = status;
    }

    if (search) {
      const sanitizedSearch = String(search).trim();
      
      if (sanitizedSearch.match(/^[0-9a-fA-F]{24}$/)) {
        query._id = sanitizedSearch;
      } else {
        const escapedSearch = sanitizedSearch.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        query.customerName = { $regex: escapedSearch, $options: 'i' }; 
      }
    }

    const parsedPage = Math.max(1, parseInt(page) || 1);
    const parsedLimit = Math.max(1, Math.min(100, parseInt(limit) || 10)); 
    const skip = (parsedPage - 1) * parsedLimit;

    const [totalOrders, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean() 
    ]);

    return res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        totalItems: totalOrders,
        totalPages: Math.ceil(totalOrders / parsedLimit),
        currentPage: parsedPage,
        limit: parsedLimit
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server read extraction drop execution.', error: error.message });
  }
};

// Update an existing order (e.g., change product name, amount, or manually override status)
export const updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
      new: true, // Returns the modified document instead of the old one
      runValidators: true // Ensures schema rules are followed
    });

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order record not found.' });
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// Delete an order from the database pipeline
export const deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: 'Order record not found.' });
    }

    res.status(200).json({ success: true, message: 'Order permanently deleted.' });
  } catch (error) {
    next(error);
  }
};