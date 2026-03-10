import asyncHandler from 'express-async-handler'
import Restaurant from "../models/restaurants.js"


// Get restaurant owner's restaurants   
export const getMyRestaurants = asyncHandler(async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ owner: req.user.id })
            .populate('owner', 'name email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: restaurants.length,
            restaurants
        });
    } catch (error) {
        console.error('Get restaurants error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }   
});

// Create new restaurant
export const createRestaurant = asyncHandler(async (req, res) => {
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
            restaurant
        });
    } catch (error) {
        console.error('Create restaurant error:', error);
        
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


// Add menu item to restaurant
export const addMenuItem = asyncHandler(async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check ownership
    if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add menu item to this restaurant'
      });
    }

    const menuItem = {
      ...req.body,
      available: true
    };

    
    restaurant.menu.push(menuItem);
    await restaurant.save();

    res.status(201).json({
      success: true,
      message: 'Menu item added successfully',
      menuItem: restaurant.menu[restaurant.menu.length - 1]
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({
      success: false,   
      message: 'Server error'
    });
  }
});



// Update restaurant
export const updateRestaurant = asyncHandler(async (req, res) => {
    try {   
        let restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this restaurant'
            });
        }

        restaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Restaurant updated successfully',
            restaurant
        });
    } catch (error) {
        console.error('Update restaurant error:', error);
        
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

// Delete Restaurant
export const deleteRestaurant = asyncHandler(async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this restaurant'
            });
        }

        await restaurant.remove();

        res.json({
            success: true,
            message: 'Restaurant deleted successfully'
        });
    } catch (error) {
        console.error('Delete restaurant error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update menu item
export const updateMenuItem = asyncHandler(async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);
        
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to modify this restaurant'
            });
        }

        const menuItem = restaurant.menu.id(req.params.menuItemId);         
        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        Object.assign(menuItem, req.body);
        await restaurant.save();

        res.json({
            success: true,
            message: 'Menu item updated successfully',
            menuItem
        });
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete menu item
export const deleteMenuItem = asyncHandler(async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.restaurantId);

        if (!restaurant) {
        return res.status(404).json({
            success: false,
            message: 'Restaurant not found'
        });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Not authorized to modify this restaurant'
        });
        }

        const menuItem = restaurant.menu.id(req.params.menuItemId);
        if (!menuItem) {
        return res.status(404).json({
            success: false,
            message: 'Menu item not found'
        });
        }

        menuItem.remove();
        await restaurant.save();

        res.json({
        success: true,
        message: 'Menu item deleted successfully'
        });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error'
        }); 
    }
});

