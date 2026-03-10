// Cart utility functions
const CART_KEY = 'foodCart';

export const cartUtils = {
  // Get current user's cart
  getCart: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?._id || 'guest';
    const allCarts = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    // console.log('getCart for userId:', userId, 'cart:', allCarts);
    return allCarts || [];
  },

  // Save cart for current user
  saveCart: (cartItems) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?._id || 'guest';
    const allCarts = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    allCarts[userId] = cartItems;
    localStorage.setItem(CART_KEY, JSON.stringify(allCarts));
    
    // Dispatch event to update header
    window.dispatchEvent(new Event('cartUpdated'));
  },

  // Clear current user's cart
  clearCart: () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userId = user?._id || 'guest';
    const allCarts = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    
    if (allCarts) {
      delete allCarts[userId];
      localStorage.setItem(CART_KEY, JSON.stringify(allCarts));
      window.dispatchEvent(new Event('cartUpdated'));
    }
  },

  // Clear all carts (on logout)
  clearAllCarts: () => {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event('cartUpdated'));
  },

  // Get cart count for current user
  getCartCount: () => {
    const cart = cartUtils.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  // Get cart count for any user (for header display)
  getCurrentCartCount: () => {
    const allCarts = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    // const user = JSON.parse(localStorage.getItem('user') || '{}');
    // const userId = user?._id || 'guest';
    const cart = allCarts || [];
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  // Sync cart across tabs
  syncCart: () => {
    const event = new Event('cartUpdated');
    window.dispatchEvent(event);
  },
  
  // Initialize cart sync listener
  initCartSync: () => {
    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === CART_KEY) {
        window.dispatchEvent(new Event('cartUpdated'));
      }
    });
  }
};

cartUtils.initCartSync();