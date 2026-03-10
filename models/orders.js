import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant.menu' },
  name: String,
  price: Number,
  quantity: Number,
  specialInstructions: {type: String, default: ''},
  image: String
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: {type:[orderItemSchema], required: true, validate: {validator: function(v) {return v && v.length > 0;}, message: 'Order must have at least one item'}},
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing','ready', 'out for delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryNotes: String,
  promoCode: String,
  deliveryAddress: String,
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' }, 
  paymentMethod: { type: String, enum: ['cash', 'card', 'transfer'], default: 'card' },
  paymentReference: String,
},{
  timestamps: true
});

export default mongoose.model('Order', orderSchema);