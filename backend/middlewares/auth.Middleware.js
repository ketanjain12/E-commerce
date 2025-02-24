import jwt from "jsonwebtoken";

import User from "../models/user.model.js";

import { check, validationResult } from "express-validator";

// const authMiddleware = (req, res, next) => {
//     const token = req.cookies?.token || req.headers["authorization"]?.split(" ")[1];

//     if (!token) {
//         return res.status(401).json({ 
//             status: false, 
//             msg: "Unauthorized! Token is missing." 
//         });
//     }

//     try {
//         const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//         req.user = decoded; // Save user data in request
//         next();

//     } catch (error) {
//         return res.status(403).json({ 
//             status: false,
//              msg: "Auth verification failed: " + error.message });
//     }
// };

// export default authMiddleware;



// Postman Headers Me Token Set Karna
// Headers Tab me jao.
// Key: Authorization
// Value: Bearer YOUR_ACCESS_TOKEN
// Request bhejo. ✅

// for admin 
// 


// new code 

export const authMiddleware = (req, res, next) => {
    try {
        // Token extract from Cookies or Authorization Header
        const authHeader = req.headers["authorization"];
        const token = req.cookies?.token || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null);

        if (!token) {
            return res.status(401).json({ 
                status: false, 
                msg: "Unauthorized! Token is missing." 
            });
        }

        // Decode Token
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // Debugging Logs (Remove in Production)
        console.log("Decoded Token:", decoded);

        // Ensure `userId` exists in token payload
        if (!decoded.userId) {
            return res.status(403).json({
                status: false,
                msg: "Invalid token: User ID is missing."
            });
        }

        req.user = decoded; // Attach user data to request
        next(); // Proceed to next middleware/controller

    } catch (error) {
        return res.status(403).json({ 
            status: false, 
            msg: "Auth verification failed: " + error.message 
        });
    }
};

// export default authMiddleware;
export const protectRoute = async(req,res,next)=>{
    // check user authenticated by taking a access token (get it from the cookies)
 try {
    const accessToken=req.cookies.accessToken;

    if(!accessToken){

   return res.status(401).json({
    status:false,
    msg:"Unauthorized -No accessToken provided"
   })

    }
   try {
     // now decoded token 
     const decoded = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET);
     // now find this decoded user 
     const user = await User.findById(decoded.userId).select("-password")
     
     if(!user){
         return res.status(401).json({
             status:false,
             msg:"user is not found "
            })
     }
     // if user is found then put this user to request 
     req.user =user;  //req.user = user; se user ki details har request ke sath available ho jati hai.

     next();
   } catch (error) {
    if(error.name === "TokenExpiredError"){
        return res.status(401).json({
            status:false,
            msg:"Unauthorized -access token expired   "
           })
    }
    throw error;
   }
 
 } catch (error) {
    console.log("error in productroute middleware", error.message);
    res.status(401).json({
      status: false,
      msg: "error in productroute middleware: " + error.message,
    });
 }
 next() // call next function 

}

export const adminRoute = async(req,res,next)=>{

    if(req.user && req.user?.role === "admin"){
        next()
    }
    else{
        return res.status(403).json({
             status: false,
              msg: "Access denied - Admin only  " 
             });

    }
}

// auth signup check validation file
export const validateSignup = [
  // Name validation
  check("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),

  // Email validation
  check("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .matches(/@(gmail|yahoo|outlook|protonmail|example)\.com$/)
    .withMessage("Email domain is not supported. Use Gmail, Yahoo, Outlook, or ProtonMail"),

  // Password validation
  check("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[!@#$%^&*]/).withMessage("Password must contain at least one special character"),

  // Role validation
  check("role")
    .notEmpty().withMessage("Role is required"),

  // Middleware to handle validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, errors: errors.array() });
    }
    next();
  }
];

export const validateLogin = [
  check("email")
    .notEmpty().withMessage("Email is required.")
    .isEmail().withMessage("Invalid email format. Please enter a valid email."),
  
  check("password")
    .notEmpty().withMessage("Password is required.")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long.")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter.")
    .matches(/[!@#$%^&*]/).withMessage("Password must contain at least one special character."),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        errors: errors.array().map(err => ({ field: err.param, msg: err.msg })),
      });
    }
    next();
  }
];

  