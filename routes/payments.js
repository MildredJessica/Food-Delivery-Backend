import {Router} from 'express';
import { 
    initializePayment,
    verifyPaymentIntent,
    getBanks,
    createTransferRecipient,
    generateReference,
    initiateTransfer,
    handlePaystackWebhook,
    getBankTransferDetails,
    getBalance,
    confirmCash,
    createVirtualCard
} from '../controllers/payment.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Initialize Paystack payment
router.post('/paystack/initialize-payment', protect, initializePayment);

// Verify Paystack payment
router.get('/paystack/verify/:reference', protect, verifyPaymentIntent);

// Verify Paystack payment
router.get('/confim-cash', protect, confirmCash)

// Handle Paystack webhooks
router.post('/paystack/create-virtual-account', createVirtualCard)

// Get bank list (if needed for bank transfers)
router.get('/paystack/banks', getBanks);

// Get transfer recipient code (if needed for transfers)
router.post('/paystack/recipient', protect, createTransferRecipient);

// GGenerate Reference for Paystack
router.get('/paystack/generate-reference', generateReference);

//  Initiate Transfer (for vendor payouts)
router.post('/paystack/initiate-transfer', protect, initiateTransfer);

// Get bank transfer details
router.post('/paystack/bank-transfer', protect, getBankTransferDetails);

// Get balance (for admin dashboard)
router.get('/paystack/balance', protect, getBalance);


export default router;
export { handlePaystackWebhook }; // Export the webhook handler for use in server.js