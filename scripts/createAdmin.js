// backend/scripts/createAdmin.js
import {config}  from "dotenv";
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/user.js';

config();
connectDB();

async function createAdmin() {
  try {
    const adminData = {
      name: 'System Administrator',
      email: 'admin@foodexpress.com',
      password: 'Admin123!',
      phone: '09134567890',
      role: 'admin',
      address: {
        street: '123 Admin Street',
        city: 'Administration City',
        state: 'AC',
        zipCode: '00000',
        country: 'US'
      },
      isActive: true
    };

    const existingAdmin = await User.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log('⚠️  Admin already exists');
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin');
      }
      console.log('Admin details:', {
        id: existingAdmin._id,
        email: existingAdmin.email,
        role: existingAdmin.role
      });
    } else {
      const admin = await User.create(adminData);
      console.log('✅ Admin created successfully!');
      console.log('Admin details:', {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      });
    }
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createAdmin();