import Router from "express";
import { protect, authorize } from '../middleware/auth.js';
import { getAllResturant, getAResturant, getMyResturants, newRestaurant } from "../controllers/restaurant.js";

const router = Router();

// Get all restaurants
router.get('/', getAllResturant);

// Get single restaurant
router.get('/:id', getAResturant);

// Get restuarant/s belonginging to an owner
router.get('/my-restaurants', protect, authorize('restaurant_owner', 'admin'), getMyResturants)

// Add new restaurant (for admin)
router.post('/', protect, authorize('restaurant_owner', 'admin'), newRestaurant);

export default router;
