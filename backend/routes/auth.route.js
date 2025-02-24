import express from "express";
// import {authMiddleware} from "../middlewares/auth.Middleware.js"

import {validateLogin} from "../middlewares/auth.Middleware.js"
import {validateSignup} from "../middlewares/auth.Middleware.js"

import { signup,
    logout1,
    login ,
    refreshToken,
    getProfile,
    resetpassword,
    verifyemail,
    sociallogin,
    changepassword,
    verifyMFA,
    enableMFA,
    deactivateAccount,
    reactivateAccount,
    deleteAccount,
    getAllUsers,
    blockUser,
    unblockUser
} from "../controllers/auth.controller.js";

// import protectRoute from "../middlewares/auth.Middleware.js";


const router = express.Router();

router.post("/signup",validateSignup,signup)
// router.post("/logout",logout)
router.post("/logout1",logout1)

router.post("/login",validateLogin,login)

router.post("/refresh-token",refreshToken)

router.get("/Profile",getProfile)

// router.get("/profile", authMiddleware, getProfile);

router.patch("/resetpassword",resetpassword)

export default router