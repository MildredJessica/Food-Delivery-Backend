/* eslint-disable no-unused-vars */
import asyncHandler from "express-async-handler";
import User from '../models/user.js';
import Restaurant from '../models/restaurants.js';
import Order from '../models/orders.js';


// Create new admin user
export const createAdmin = asyncHandler(async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password,
      phone,
      address,
      role: 'admin',
      isActive: true
    });

    // Remove password from response
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: adminResponse
    });

  } catch (error) {
    console.error('Create admin error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// Promote existing user to admin
export const promoteToAdmin = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
        }

        // Update user role to admin
        user.role = 'admin';
        await user.save();

        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(200).json({
        success: true,
        message: 'User promoted to admin successfully',
        user: userResponse
        });

    } catch (error) {
        console.error('Promote to admin error:', error);
        
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});


// Dashboard Stats for users
export const userStats = asyncHandler(async (req, res) => {
  try {
    const total = await User.countDocuments();
    res.json({ success: true, total });
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Additional Dashboard stats routes for restaurants 
export const restaurantStats = asyncHandler(async (req, res) => {
  try {
    const total = await Restaurant.countDocuments();
    res.json({ success: true, total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Additional Dashboard stats routes for orders
export const orderStats = asyncHandler(async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const revenue = await Order.aggregate([
      { $match: { status: 'delivered' } },
      // { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const pending = await Order.countDocuments({ status: 'pending' });
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name')
      .populate('restaurant', 'name');
    
    const recentActivities = recentOrders.map(order => 
      `${order.user?.name || 'Someone'} ordered from ${order.restaurant?.name || 'a restaurant'}`
    );
    res.json({ 
      success: true, 
      total, 
      revenue: revenue[0]?.totalRevenue || 0, 
      pending, 
      recent : recentActivities
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Additional Management routes for users
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    // const total = await User.countDocuments();
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users});
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user based by role
export const updateUserByRole = asyncHandler(async (req, res) => {
  try {
      const { role } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { role },
        { new: true }
      ).select('-password');

      res.json({ success: true, user });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

//Update user status
export const updateUserStatus = asyncHandler(async (req, res) => {
  try {
      const { isActive } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { isActive },
        { new: true }
      ).select('-password');

      res.json({ success: true, user });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  try {
      await User.findByIdAndDelete(req.params.userId);
      res.json({ success: true, message: 'User deleted' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'Server error' });
  }
});  


// Get all restaurants
export const getAllRestaurants = asyncHandler(async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update restaurant status
export const updateRestaurantStatus = asyncHandler(async (req, res) => {
  try {
    const { isActive } = req.body;
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.restaurantId,
      { isActive },
      { new: true }
    );

    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete restaurant
export const deleteRestaurant = asyncHandler(async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.restaurantId);
    res.json({ success: true, message: 'Restaurant deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}); 
