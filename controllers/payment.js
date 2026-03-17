/* eslint-disable no-case-declarations */
/* eslint-disable no-undef */
import asyncHandler from 'express-async-handler';
import axios from 'axios';
import Order from '../models/orders.js';
import PaystackService from '../src/services/paystack.js';


// Create payment intent
export const initializePayment = asyncHandler(async (req, res) => {
  try {
    const { orderId, email, amount } = req.body;
    const reference = `PAY-${Date.now()}-${orderId.slice(-6)}`;
    const response = await PaystackService.initializeTransaction({
      email,
      amount,
      reference,
      callback_url: `${process.env.FRONTEND_URL}/payment/verify`,
      metadata: {
        orderId
      }
    });
    res.json({
      success: true,
      data: {
        authorization_url: response.data.authorization_url,
        reference: response.data.reference
      }
    });
  
  } catch (error) {
      console.error('Payment initialization error:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message 
      });
  }
});

export const createVirtualCard = asyncHandler(async (req, res) => {
  try {
    const { email, amount, orderId } = req.body;
    
    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Generate a unique reference
    const reference = `VA-${Date.now()}-${orderId.slice(-6)}`;

    // For demo purposes, return mock bank details
    // In production, you would integrate with Paystack's dedicated virtual account API
    const bankDetails = {
      bankName: 'Paystack Test Bank',
      accountNumber: '1234567890',
      accountName: 'Food Delivery App',
      amount: amount,
      reference: reference,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    // Update order with payment details
    order.paymentDetails = {
      method: 'bank_transfer',
      status: 'pending',
      bankTransferDetails: bankDetails
    };
    
    await order.save();

    res.json({
      success: true,
      message: 'Virtual account created successfully',
      data: bankDetails
    });

  } catch (error) {
    console.error('Virtual account creation error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
})
// Verify Paystack payment
export const verifyPaymentIntent = asyncHandler(async (req, res) => {
    try {
      const { reference } = req.params;
      console.log("reference is ", reference);
      console.log('User ID:', req.user.id);
      const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
      if (!PAYSTACK_SECRET_KEY) {
            console.error('PAYSTACK_SECRET_KEY is not set');
            return res.status(500).json({
                success: false,
                message: 'Payment gateway configuration error'
            });
      }
      // First, try to find order by paymentReference
      let order = await Order.findOne({ paymentReference: reference });
              
              // If not found, try to find by orderId in the reference string
              if (!order) {
                  // Extract orderId from reference if possible (format: PAYSTACK_timestamp_random)
                  console.log('Order not found by paymentReference, checking metadata...');
                  
                  // You might want to query Paystack API to get metadata
                  try {
                      const paystackResponse = await axios.get(
                          `https://api.paystack.co/transaction/verify/${reference}`,
                          {
                              headers: {
                                  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                                  'Content-Type': 'application/json'
                              }
                          }
                      );
      
                      console.log('Paystack API response:', paystackResponse.data);
      
                      if (paystackResponse.data.status) {
                          const metadata = paystackResponse.data.data.metadata;
                          if (metadata && metadata.orderId) {
                              order = await Order.findById(metadata.orderId);
                              console.log('Found order by metadata orderId:', order?._id);
                          }
                      }
                  } catch (paystackError) {
                      console.error('Error calling Paystack API:', paystackError.response?.data || paystackError.message);
                  }
      }
      if (!order) {
                  console.log('❌ Order not found for reference:', reference);
                  return res.status(404).json({
                      success: false,
                      message: 'Order not found for this payment reference'
                  });
      }
      // Validate payment
      const result = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
      });
      
      console.log('Paystack verification response:', result.data);
      if (result.data.status && result.data.data.status === 'success') {
        console.log("eeing Wht is ni Order",result.data )
        // Update order status
        order.paymentStatus = 'paid';
          order.paymentReference = reference;
          order.amount = result.data.data.amount;
          order.paymentMethod = 'card';
          order.status = 'confirmed';
          await order.save();
          console.log(`Order ${order._id} updated successfully`);
        
        if (order) {
          // Update order status
          
          return res.json({
            success: true,
            message: 'Payment verified successfully',
            data: {
              orderId: order._id,
              status: order.status,
              amount: order.totalAmount,
              reference: reference
            }
          });
        } else {
            console.log('Order not found for reference:', reference);            
            // Create a record of successful payment even if order not found
            return res.json({
              success: true,
              message: 'Payment verified but order not found. Please contact support.',
              data: {
                reference: reference,
                amount: result.data.data.amount / 100,
                status: 'verified'
              }
            });                
        }
      } else {
          console.log('Payment verification failed:', result.data);
          return res.status(400).json({
            success: false,
            message: 'Payment verification failed',
            data: result.data
          });
      }
    } catch (error) {
        console.error('Paystack verification error:', error.response?.data || error.message);      
        // Handle specific error cases
        if (error.response?.status === 404) {
          return res.status(404).json({
            success: false,
            message: 'Transaction reference not found'
          });
        }
        if (error.response?.status === 401) {
          return res.status(401).json({
              success: false,
               message: 'Invalid Paystack secret key'
          });
        }
        res.status(500).json({
          success: false,
          message: 'Payment verification failed',
          error: error.response?.data || error.message
        });
    }
});

//  Confirm Cash Payment
export const confirmCash = asyncHandler(async (req, res) => {
    try {
        const { orderId } = req.body;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.paymentStatus = 'pending';
        order.paymentMethod = 'cash';
        order.status = 'confirmed';
        
        await order.save();

        res.json({
            success: true,
            message: 'Order confirmed for cash on delivery',
            order
        });
    } catch (error) {
        console.error('Error confirming cash payment:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Webhook to handle Paystack events
export const handlePaystackWebhook = asyncHandler(async (req, res) => {
  try {
    //Verify webhook signature here if needed
    const signature = req.headers['x-paystack-signature'];
    // You should verify the signature here
    const event = JSON.parse(req.body);

    // Handle the event
    switch (event.event) {
      case 'charge.success':
        // eslint-disable-next-line no-case-declarations
        const paymentData = event.data;

        // Verify payment and update order status
        const result = await PaystackService.handlePaystackWebhook(paymentData.reference);

        if (result.success) {
          const order = await Order.findOneAndUpdate(
            { provider: 'paystack', paymentReference: paymentData.reference },
            {
              paymentStatus: 'paid',
              status: 'confirmed',
              amount: result.data.amount / 100,
              paidAt: result.data.paid_at
            },
            { new: true }
          ).populate('restaurant');
          console.log(`Order ${order._id} paid successfully via webhook`);

          if (!order) 
            return res.status(404).json({ error: 'Order not found' });
          

          console.log(`Order ${order._id} payment confirmed via webhook`);
        }
        break;
      case 'transfer.success':
        console.log('Transfer successful:', event.data);
        break;
      case 'transfer.failed':
        console.log('Transfer failed:', event.data);
        break;
      default:
        console.log(`Unhandled event type ${event.event}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling Paystack webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
    

  // Get banks
export const getBanks = asyncHandler(async (req, res) => {
  try {
    const result = await PaystackService.listBanks();
    
    if (result.success) {
      res.json({
        success: true,
        banks: result.data
      });
    }
      else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching banks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get balance
export const getBalance = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    const result = await PaystackService.getBalance();
    
    if (result.success) {     
      res.json({    
        success: true,
        balance: result.data
      });
    }
      else {    
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get bank transfer details (if needed for transfers)
export const getBankTransferDetails = asyncHandler(async (req, res) => {
  try {
    const { orderId } = req.body;

    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Get bank transfer details
    const result = await PaystackService.getBankTransferDetails(
      orderId,
      order.totalAmount,
      req.user.email
    );

    if (result.success) {
      // Store bank transfer details in order
      order.bankTransferDetails = result.data;
      order.paymentStatus = 'pending';
      await order.save();

      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Bank transfer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
// Create transfer recipient
export const createTransferRecipient = asyncHandler(async (req, res) => {
  try {
    const { name, accountNumber, bankName } = req.body;
    const result = await PaystackService.createTransferRecipient(name, accountNumber, bankName);
    
    if (result.success) {
      res.json({
        success: true,
        recipient: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error creating transfer recipient:', error);
    res.status(500).json({ error: 'Internal server error' });   
  }
});


// Generate Reference for Paystack
export const generateReference = () => {
  return PaystackService.generateReference();
}

// Initiate Transfer (for vendor payouts)
export const initiateTransfer = asyncHandler(async (req, res) => {
  try {
    const { accountNumber, bankCode, amount, reason } = req.body;
    const recipientResult = await PaystackService.initiateTransfer(req.user.name, accountNumber, bankCode, amount, reason);
    if (!recipientResult.success) {
      return res.status(400).json({
        success: false,
        message: recipientResult.message
      });
    }

    // Then initiate transfer
    const transferResult = await paystackService.initiateTransfer(
        recipientResult.data.recipient_code,
        amount,
        reason
    );

    if (transferResult.success) {
      res.json({
        success: true,        
        message: 'Transfer initiated successfully',
        transfer: transferResult.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: transferResult.message
      });
    }
  } catch (error) {
    console.error('Error initiating transfer:', error);
    res.status(500).json({ error: 'Internal server error' });   
  }
});