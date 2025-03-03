import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Address from "../models/address.model.js";
import getCoordinates from "../utils/getCoordinates.js";
import fetch from "node-fetch";
import axios from "axios";


/** 🔹 Helper Function to Get User ID from Token */
const getUserIdFromToken = (req) => {
    const refreshToken = req.cookies?.refreshToken;  // Get refresh token from cookies
    if (!refreshToken) throw new Error("Unauthorized: Refresh token is missing.");

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    return decoded.userId;  // Return User ID from token
};

/** 🟢 Add Address */
// export const addAddress = async (req, res) => {
//     try {
//         const userId = getUserIdFromToken(req); // Get user ID from token
//         const { street, address2, landmark, city, state, country, postalCode } = req.body;

//         // 🔸 Count user's existing addresses
//         const addressCount = await Address.countDocuments({ user: userId });
//         if (addressCount >= 5) {
//             return res.status(400).json({ success: false, message: "You can only store up to 5 addresses." });
//         }

//         const fullAddress = `${street}, ${address2 || ""}, ${landmark || ""}, ${city}, ${state}, ${country}, ${postalCode}`;
//         const { latitude, longitude } = await getCoordinates(fullAddress);

//         const address = new Address({
//             user: userId,
//             street,
//             address2,
//             landmark,
//             city,
//             state,
//             country,
//             postalCode,
//             latitude,
//             longitude
//         });

//         await address.save();
//         res.status(201).json({ success: true, message: "Address added successfully", address });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };


// 🟡 Update Address api

// export const addAddress = async (req, res) => {
//     try {
 
//         const userId = getUserIdFromToken(req);
//         if (!userId) {
//             return res.status(400).json({
//                  status: false,
//                   msg: "Invalid refresh token" 
//                 });
//         }

//         const { 
//             street, 
//             address2,
//              landmark, 
//              city, 
//              state,
//               country,
//                postalCode 
//             } = req.body;

//         // ✅ Address validation
//         if (!street || !city || !state || !country || !postalCode) {
//             return res.status(400).json({ 
//                 status: false,
//                  msg: "All address fields are required!"
//                  });
//         }

//         // ✅ Fetch Latitude & Longitude from OpenStreetMap
//         const query = `${street}, ${city}, ${state}, ${country}`;

//         const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

//         const geoResponse = await fetch(geoUrl);

//         const geoData = await geoResponse.json();

//         if (!geoData.length) {
//             return res.status(400).json({
//                  status: false,
//                   msg: "Could not fetch latitude & longitude. Please check your address." });
//         }

//         const { lat, lon } = geoData[0];

//         // ✅ Check if user already has 5 addresses
//         const userAddresses = await Address.find({ user: userId });
//         if (userAddresses.length >= 5) {
//             return res.status(400).json({ 
//                 status: false, 
//                 msg: "You can only add up to 5 addresses!" 
//             });
//         }

//         // ✅ Save address in database
//         const newAddress = new Address({
//             user: userId,
//             street,
//             address2,
//             landmark,
//             city,
//             state,
//             country,
//             postalCode,
//             latitude: parseFloat(lat),
//             longitude: parseFloat(lon),
//         });

//         await newAddress.save();

//         res.status(201).json({
//              success: true,
//               message: "Address added successfully",
//                address: newAddress
//              });

//     } catch (error) {
//         console.error("Add Address Error:", error);

//         res.status(500).json({ 
//             status: false,
//              msg: "Server error: " + error.message
//              });
//     }
// };

// updated addaddress
// import axios from "axios";
// import User from "../models/User.js";
// import Address from "../models/Address.js";

