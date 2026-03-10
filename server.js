import express, { json } from 'express';
import {config}  from "dotenv"
import { connectDB } from './config/db.js';
import cors from 'cors';
import restaurantRouter from './routes/restaurant.js';
import restaurantOwnerRouter from './routes/restaurantOwner.js';
import ordersRouter from './routes/orders.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import paymentRouter from './routes/payments.js';
import {generalLimiter} from './middleware/rateLimiter.js';
import { handlePaystackWebhook } from './controllers/payment.js'; // Adjust path as needed

// import authRouter from './routes/auth.js';

config();
connectDB();
const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting
// const { generalLimiter } = rateLimiter;
app.use(generalLimiter);

// Routes
// app.use('/api/auth', authRouter);
app.use('/api/restaurants', restaurantRouter);
app.use('/api/restaurant-owner', restaurantOwnerRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
// Add to your existing routes
app.use('/api/payments', paymentRouter);

// Webhook needs raw body, so add this before express.json()
app.post('/api/payments/paystack/webhook', express.raw({type: 'application/json'}), handlePaystackWebhook);
// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(), 
    // eslint-disable-next-line no-undef
    uptime: process.uptime()
  });
});

// Error handling middleware
// app.use((err, req, res, next) => {
//   console.error('Server error:', err);
  
//   // Handle rate limit errors
//   if (err.status === 429) {
//     return res.status(429).json({
//       success: false,
//       message: 'Too many requests, please try again later'
//     });
//   }
  
//   res.status(500).json({
//     success: false,
//     message: 'Internal server error',
//     error: process.env.NODE_ENV === 'development' ? err.message : {}
//   });
// });

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
