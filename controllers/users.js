import asyncHandler from "express-async-handler";
import User from '../models/User.js';


// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = asyncHandler(async (req, res) => {
    try{
        console.log('Registration attempt:', req.body); // Debug log
        const { name, email, password, phone, address, role, avatar } = req.body;

        // Simple validation
        if (!name || !email || !password) { 
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email: email.toLowerCase() });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        // Prepare user data
        const userData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        phone: phone ? phone.trim() : '',
        // Validate role (prevent regular users from setting themselves as admin)
        role: (role === 'restaurant_owner') ? 'restaurant_owner' : 'user'
        };
        // Only allow admin creation through admin routes

        // Add address if provided
        if (address && address.street) {
            userData.address = {
                street: address.street?.trim() || '',
                city: address.city?.trim() || '',
                state: address.state?.trim() || '',
                country: address.country?.trim() || 'US'
            };
        }
            console.log('Creating user with data:', userData); // Debug log
  
        // Create user
        const newUser = await User.create({...userData});
        // Generate token
        const token = newUser.generateAuthToken();

        // Remove password from output
        const userResponse = newUser.toObject();
        delete userResponse.password;
        // console.log(`User created ${newUser}`);

        res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: userResponse
        });
    } catch (error) {
    console.error('Registration error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
        error: error.errors
      });
    }

    // Duplicate key error (unique constraint)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Get user profile
export const user = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({
        success: true,
        user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error'
        });
    }
});

// User login
export const loginUser = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Get user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Generate token
    const token = user.generateAuthToken();

    // Remove password from output
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// User logout
export const logoutUser = asyncHandler(async (req, res) => {
    // Since we are using JWT, logout can be handled on the client side by deleting the token.
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

// Change user password
export const changePassword = asyncHandler(async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: 'Please provide current and new password'
        });
    }

        // Get user with password
        const user = await User.findById(req.user.id).select('+password');

        // Check current password
        if (!(await user.correctPassword(currentPassword, user.password))) {
        return res.status(401).json({
            success: false,
            message: 'Current password is incorrect'
        });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        // Generate new token
        const token = user.generateAuthToken();

        res.json({
            success: true,
            message: 'Password updated successfully',
            token
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error during password change'
        });
    }
});


// Update user profile
export const updateUserProfile = asyncHandler(async (req, res) => {
    try {
        const allowedUpdates = ['name', 'phone', 'address', 'avatar'];
        const updates = Object.keys(req.body);
        
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidOperation) {
        return res.status(400).json({
            success: false,
            message: 'Invalid updates'
        });
        }

        const user = await User.findByIdAndUpdate(
        req.user.id,
        req.body,
        { new: true, runValidators: true }
        ).select('-password');

        res.json({
        success: true,
        message: 'Profile updated successfully',
        user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        
        if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
            success: false,
            message: messages.join(', ')
        });
        }

        res.status(500).json({
        success: false,
        message: 'Server error during profile update'
        });
    }
});


// Add restaurant to favorites
export const addFavorite = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (user.favorites.includes(req.params.restaurantId)) {
        return res.status(400).json({
            success: false,
            message: 'Restaurant already in favorites'
        });
        }

        user.favorites.push(req.params.restaurantId);
        await user.save();

        res.json({
        success: true,
        message: 'Restaurant added to favorites',
        favorites: user.favorites
        });
    } catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error'
        });
    }
});

// Remove restaurant from favorites
export const removeFavorite = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        user.favorites = user.favorites.filter(
        fav => fav.toString() !== req.params.restaurantId
        );
        
        await user.save();

        res.json({
        success: true,
        message: 'Restaurant removed from favorites',
        favorites: user.favorites
        });
    } catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error'
        });
    }
});

// Get user favorites
export const getFavorites = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('favorites');
        
        res.json({
        success: true,
        favorites: user.favorites
        });
    } catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error'
        });
    }
});



// Get all users (admin only)
export const getUsers = asyncHandler(async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({
        success: true,
        count: users.length,
        users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error'
        });
    }
});

// Get user by ID (admin only)
export const getUserById = asyncHandler(async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
        }

        res.json({
        success: true,
        user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error'
        });
    }
});         

// Update user (admin only)
// (This function is now defined directly in the route)
export const updateUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
        ).select('-password');

        res.json({
        success: true,
        message: 'User updated successfully',
        user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error'
        });
    }
});

// Delete user (admin only)
// (This function is now defined directly in the route)     
export const deleteUser = asyncHandler( async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        
        res.json({
        success: true,
        message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
        success: false,
        message: 'Server error'
        });
    }
});

