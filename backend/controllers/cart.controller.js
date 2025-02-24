// import express = require("express");

import Product from "../models/product.model.js";

/**
 * @function getCartProducts
 * @description Fetches the products in the user's cart along with their quantities.
 * @param {Object} res - The Express response object.
 * @param {Object} req - The Express request object containing the user's cart items.
 * @returns {Object} - JSON response with the status, message, and list of cart products with quantities.
 * @throws {Error} - Returns a 500 error if the operation fails.
 */

export const getCartProducts = async (res, req) => {
  try {
    // Fetch all products from the database whose IDs are present in the user's cart
    // but each product doesnot have qyanitity
    const products = await Product.find({
      _id: {
        $in: req.user.cartItems // fetch all products whose IDs are present in the user's cart
      },
    });

    // For each product, create a new object that contains the product data and the quantity from the user's cart
    const cartItems = products.map(product => {
      // Find the corresponding item in the user's cart
      const item = req.user.cartItems.find(cartItem => cartItem.id === product.id);

      // Create a new object containing the product data and the quantity
      return {
        ...product.toJSON(), // include all product data in the new object
        quantity: item?.quantity, // add the quantity from the user's cart to the new object
      };
    });

    // Return the list of products with their quantities in the response
    res.status(200).json({
      status: true,
      msg: "cart products fetched successfully",
      data: cartItems,
    });
  } catch (error) {
    console.log("server error", error.message);
    res.status(500).json({
      status: false,
      msg: "failed to fetch getcartproducts controllers" + error.message,
    });
  }
};

// This function adds a product to the user's cart.
// If the product is already in the cart, the quantity is incremented by 1.
// If the product is not in the cart, it is added with a quantity of 1.
export const addToCart = async (res, req) => {
    try {
        const { productId } = req.body;
        const user = req.user; // protectRoute middleware populates this  // protectroute ke karan req.user ka use karta hu 

        const existingItem = user.cartItems.find(item => item.id === productId);
        if (existingItem) {
            // if the product is already in the cart, increment the quantity
            existingItem.quantity += 1;
        } else {
            // if the product is not in the cart, add it with a quantity of 1
            user.cartItems.push(productId);
        }

        // save the updated user object to the database
        await user.save();

        // return the updated cart items
        res.status(200).json({
            status: true,
            msg: "added to cart successfully",
            data: user.cartItems
        });
    } catch (error) {
        console.log("server error", error.message);
        res.status(500).json({
            status: false,
            msg: "failed to add to cart" + error.message
        })
    }
}

    /**
 * @function removeAllFromCart
 * @description This function removes all products from a user's cart. If a specific product ID is provided, only that product is removed; otherwise, all products are removed.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - Request body containing product ID.
 * @param {Object} res - The Express response object.
 * @throws {Error} Throws a 500 error if the removal process fails.
 */
export const removeAllFromCart = async (res, req) => {
  try {
    // Extract productId from the request body
    const { productId } = req.body;
    // Get the authenticated user from the request
    const user = req.user;

    // Check if productId is provided
    if (!productId) {
      // If no specific productId is provided, clear the entire cart
      user.cartItems = [];
    } else {
      // Otherwise, filter out the product with the given productId from the cart
      user.cartItems = user.cartItems.filter((item) => item.id !== productId);
    }

    // Save the updated user document to the database
    await user.save();

    // Send a success response with the updated cart items
    res.status(200).json({
      status: true,
      msg: "removed from cart successfully",
      data: user.cartItems,
    });
  } catch (error) {
    // Log the error and send a failure response
    res.status(500).json({
      status: false,
      msg: "failed to remove from cart" + error.message,
    });
  }
};


/**
 * @function updateQuantity
 * @description Updates the quantity of a specific product in the user's cart. If the quantity is set to 0, the product is removed from the cart.
 * @param {Object} req - The Express request object containing params and body.
 * @param {Object} req.params - Request parameters containing the product ID.
 * @param {Object} req.body - Request body containing the desired quantity.
 * @param {Object} res - The Express response object.
 * @throws {Error} Throws a 500 error if the update process fails.
 */

export const updateQuantity = async (res, req) => {

    try {
      // Get the product ID from the request URL parameters
      const {id:productId}=req.params;

      // Get the desired quantity from the request body
      const {quantity}=req.body;

      // Get the user who is making the update request
      const user =req.user;

      // Find the product item in the user's cart with the given product ID
      const existingItem = user.cartItems.find(item => item.id === productId); 

      if (existingItem) {
        // If the desired quantity is 0, then remove the product from the cart
        if(quantity === 0){
          // Remove the product from the user's cart
          user.cartItems = user.cartItems.filter((item)=>item.id !== productId)

          // Save the updated user document to the database
          await user.save();

          // Send a success response with the updated cart items
          return res.status(200).json({
            status: true,
            msg: "removed from cart successfully",
            data: user.cartItems,
          });

        // If the desired quantity is not 0, update the quantity of the product in the cart
        } else {
          // Update the quantity of the product in the user's cart
          existingItem.quantity = quantity; // increment the quantity and decrement the quantity
          // Save the updated user document to the database
          await user.save();

          // Send a success response with the updated cart items
          res.status(200).json({
            status: true,
            msg: "updated quantity successfully",
            data: user.cartItems,
          });
        }
      } else{
        // If the product is not found in the user's cart, send a 404 error response
        res.status(404).json({
          status: false,
          msg: "item not found in cart"
        })
      }
       
    } catch (error) {
      // Log the error and send a failure response
      console.log("server error", error.message);
      res.status(500).json({
          status: false,
          msg: "failed to update quantity" + error.message
      })
    }
  }

  
// map() ensures every product is included in the cartItems array, even if it's not in the user's cart.
// Final Thoughts
// ✅ Use map() when you want to modify each element of an array and return a new array of the same length.
// ✅ Use filter() when you want to remove elements based on a condition.

// Here, we want to modify products by adding a quantity field, so map() is the right choice. 🚀







