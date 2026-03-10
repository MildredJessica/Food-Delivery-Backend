import asyncHandler from 'express-async-handler'
import Restaurant from "../models/restaurants.js"

// Get all restaurants
export const getAllResturant = asyncHandler(async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('owner', 'name email')
      .select('-menu'); // Don't send full menu in list view
    
    res.json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single restaurant
export const getAResturant = asyncHandler(async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email')
      .lean(); // Use lean for better performance
    if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
    
    // Ensure menu is always present (default to empty array if not)
    if (!restaurant.menu) {
      restaurant.menu = [];
    }
    
    res.json({ success: true, data: restaurant });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new restaurant (for admin)
export const newRestaurant = asyncHandler(async (req, res) => {
  try {
    const restaurantData = {
      ...req.body,
      owner: req.user.id,
      rating: 0,
      isActive: true
    };

    const restaurant = await Restaurant.create(restaurantData);
    res.status(201).json({
      success: true,
      message: 'Restaurant created successfully',
      data: restaurant
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get restuarant/s belonginging to an owner
export const getMyResturants = asyncHandler(async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user.id })
      .populate('owner', 'name email');
    
    res.json({
      success: true,
      count: restaurants.length,
      restaurants
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
})