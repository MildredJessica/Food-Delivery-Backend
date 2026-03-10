import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createAdmin, promoteToAdmin,
    orderStats, restaurantStats, 
    userStats,
    getAllUsers,
    updateUserByRole,
    updateUserStatus,
    deleteUser, getAllRestaurants,
    updateRestaurantStatus,
    deleteRestaurant} from '../controllers/admin.js';

const router = Router();
// All routes require admin privileges
router.use(protect);
router.use(authorize('admin'));

// Create new admin user
router.post('/create-admin', createAdmin);

// Promote existing user to admin
router.put('/promote-to-admin/:userId', promoteToAdmin);


// Dashboard Stats
router.get('/stats/users', userStats);

router.get('/stats/restaurants', restaurantStats);

router.get('/stats/orders', orderStats);

// User Management
router.get('/users', getAllUsers);

router.put('/users/:userId/role', updateUserByRole);

router.put('/users/:userId/status', updateUserStatus);

router.delete('/users/:userId', deleteUser);

// Restaurant Management
router.get('/restaurants', getAllRestaurants);

router.put('/restaurants/:restaurantId/status', updateRestaurantStatus);

router.delete('/restaurants/:restaurantId', deleteRestaurant);



export default router;