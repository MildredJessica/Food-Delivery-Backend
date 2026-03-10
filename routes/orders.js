 import {Router} from "express";
import { newOrder, updateOrder, userOrder } from "../controllers/orders.js";
import { protect } from "../middleware/auth.js";

const router = Router();
// Create new order
router.post('/', newOrder);

// Get user orders
router.get('/user/:userId',protect, userOrder);

// Update order status
router.patch('/:id', updateOrder);

export default router;