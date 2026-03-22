 import {Router} from "express";
import { newOrder, updateOrder, userOrder, getMyOrders, getRestaurantOwnerOrders, getAllOrders } from "../controllers/orders.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();
// Create new order
router.post('/', newOrder);

// Get user orders (by explicit ID)
router.get('/user/:userId', protect, userOrder);

// Get my orders (using token)
router.get('/my-orders', protect, getMyOrders);

// Get restaurant owner orders
router.get('/restaurant-owner', protect, authorize('restaurant_owner', 'admin'), getRestaurantOwnerOrders);

// Get all orders (admin)
router.get('/all', protect, authorize('admin'), getAllOrders);

// Update order status
router.patch('/:id', updateOrder);
router.put('/:id/status', protect, updateOrder);

export default router;