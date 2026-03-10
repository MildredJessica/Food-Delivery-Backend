/* eslint-disable no-undef */
import axios from 'axios';

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY; // Add this to your .env
    this.baseUrl = 'https://api.paystack.co';
  
  
    // Validate secret key
    if (!this.secretKey) 
      console.error('PAYSTACK_SECRET_KEY is not set in environment variables');
    
  }

  // Get headers for Paystack API requests
  getHeaders() {
    console.log("Base URL ", this.baseUrl)
    return {
      Authorization: `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Initialize payment with inline popup (returns params for frontend)
  async initializeTransaction(data) {
    try{
      console.log('Initializing payment for:', data);
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: data.email,
          amount: data.amount * 100, // Convert to kobo/cents and ensure integer
          currency: 'NGN',
          callback_url: data.callback_url,
          metadata: data.metadata
          // callback_url: process.env.PAYSTACK_CALLBACK_URL || 'http://localhost:3000/payment/verify'
        },
        {
          headers: this.getHeaders()
        }
      );

      console.log('Paystack initialization response:', response.data);

      // return {
      //   success: true,
      //   data: response.data
      // };
      return response.data
    } catch (error) {
      console.error('Paystack initialization error:', error.response?.data || error.message);
      // return {
      //   success: false,
      //   message: error.response?.data?.message || 'Payment initialization failed',
      //   error: error.response?.data
      // };
      throw error
    }
  }


  // Generate unique reference
  generateReference() {
    return 'PAYSTACK_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
  }

  // Handle inline payment callback (to be called from frontend)
  async handlePaymentCallback(reference) {
    // Verify the payment after inline popup closes
    return this.verifyPayment(reference);
  }

  // Verify payment
  async verifyPayment(reference) {
    try {
      console.log('Verifying payment reference:', baseUrl);
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: this.getHeaders()
        }
      );
      console.log('Paystack verification response:', response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Paystack verification error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Payment verification failed'
      };
    }
  }

  // List banks (still needed for transfers)
  async listBanks() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/bank?country=nigeria`,
        {
          headers: this.getHeaders()
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error listing banks:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to list banks'
      };
    }
  }

  // Create transfer recipient (for vendor payouts)
  async createTransferRecipient(data) {
    try {
      console.log('Creating transfer recipient:', { data});
      const response = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        {
          type: 'nuban',
          name: data.name,
          account_number: data.accountNumber,
          bank_code: data.bankCode,
          currency: 'NGN'
        },
        {
          headers: this.getHeaders()
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error creating transfer recipient:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to create recipient'
      };
    }
  }

  // Initiate transfer (for vendor payouts)
  async initiateTransfer(data) {
    try {
      console.log('Initiating transfer:', { data });
      const response = await axios.post(
        `${this.baseUrl}/transfer`,
        {
          source: 'balance',
          amount: data.amount * 100,
          recipient: data.recipientCode,
          reason: data.reason, 
          reference: data.reference
        },
        {
          headers: this.getHeaders()
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error initiating transfer:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to initiate transfer'
      };
    }
  }

  // Charge card (for saved cards)
  async chargeCard(email, amount, card, metadata = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/charge_authorization`,
        {
          email,
          amount: amount * 100,
          authorization_code: card.authorization_code,
          metadata
        },
        {
          headers: this.getHeaders()
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error charging card:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to charge card'
      };
    }
  }

    // Get transaction history
    async getTransactionHistory(perPage = 50, page = 1) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/transaction?perPage=${perPage}&page=${page}`,
          {
            headers: this.getHeaders()
          }
        );
  
        return {
          success: true,
          data: response.data.data
        };
      } catch (error) {
        console.error('Error fetching transaction history:', error.response?.data || error.message);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch transactions',
          data: []
        };
      }
    }
  
    // Get balance
    async getBalance() {
      try {
        const response = await axios.get(
          `${this.baseUrl}/balance`,
          {
            headers: this.getHeaders()
          }
        );
  
        return {
          success: true,
          data: response.data.data
        };
      } catch (error) {
        console.error('Error fetching balance:', error.response?.data || error.message);
        return {
          success: false,
          message: error.response?.data?.message || 'Failed to fetch balance',
          data: []
        };
      }
    }
}

export default PaystackService;