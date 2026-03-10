import {Router} from "express";
import { protect, authorize } from '../middleware/auth.js';
import { user,  updateUserProfile, addFavorite, registerUser,
    loginUser, removeFavorite, getFavorites, getUsers, getUserById,
    updateUser, deleteUser,
    logoutUser,
    changePassword} from "../controllers/users.js";
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Register new user
router.post('/register', authLimiter, registerUser);

//  Login a user
router.post('/login', authLimiter, loginUser);

// All routes are protected
router.use(protect);

// Get user profile
router.get('/profile', user);

// Update user profile
router.put('/profile', updateUserProfile);



//  change a user's password
router.post('/logout', logoutUser);
router.post('/change-password', protect, changePassword);


// Add restaurant to favorites
router.post('/favorites/:restaurantId',protect, addFavorite);

// Remove restaurant from favorites
router.delete('/favorites/:restaurantId', protect, removeFavorite);

// Get user favorites
router.get('/favorites', protect, getFavorites);

// Admin only routes
router.use(authorize('admin'));

// Get all users (admin only)
router.get('/', getUsers);

// Get user by ID (admin only)
router.get('/:id', getUserById);

// Update user (admin only)
router.put('/:id', updateUser);

// Delete user (admin only)
router.delete('/:id', deleteUser);



export default router