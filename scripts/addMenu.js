// scripts/addMenuIds.js
import mongoose from 'mongoose';
import Restaurant from '../models/restaurants.js';
import { config } from "dotenv";
import { connectDB } from '../config/db.js';

config();
connectDB();

const addMenuIds = async () => {
  try {
    console.log('Connected to MongoDB');

    // Find all restaurants
    const restaurants = await Restaurant.find({});
    console.log(`Found ${restaurants.length} restaurants`);

    let updatedCount = 0;
    let totalMenuItemsUpdated = 0;

    for (const restaurant of restaurants) {
      let modified = false;
      let menuModifiedCount = 0;

      console.log(`\nProcessing restaurant: ${restaurant.name}`);

      // Check if restaurant has menu items
      if (!restaurant.menu || restaurant.menu.length === 0) {
        console.log('  No menu items found');
        continue;
      }

      console.log(`  Menu items before: ${restaurant.menu.length}`);

      // Check each menu item
      restaurant.menu = restaurant.menu.map((item, index) => {
        // If item doesn't have _id, add one
        if (!item._id) {
          modified = true;
          menuModifiedCount++;
          
          // Create a new ObjectId
          const newId = new mongoose.Types.ObjectId();
          
          // Log the change
          console.log(`  Adding ID to menu item ${index + 1}: ${item.name} -> ${newId}`);
          
          // Create a new object with _id and all existing properties
          return {
            _id: newId,
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image,
            available: item.available !== undefined ? item.available : true
          };
        }
        return item;
      });

      if (modified) {
        // Mark the menu array as modified
        restaurant.markModified('menu');
        
        // Save the restaurant
        await restaurant.save();
        
        updatedCount++;
        totalMenuItemsUpdated += menuModifiedCount;
        
        console.log(`  ✅ Updated ${menuModifiedCount} menu items for restaurant: ${restaurant.name}`);
        
        // Verify the save worked
        const verified = await Restaurant.findById(restaurant._id);
        const menuWithIds = verified.menu.filter(item => item._id);
        console.log(`  ✅ Verified: ${menuWithIds.length}/${verified.menu.length} items have IDs`);
      } else {
        console.log(`  No updates needed for ${restaurant.name}`);
      }
    }

    console.log('\n========== MIGRATION SUMMARY ==========');
    console.log(`✅ Total restaurants updated: ${updatedCount}`);
    console.log(`✅ Total menu items updated: ${totalMenuItemsUpdated}`);
    console.log('========================================');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addMenuIds();