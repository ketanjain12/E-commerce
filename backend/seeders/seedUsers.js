'use strict';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/user.model.js';
import os from 'os'; // ✅ Require ki jagah import use karo

import { dbconnect } from '../lib/db.js';
dotenv.config();

// MongoDB Connection
(async () => {

  await dbconnect(); // ✅ Await lagao taki proper connection ho

  console.log("🔍 MONGO_URI from .env : ", process.env.MONGO_URI);   // Check value

  await seedUsers(); // ✅ Seed function ko bhi async mein call karo

})();

// Seeder Function
async function seedUsers() {

  try {

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = [
      
      { name: 'John Doe', email: 'john@example.com', role: 'customer' },
      { name: 'Jane Smith', email: 'jane@example.com', role: 'admin' },
      { name: 'Alice Johnson', email: 'alice@example.com', role: 'customer' },
      { name: 'Bob Williams', email: 'bob@example.com', role: 'customer' },
      { name: 'Charlie Brown', email: 'charlie@example.com', role: 'customer' },
      { name: 'David Miller', email: 'david@example.com', role: 'customer' },
      { name: 'Emma Wilson', email: 'emma@example.com', role: 'admin' },
      { name: 'Frank Thomas', email: 'frank@example.com', role: 'customer' },
      { name: 'Grace White', email: 'grace@example.com', role: 'customer' },
      { name: 'Hannah Hall', email: 'hannah@example.com', role: 'admin' },
      { name: 'Isaac Allen', email: 'isaac@example.com', role: 'customer' },
      { name: 'Jack Young', email: 'jack@example.com', role: 'customer' },
      { name: 'Katherine King', email: 'katherine@example.com', role: 'customer' },
      { name: 'Leo Scott', email: 'leo@example.com', role: 'customer' },
      { name: 'Mia Green', email: 'mia@example.com', role: 'admin' },
      { name: 'Noah Adams', email: 'noah@example.com', role: 'customer' },
      { name: 'Olivia Baker', email: 'olivia@example.com', role: 'customer' },
      { name: 'Paul Carter', email: 'paul@example.com', role: 'customer' },
      { name: 'Quinn Nelson', email: 'quinn@example.com', role: 'customer' },
      { name: 'Ryan Perez', email: 'ryan@example.com', role: 'admin' }

    ];

    // Har user ke liye password encrypt karke insert karna
    const userData = users.map(user => ({

      ...user,
      password: hashedPassword,
      machineName: os.hostname(), // ✅ Replace `require('os')` with `import os`

    }));

    await User.insertMany(userData);
    console.log('✅ 20 users inserted successfully!');

  } catch (error) {
    console.error('❌ Error seeding users:', error);

  } finally {
    mongoose.connection.close();
  }
}

// Run Seeder
seedUsers();

// finally { mongoose.connection.close(); } ka use yeh ensure karne ke liye kiya gaya hai ki chahe
// try block successfully execute ho ya phir error aaye (catch block chale),
// MongoDB ka connection close ho jaye.taaki application me memory leak na ho aur connection idle na rahe.