/**
 * @api {post} /address/add Add a new address to a user
 * @apiName AddAddress
 * @apiGroup Address
 * @apiVersion 1.0.0
 * @apiDescription Add a new address to a user
 * @apiParam {String} userId User ID of the user (optional if token is provided)
 * @apiParam {String} street Street address
 * @apiParam {String} [address2] Address line 2 (optional)
 * @apiParam {String} [landmark] Landmark (optional)
 * @apiParam {String} city City
 * @apiParam {String} state State
 * @apiParam {String} country Country
 * @apiParam {String} postalCode Postal code
 * @apiSuccess {Object} address Address object
 * @apiSuccess {String} address.street Street address
 * @apiSuccess {String} [address.address2] Address line 2
 * @apiSuccess {String} [address.landmark] Landmark
 * @apiSuccess {String} address.city City
 * @apiSuccess {String} address.state State
 * @apiSuccess {String} address.country Country
 * @apiSuccess {String} address.postalCode Postal code
 * @apiSuccess {Number} address.latitude Latitude
 * @apiSuccess {Number} address.longitude Longitude
 * @apiError {Object} error Validation error
 * @apiError {String} error.msg Error message
 * @apiErrorExample {json} Validation error
 *     HTTP/1.1 400 Bad Request
 *     {
 *       "status": false,
 *       "msg": "All address fields are required!"
 *     }
 * @apiErrorExample {json} Server error
 *     HTTP/1.1 500 Internal Server Error
 *     {
 *       "status": false,
 *       "msg": "Server error: Error fetching location data!"
 *     }
 */
export const addAddress = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req) || req.body.userId;   // Token ya body se userId le rahe hain
        
        if (!userId) {
            return res.status(400).json({ 
                status: false,
                 msg: "Invalid user token or ID missing!" 
                });
        }
          // ✅ Check if user exists in DB
          const userExists = await User.findById(userId);
          
          if (!userExists) {
              return res.status(400).json({
                 status: false,
                  msg: "User does not exist!" }
                );
          }

        const { 
            street,
             address2, 
             landmark,
              city,
               state, 
               country, 
               postalCode ,
               phoneNumber,
               alternatePhone,
               addressType,
               deliveryInstructions
            } = req.body;

        if (!street || !city || !state || !country || !postalCode || !phoneNumber || !alternatePhone ) {
            return res.status(400).json({
                 status: false,
                  msg: "All address fields are required!"
                 });
        }

        // ✅ Fetch Latitude & Longitude using OpenStreetMap
        const query = `${street}, ${city}, ${state}, ${country}`;

        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

        let geoData;
        try {
            const geoResponse = await axios.get(geoUrl);
            geoData = geoResponse.data;
        } catch (err) {
            return res.status(500).json({ 
                status: false,
                 msg: "Error fetching location data!" + err.message 
                });
        }

        if (!geoData.length) {
            return res.status(400).json({ 
                status: false,
                 msg: "Invalid address. Could not fetch coordinates." 
                });
        }

        const { lat, lon } = geoData[0];

        // ✅ Check max address limit
        const userAddresses = await Address.find({ user: userId });
        
        if (userAddresses.length >= 5) {
            return res.status(400).json({ 
                status: false,
                 msg: "You can only add up to 5 addresses!" 
                }
                );
        }

        // ✅ Save address in database
        const newAddress = new Address({
            user: userId,
            street,
            address2,
            landmark,
            city,
            state,
            country,
            postalCode,
            phoneNumber,
            alternatePhone,
            addressType,
            deliveryInstructions,
            latitude: parseFloat(lat),
            longitude: parseFloat(lon),
        });

        await newAddress.save();

        // ✅ Update user document to store address reference
        await User.findByIdAndUpdate(userId, { $push: { useraddress: newAddress } });

        res.status(201).json({
            success: true,
            message: "Address added successfully",
            address: newAddress
        });

    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({
             status: false, 
             msg: "Server error: " + error.message 
            });
    }
};

/** 🟡 Update Address */
// If the user updates city, state, country, or postalCode, it fetches new latitude and longitude.
// If the user updates only street, address2, or landmark, it retains the existing latitude and longitude.

// import axios from 'axios';
// import Address from '../models/Address';
// import { getUserIdFromToken } from '../utils/auth';

// export const updateAddress = async (req, res) => {
//     try {
//         const userId = getUserIdFromToken(req);
//         const { addressId } = req.params;
//         const { street, address2, landmark, city, state, country, postalCode } = req.body;

//         // 🔹 Step 1: Check if address exists before updating
//         const existingAddress = await Address.findOne({ _id: addressId, user: userId });

//         if (!existingAddress) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Address not found"
//             });
//         }

//         // Store current latitude and longitude
//         let { latitude, longitude } = existingAddress;

//         // 🔹 Step 2: Check if location-related fields are updated
//         const isLocationChanged =
//             (city && city !== existingAddress.city) ||
//             (state && state !== existingAddress.state) ||
//             (country && country !== existingAddress.country) ||
//             (postalCode && postalCode !== existingAddress.postalCode);

