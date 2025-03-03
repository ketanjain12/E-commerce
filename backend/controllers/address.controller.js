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

        const { street,
             address2, 
             landmark,
              city,
               state, 
               country, 
               postalCode 
            } = req.body;

        if (!street || !city || !state || !country || !postalCode) {
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
