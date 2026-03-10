import Router  from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { addMenuItem, createRestaurant,deleteMenuItem,deleteRestaurant,
   getMyRestaurants, updateMenuItem, updateRestaurant } from '../controllers/restaurantOwner.js';

const router = Router();

// All routes require restaurant owner authentication
router.use(protect);
router.use(authorize('restaurant_owner', 'admin'));

// Get restaurant owner's restaurants
router.get('/my-restaurants', getMyRestaurants);
  


// Create new restaurant
router.post('/', createRestaurant);

// Add menu item to restaurant
router.post('/:restaurantId/menu', addMenuItem);

// Update restaurant
router.put('/:id', updateRestaurant);

// Delete restaurant
router.delete('/:id', deleteRestaurant);

// Update menu item
router.put('/:restaurantId/menu/:menuItemId', updateMenuItem);

// Delete menu item
router.delete('/:restaurantId/menu/:menuItemId', deleteMenuItem);

export default router;