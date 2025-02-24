import express from "express";

import Product from "../models/product.model.js";

import { protectRoute ,adminRoute} from "../middlewares/auth.Middleware.js";

import { getAllProducts,
    getFeaturedProducts,
    createProduct,
    deleteProduct,
    getRecommendations,
    getProductsByCategory,
    toggleFeaturedProduct
 } from "../controllers/product.controller.js";

const router = express.Router();

router.get("/",protectRoute,adminRoute,getAllProducts)

router.get("/featured",getFeaturedProducts)  // everyone called this function even not login user also 

router.get("/category/:category",getProductsByCategory)

router.get("/recommendations",getRecommendations) // fetch 3 products

router.post("/createProduct",protectRoute,adminRoute,createProduct) // here we will upload image so we will need to use cloudinary database

router.patch("/:id",protectRoute,adminRoute,toggleFeaturedProduct)// patch use for updating couple of fields and put use for when you have to need update entire document

router.delete("/:id",protectRoute,adminRoute,deleteProduct)

export default router