//         if (isLocationChanged) {
//             // Ensure all required fields are present before making API call
//             if (!city || !state || !country || !postalCode) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "City, State, Country, and Postal Code are required to update coordinates."
//                 });
//             }

//             // Construct full address for geolocation
//             const fullAddress = `${street || existingAddress.street}, 
//                                  ${address2 || existingAddress.address2 || ""}, 
//                                  ${landmark || existingAddress.landmark || ""}, 
//                                  ${city}, ${state}, ${country}, ${postalCode}`;

//             try {
//                 const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;
//                 const geoResponse = await axios.get(geoUrl);
//                 const geoData = geoResponse.data;

//                 if (geoData.length > 0) {
//                     latitude = parseFloat(geoData[0].lat);
//                     longitude = parseFloat(geoData[0].lon);
//                 } else {
//                     console.warn("No coordinates found for:", fullAddress);
//                 }
//             } catch (error) {
//                 console.error("Error fetching coordinates:", error.message);
//             }
//         }

//         // 🔹 Step 3: Update Address
//         const updatedAddress = await Address.findOneAndUpdate(
//             { _id: addressId, user: userId },
//             {
//                 street,
//                 address2,
//                 landmark,
//                 city,
//                 state,
//                 country,
//                 postalCode,
//                 latitude,
//                 longitude
//             },
//             { new: true }
//         );

//         res.json({
//             success: true,
//             message: "Address updated successfully",
//             updatedAddress
//         });

//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             message: "Server error: " + error.message
//         });
//     }
// };

// new api change address
export const updateAddress = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const { addressId } = req.params;
        const { street, address2, landmark, city, state, country, postalCode } = req.body;

        // 🔹 Step 1: Check if address exists
        const existingAddress = await Address.findOne({ _id: addressId, user: userId });

        if (!existingAddress) {
            return res.status(404).json({
                success: false,
                message: "Address not found"
            });
        }

        // Store current latitude and longitude
        let latitude = existingAddress.latitude;
        let longitude = existingAddress.longitude;

        // 🔹 Step 2: Check if location-related fields are updated
        const isLocationChanged =
            (city && city !== existingAddress.city) ||
            (state && state !== existingAddress.state) ||
            (country && country !== existingAddress.country) ||
            (postalCode && postalCode !== existingAddress.postalCode);

        if (isLocationChanged) {
            // Ensure required fields are present
            if (!city || !state || !country) {
                return res.status(400).json({
                    success: false,
                    message: "City, State, and Country are required to update coordinates."
                });
            }

            // ✅ Use same query format as `addAddress`
            const query = `${street || existingAddress.street}, ${city}, ${state}, ${country}`;

            try {
                const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;
                const geoResponse = await axios.get(geoUrl);
                const geoData = geoResponse.data;

                if (geoData.length > 0) {
                    latitude = parseFloat(geoData[0].lat);
                    longitude = parseFloat(geoData[0].lon);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: "Could not fetch coordinates for the provided address."
                    });
                }
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: "Error fetching coordinates: " + error.message
                });
            }
        }

        // 🔹 Step 3: Update Address including latitude and longitude
        const updatedAddress = await Address.findOneAndUpdate(
            { _id: addressId, user: userId },
            {
                street,
                address2,
                landmark,
                city,
                state,
                country,
                postalCode,
                latitude,
                longitude // ✅ Ensure latitude and longitude are updated
            },
            { new: true }
        );

        res.json({
            success: true,
            message: "Address updated successfully",
            updatedAddress
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error: " + error.message
        });
    }
};

