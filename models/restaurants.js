import {mongoose } from 'mongoose';

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  image: String,
  available: { type: Boolean, default: true }
},
{
  _id: true, // This enables _id for subdocuments
  timestamps: true // Optional: adds createdAt and updatedAt
});

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  cuisine: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to User model
    required: true
  },
  isActive: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  deliveryTime: String,
  image: String,
  address: String,
  menu: [menuItemSchema]
}, {
  timestamps: true
});

export default mongoose.model('Restaurant', restaurantSchema);