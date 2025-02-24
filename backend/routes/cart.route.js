
import express from "express";
import {getCartProducts, addToCart,removeAllFromCart,updateQuantity } from "../controllers/cart.controller.js";
import { protectRoute } from "../middlewares/auth.Middleware.js";
// import { get } from "mongoose";

const router = express.Router();
router.get("/",protectRoute,getCartProducts)
router.post("/",protectRoute,addToCart)
router.delete("/",protectRoute,removeAllFromCart)
router.put("/:id",protectRoute,updateQuantity) 


export default router