/** 🔴 Delete Address */
export const deleteAddress = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const { addressId } = req.params;

        const deletedAddress = await Address.findOneAndDelete({ _id: addressId, user: userId });
        if (!deletedAddress) return res.status(404).json({ success: false, message: "Address not found" });

        res.json({ success: true, message: "Address deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 🔵 Get Address by ID */
export const getAddressById = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const { addressId } = req.params;

        const address = await Address.findOne({ _id: addressId, user: userId });
        if (!address) return res.status(404).json({ success: false, message: "Address not found" });

        res.json({ success: true, address });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/** 🟠 Get All Addresses by User */
export const getUserAddresses = async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        const addresses = await Address.find({ user: userId });

        res.json({ success: true, addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};



//points of  create api for find nearest store 
//  1 search  nearby store using latitude  and longitude 
// 2 fetch all stores according by nearest 

// for location agggregate = $geoNear   
// [
//     Here’s an advanced Node.js API using Express and MongoDB (Mongoose) to find the nearest stores based on latitude and longitude.

// Features of This API
// ✅ Uses MongoDB's geospatial indexing for efficient queries.
// ✅ Two Endpoints:

// /searchNearbyStores – Finds stores within a given radius.
// /fetchAllNearestStores – Fetches all stores sorted by proximity.
// ✅ Supports Indexing for Fast Search using 2dsphere index.
// ✅ Highly Scalable for large datasets.
// 1️⃣ MongoDB Schema (models/Store.js)
// Create a Store model with geospatial indexing.

// const mongoose = require("mongoose");

// const storeSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   address: { type: String, required: true },
//   location: {
//     type: { type: String, enum: ["Point"], required: true },
//     coordinates: { type: [Number], required: true }, // [longitude, latitude]
//   },
// });

// // Create 2dsphere index for geospatial queries
// storeSchema.index({ location: "2dsphere" });

// module.exports = mongoose.model("Store", storeSchema);

// type: "Point" -> Yeh define karta hai ki location ek single point hai.
// coordinates: [longitude, latitude] -> Yeh longitude aur latitude ka array store karta hai.
// storeSchema.index({ location: "2dsphere" }) -> Yeh index create karta hai jo queries ko fast banata hai.

// MongoDB ka $geoNear ya $geoWithin operator use karke hum sabse kareeb ke stores dhoondh sakte hain.

// ⚡ Benefits of 2dsphere Index
// ✅ Fast Search – Normal queries ke comparison me 100x tez chalti hai.
// ✅ Geo Queries – Aap nearest places, within area search, distance calculation kar sakte hain.
// ✅ Scalability – Large datasets ke liye optimized hai.

// Agar aap location-based search features bana rahe ho (jaise Swiggy, Zomato, Ola, Uber), to 2dsphere index must hai! 🚀
// 2️⃣ Express API Implementation (server.js)
// Install Required Dependencies

// npm install express mongoose dotenv
// API Code (server.js)

// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const Store = require("./models/Store");

// const app = express();
// const PORT = process.env.PORT || 5000;

// app.use(express.json());

// // Connect to MongoDB
// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// // 1️⃣ API: Search Nearby Stores Within a Radius (Default: 10 km)
// app.get("/searchNearbyStores", async (req, res) => {
//   try {
//     const { latitude, longitude, radius = 10 } = req.query;

//     if (!latitude || !longitude) {
//       return res.status(400).json({ error: "Latitude and Longitude are required" });
//     }

//     const stores = await Store.find({
//       location: {
//         $geoWithin: {
//           $centerSphere: [[parseFloat(longitude), parseFloat(latitude)], radius / 6378.1], // Radius in km
//         },
//       },
//     });

//     res.json(stores);
//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // 2️⃣ API: Fetch All Stores Sorted by Nearest Distance
// app.get("/fetchAllNearestStores", async (req, res) => {
//   try {
//     const { latitude, longitude } = req.query;

//     if (!latitude || !longitude) {
//       return res.status(400).json({ error: "Latitude and Longitude are required" });
//     }

//     const stores = await Store.aggregate([
//       {
//         $geoNear: {
//           near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
//           distanceField: "distance",
//           spherical: true,
//         },
//       },
//     ]);

//     res.json(stores);
//   } catch (err) {
//     console.error("Error:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// // Start Server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
// 3️⃣ How to Use the API
// 📌 1. Search for Nearby Stores
// Endpoint:


// GET /searchNearbyStores?latitude=28.7041&longitude=77.1025&radius=10
// Response:


// [
//   {
//     "_id": "64a1b1d9...",
//     "name": "SuperMart",
//     "address": "Connaught Place, Delhi",
//     "location": {
//       "type": "Point",
//       "coordinates": [77.1025, 28.7041]
//     }
//   }
// ]
// 📌 2. Fetch All Stores Sorted by Nearest Distance
// Endpoint:

// GET /fetchAllNearestStores?latitude=28.7041&longitude=77.1025
// Response:


// [
//   {
//     "_id": "64a1b1d9...",
//     "name": "Local Grocery",
//     "address": "Karol Bagh, Delhi",
//     "location": {
//       "type": "Point",
//       "coordinates": [77.1030, 28.7050]
//     },
//     "distance": 1200.5
//   },
//   {
//     "_id": "64a1b1d9...",
//     "name": "SuperMart",
//     "address": "Connaught Place, Delhi",
//     "location": {
//       "type": "Point",
//       "coordinates": [77.1025, 28.7041]
//     },
//     "distance": 2500.3
//   }
// ]
// 4️⃣ How to Insert Data in MongoDB
// Run this script in Node.js to add sample stores:

// const mongoose = require("mongoose");
// const Store = require("./models/Store");

// mongoose
//   .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(async () => {
//     console.log("Connected to MongoDB");

//     const stores = [
//       {
//         name: "SuperMart",
//         address: "Connaught Place, Delhi",
//         location: { type: "Point", coordinates: [77.1025, 28.7041] },
//       },
//       {
//         name: "Local Grocery",
//         address: "Karol Bagh, Delhi",
//         location: { type: "Point", coordinates: [77.1030, 28.7050] },
//       },
//     ];

//     await Store.insertMany(stores);
//     console.log("Stores inserted successfully");

//     mongoose.connection.close();
//   })
//   .catch((err) => console.error("MongoDB connection error:", err));
// ✅ Why This is an Advanced API?
// ✔ Uses MongoDB’s Geospatial Indexing (2dsphere) for optimized queries.
// ✔ Implements $geoWithin and $geoNear queries for high performance.
// ✔ Uses Mongoose Schema Validation to ensure correct data.
// ✔ Highly Scalable for large datasets.
// ]

// {
//     🚀 Advanced Level Nearest Store API with Redis Caching & JWT Authentication
// Aapke requirement ke hisaab se, hum 3 major features add karenge:
// 1️⃣ Find Nearby Store API (Latitude & Longitude ke basis par)
// 2️⃣ Fetch All Stores Sorted by Nearest
// 3️⃣ Redis Caching for Fast Responses
// 4️⃣ JWT Authentication for Secure API Access

// 📌 Step 1: Install Required Packages
// sh
// Copy
// Edit
// npm install express mongoose jsonwebtoken redis dotenv
// express → API banane ke liye
// mongoose → MongoDB connection ke liye
// jsonwebtoken → JWT auth ke liye
// redis → Caching ke liye
// dotenv → Environment variables ke liye
// 📌 Step 2: Setup MongoDB with 2dsphere Index
// Pehle Mongoose model banate hain jo latitude & longitude store karega.

// 📝 models/Store.js
// javascript
// Copy
// Edit
// const mongoose = require("mongoose");

// const storeSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   address: { type: String, required: true },
//   location: {
//     type: { type: String, enum: ["Point"], required: true },
//     coordinates: { type: [Number], required: true }, // [longitude, latitude]
//   },
// });

// // Important: Create 2dsphere index for geo queries
// storeSchema.index({ location: "2dsphere" });

// module.exports = mongoose.model("Store", storeSchema);
// 📌 Step 3: Setup Redis for Caching
// Agar user baar-baar same request kare, to Redis caching use karke response fast banayenge.

// 📝 config/redisClient.js
// javascript
// Copy
// Edit
// const redis = require("redis");

// const redisClient = redis.createClient({
//   socket: { host: "127.0.0.1", port: 6379 }, // Default Redis port
// });

// redisClient.on("error", (err) => console.error("Redis Error:", err));

// (async () => {
//   await redisClient.connect();
//   console.log("Redis Connected ✅");
// })();

// module.exports = redisClient;
// 📌 Step 4: Create JWT Authentication Middleware
// Hum ek JWT token authentication middleware banayenge jo API ko secure karega.

// 📝 middleware/authMiddleware.js
// javascript
// Copy
// Edit
// const jwt = require("jsonwebtoken");
// const dotenv = require("dotenv");
// dotenv.config();

// module.exports = function (req, res, next) {
//   const token = req.header("Authorization");
//   if (!token) return res.status(401).json({ error: "Access Denied" });

//   try {
//     const verified = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = verified;
//     next();
//   } catch (err) {
//     res.status(400).json({ error: "Invalid Token" });
//   }
// };
// 🔹 Token send karne ke liye request header me "Authorization": "Bearer <TOKEN>" bhejna hoga.

// 📌 Step 5: Create API Routes
// Ab hum 2 API endpoints banayenge:

// Find nearest store
// Fetch all stores sorted by distance
// 📝 routes/storeRoutes.js
// javascript
// Copy
// Edit
// const express = require("express");
// const Store = require("../models/Store");
// const redisClient = require("../config/redisClient");
// const authMiddleware = require("../middleware/authMiddleware");

// const router = express.Router();

// /**
//  * 🔍 API 1: Find Nearest Store (Within 10 KM)
//  */
// router.get("/findNearestStore", authMiddleware, async (req, res) => {
//   try {
//     const { latitude, longitude } = req.query;

//     if (!latitude || !longitude) {
//       return res.status(400).json({ error: "Latitude & Longitude required" });
//     }

//     const cacheKey = `nearest_store_${latitude}_${longitude}`;
//     const cachedData = await redisClient.get(cacheKey);
    
//     if (cachedData) {
//       return res.status(200).json(JSON.parse(cachedData));
//     }

//     const store = await Store.findOne({
//       location: {
//         $near: {
//           $geometry: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
//           $maxDistance: 10000, // 10 KM
//         },
//       },
//     });

//     if (!store) return res.status(404).json({ error: "No stores found nearby" });

//     await redisClient.setEx(cacheKey, 3600, JSON.stringify(store)); // Cache for 1 hour

//     res.status(200).json(store);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// /**
//  * 📍 API 2: Fetch All Stores Sorted by Nearest
//  */
// router.get("/fetchAllNearestStores", authMiddleware, async (req, res) => {
//   try {
//     const { latitude, longitude } = req.query;

//     if (!latitude || !longitude) {
//       return res.status(400).json({ error: "Latitude & Longitude required" });
//     }

//     const cacheKey = `all_nearest_stores_${latitude}_${longitude}`;
//     const cachedData = await redisClient.get(cacheKey);

//     if (cachedData) {
//       return res.status(200).json(JSON.parse(cachedData));
//     }

//     const stores = await Store.aggregate([
//       {
//         $geoNear: {
//           near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] },
//           distanceField: "distance",
//           maxDistance: 20000, // 20 KM
//           spherical: true,
//         },
//       },
//     ]);

//     await redisClient.setEx(cacheKey, 3600, JSON.stringify(stores)); // Cache for 1 hour

//     res.status(200).json(stores);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// module.exports = router;
// 📌 Step 6: Setup Express Server
// 📝 server.js
// javascript
// Copy
// Edit
// const express = require("express");
// const mongoose = require("mongoose");
// const dotenv = require("dotenv");

// dotenv.config();

// const app = express();
// app.use(express.json());

// // MongoDB Connection
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected ✅"))
//   .catch((err) => console.error("MongoDB Connection Failed:", err));

// // Routes
// app.use("/api/stores", require("./routes/storeRoutes"));

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
// 📌 Step 7: Environment Variables
// 🔹 📝 .env File

// ini
// Copy
// Edit
// PORT=5000
// MONGO_URI=mongodb://localhost:27017/yourDBName
// JWT_SECRET=your_secret_key
// 📌 Step 8: Testing the APIs
// 1️⃣ Create a JWT Token (For Testing)

// http
// Copy
// Edit
// POST /api/auth/login
// Content-Type: application/json

// {
//   "email": "test@example.com",
//   "password": "123456"
// }
// 🔹 Response:

// json
// Copy
// Edit
// { "token": "your_generated_jwt_token" }
// 2️⃣ Find Nearest Store (10 KM Range)

// http
// Copy
// Edit
// GET /api/stores/findNearestStore?latitude=28.7041&longitude=77.1025
// Authorization: Bearer <TOKEN>
// 3️⃣ Fetch All Stores Sorted by Nearest

// http
// Copy
// Edit
// GET /api/stores/fetchAllNearestStores?latitude=28.7041&longitude=77.1025
// Authorization: Bearer <TOKEN>
// 🎯 Features Added
// ✅ MongoDB 2dsphere Index for Fast Geospatial Queries
// ✅ Redis Caching for Optimized Performance
// ✅ JWT Authentication for Secure API Access

// Aap chaho to pagination aur dynamic radius filtering bhi add kar sakte ho. 🚀
// Koi aur feature chahiye to batao! 🔥

// }