import asyncHandler from "express-async-handler";
import Order from '../models/orders.js'
import Restaurant from '../models/restaurants.js'


// Gets new Orders
export const newOrder = asyncHandler(async (req, res) => {
  try {
      console.log('Received order request:', req.body);
      
      const {
        user,
        restaurant,
        items,
        subtotal,
        deliveryFee,
        tax,
        discount,
        totalAmount,
        deliveryAddress,
        deliveryNotes,
        paymentMethod,
        promoCode
      } = req.body;
  
      // Validate required fields
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }
  
      if (!restaurant) {
        return res.status(400).json({
          success: false,
          message: 'Restaurant ID is required'
        });
      }
  
      if (!items || !items.length) {
        return res.status(400).json({
          success: false,
          message: 'Order items are required'
        });
      }
  
      if (!deliveryAddress) {
        return res.status(400).json({
          success: false,
          message: 'Delivery address is required'
        });
      }
  
      // Verify restaurant exists
      const restaurantExists = await Restaurant.findById(restaurant);
      if (!restaurantExists) {
        return res.status(404).json({
          success: false,
          message: 'Restaurant not found'
        });
      }
  
      // Create order
      const order = new Order({
        user,
        restaurant,
        items,
        subtotal: subtotal || 0,
        deliveryFee: deliveryFee || 0,
        tax: tax || 0,
        discount: discount || 0,
        totalAmount: totalAmount || 0,
        deliveryAddress,
        deliveryNotes: deliveryNotes || '',
        paymentMethod: paymentMethod || 'card',
        paymentStatus: 'pending',
        status: 'pending',
        promoCode: promoCode || null
      });
  
      await order.save();
      
      // Populate references
      await order.populate('restaurant', 'name image');
      await order.populate('user', 'name email');
  
      console.log('Order created successfully:', order._id);
  
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
  
    } catch (error) {
      console.error('Error creating order:', error);
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: messages
        });
      }
  
      // Handle duplicate key errors
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Duplicate order detected'
        });
      }
  
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create order'
      });
    }
});

// Get user orders
export const userOrder = asyncHandler( async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Verify the requesting user matches the userId or is admin
        if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these orders'
            });
        }

        const orders = await Order.find({ user: userId })
            .populate('restaurant', 'name image')
            .sort('-createdAt');

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


// Update order status
export const updateOrder = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get my orders
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('restaurant', 'name image')
    .sort('-createdAt');
  res.json({ success: true, orders });
});

// Get restaurant owner orders
export const getRestaurantOwnerOrders = asyncHandler(async (req, res) => {
  // Find all restaurants owned by the current user
  const restaurants = await Restaurant.find({ owner: req.user._id });
  const restaurantIds = restaurants.map(r => r._id);
  
  // Find all orders for these restaurants
  const orders = await Order.find({ restaurant: { $in: restaurantIds } })
    .populate('restaurant', 'name image')
    .populate('user', 'name email')
    .sort('-createdAt');
    
  res.json({ success: true, orders });
});

// Get all orders (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('restaurant', 'name image')
    .populate('user', 'name email')
    .sort('-createdAt');
  res.json({ success: true, orders });
});