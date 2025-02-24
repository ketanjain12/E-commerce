import express from "express";
import { protectRoute } from "../middlewares/auth.Middleware.js";
import { createCheckoutSession,checkoutSuccess } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session",protectRoute,createCheckoutSession);
router.post("/checkout-success",protectRoute,checkoutSuccess);


export default router;
