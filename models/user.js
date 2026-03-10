import mongoose from 'mongoose';
import {hash, compare} from 'bcryptjs';
import validator from 'validator';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        // Remove all non-digits and check length
        const digitsOnly = v.replace(/\D/g, '');
        return digitsOnly.length == 11;
      },
      message: 'Please provide a valid phone number'
    },
    set: function(v) {
      // Store only digits for consistency
      return v.replace(/\D/g, '');
    }
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: { type: String, default: 'US' }
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'restaurant_owner'],
    default: 'user'
  },
  avatar: String,
  isActive: {
    type: Boolean,
    default: true
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  console.log('Pre-save hook triggered');
  console.log('Password modified?', this.isModified('password'));
  console.log('Original password:', this.password)
  if (!this.isModified('password')) return ;
  this.password = await hash(this.password, 12);
  console.log('Hashed password:', this.password);

});

// Compare password method
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await compare(candidatePassword, userPassword);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    // eslint-disable-next-line no-undef
    process.env.JWT_SECRET,
    // eslint-disable-next-line no-undef
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export default mongoose.model('User', userSchema);