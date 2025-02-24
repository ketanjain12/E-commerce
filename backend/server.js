import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js"

import { dbconnect } from "./lib/db.js";
import cookieParser from "cookie-parser";
import { setUpSwagger } from "./config/swaggerConfig.js";

dotenv.config();

const app = express();

const Port = 3000;

// ✅ Middlewares order fix
app.use(cors());
app.use(express.json());  // allows you to parse the body of the request
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());  // for logout api 

// ✅ Routes should come after middlewares
app.use("/api/auth", authRoutes);
app.use("/api/product", productRoutes);
app.use("/api/cart", cartRoutes);
// feb 18 create some coupons
app.use("/api/coupons", couponRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

//Setup Swagger documentation
setUpSwagger(app);

app.listen(Port, () => {
  console.log(`Server is running on port ${Port}`);
  dbconnect();
});



// logout logic 
// https://dev.to/m_josh/build-a-jwt-login-and-logout-system-using-expressjs-nodejs-hd2

// app.use(express.urlencoded({ extended: true })); ka use kya hai?
// Jab bhi koi form submit hota hai ya koi POST request bheji jati hai, toh uska data URL-encoded format me hota hai.
//  Yeh middleware Express ko data ko parse (samajhne) aur use karne me madad karta hai.