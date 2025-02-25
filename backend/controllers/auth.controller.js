import User from "../models/user.model.js";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import { redis } from "../lib/redis.js";
import bcrypt from "bcryptjs";

//extra add
import speakeasy from "speakeasy";
// speakeasy mainly two-factor authentication (2FA) aur OTP-based authentication implement karne ke liye use hota hai.
// Iska use Google Authenticator, Authy, Microsoft Authenticator jaisi apps ke saath bhi kiya ja sakta hai.

import { sendVerificationEmail } from "../utils/emailService.js";

/**
 * @function generateTokens
 * @description             Generate Access and Refresh Tokens for user authentication.
 * @param {String} userId - The unique ID of the user.
 * @returns {Object}        Returns an object containing accessToken and refreshToken.
 */

const generateTokens =(userId)=>{
    // here we will create 2 diff tokens 
    const accessToken = jwt.sign({userId},process.env.ACCESS_TOKEN_SECRET,{
        expiresIn:"15m",

    })
    const refreshToken = jwt.sign({userId},process.env.REFRESH_TOKEN_SECRET,{
        expiresIn:"7d",

    })
    return {accessToken,refreshToken};
}

/**
 * @function storeRefreshToken
 * @description             Store the refresh token in Redis for a specific user.
 * @param {String} userId - The unique ID of the user.
 * @param {String} refreshToken - The refresh token to be stored.
 * @throws {Error}          Throws a 500 error if Redis storage fails.
 */

// now store on redis store 
const storeRefreshToken = async(userId,refreshToken)=>{
    await redis.set(`refresh_token:${userId}`,refreshToken ,"EX",7*24*60*60); // 7 days and  refreshToken is a key
    // also need the expiration time 

}

/**
 * @function setCookies
 * @description                  Set authentication cookies in the response.
 * @param {Object} res         - The Express response object.
 * @param {String} accessToken - The access token for authentication.
 * @param {String} refreshToken - The refresh token for authentication.
 */

// these all argument (res,accessToken,refreshToken) 
const setCookies=(res,accessToken,refreshToken) =>{

  res.cookie("accessToken",accessToken,{
    httpOnly:true,  // prevent xss(cross site Scripting) attack this cookies cannot be accessed by java script
    secure:process.env.Node_ENV === "production",
    sameSite :"strict", // prevents "CSRF"(cross site request forgery) attack for more information pls cheke below article
    maxAge:15*60*1000  // 15 min 
  }) // accessToken key name 

  res.cookie("refreshToken",refreshToken,{ // "refreshToken" = cookie ka name and refreshToken= Cookie ka value (Yeh generally ek JWT token hota hai jo authentication ke liye use hota hai).
    httpOnly:true,  
    secure:process.env.Node_ENV === "production",
    sameSite :"strict", 
    maxAge:7*24*60*60*1000  // 7 days  
  }) // refreshToken key name 

}

/**
 * @function signup
 * @description          Handles user registration and generates authentication tokens.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - Request body containing { name: String, email: String, password: String }
 * @param {Object} res - The Express response object.
 * @throws {Error}       Throws a 400 error if the email is already registered.
 * @throws {Error}       Throws a 500 error if user creation fails.
 */

export const signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role } = req.body || {};

    // ✅ Check for missing fields
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({
        status: false,
        msg: "Please fill all required details",
      });
    }
// extra data add feb 25
// const userRole = role && ["customer","admin"].includes(role) ? role : "customer";

    // ✅ Trim spaces to avoid unwanted issues
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // ✅ Check if passwords match
    if (trimmedPassword !== trimmedConfirmPassword) {
      return res.status(400).json({
        status: false,
        msg: "Passwords do not match",
      });
    }

    // ✅ Check if user already exists
    const existUser = await User.findOne({ email });
    if (existUser) {
      return res.status(400).json({
        status: false,
        msg: "This email is already registered",
      });
    }

    // ✅ Save user in database (Only Password, No confirmPassword)
    const user = await User.create({ name, email, password: trimmedPassword, role });

    // ✅ Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);

    // ✅ Set cookies
    setCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      status: true,
      msg: "User created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        // role: userRole,
        role: user.role,
        machineName: user.machineName,
      },
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({
      status: false,
      msg: "User creation request failed: " + error.message,
    });
  }
};



/**
 * @function getAllRoles
 * @description Fetches all roles from the database, with optional filtering based on query parameters.
 * @param {Object} req - The Express request object.
 * @param {Object} req.query - Query parameters for filtering roles (e.g., name, machineName).
 * @param {Object} res - The Express response object.
 * @returns {JSON} - Returns a JSON response with a list of roles or an error message.
 * @throws {Error} - Throws a 404 error if no roles are found, or a 500 error for unexpected issues.
 */

// get all roles (customer/admin) from the database
 export const getAllRoles = async (req, res) => {
      try {
        // Optional query-based filtering (e.g., by name or machineName)
        const { name, role } = req.query;
    
        const filter = {};

        if (name) filter.name = new RegExp(name, 'i'); // Case-insensitive search
        if (role) filter.role = new RegExp(role, 'i');
    
        // Fetch all roles or filtered roles
        const roles = await User.find(filter).sort({ createdAt: -1 }); // Sorted by newest first
    
        // Check if roles are not found
        if (!roles.length) {
          return res.status(404).json({
            status: false,
             message: 'No roles found.'
             });
        }
    // total count 
    const totalCount = roles.length;
    console.log("total count is ",totalCount);

        // Count roles based on unique role types
        const rolecounts =roles.reduce((acc,user)=>{
          acc[user.role] = (acc[user.role] || 0)+1;
          return acc;
        },{}); 

        return res.status(200).json({ 
          status:true,
          message: 'Roles retrieved successfully.',
          totalCount:totalCount,
          rolecounts:rolecounts,
           roles
         });

      } catch (error) {
        console.error('Error retrieving roles:', error);
    
        return res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
      }
    };

   // //Get the Roles By Id
    export const getRoleById = async (req, res) => {

      try {
        const { id } = req.params;
    
        // Validate the ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({
            status:false,
            error: 'Invalid ID format.'
           });
        }
    
        // Find the role by ID
        // const role = await User.findById(id);
        // Find role by ID and exclude deleted ones
         const role = await User.findOne({ _id: id, isDeleted: { $ne: true } });

        // Check if the role is not found
        if (!role) {
          return res.status(404).json({ 
            error: 'Role not found or deleted'
           });
        }
    console.log("role is ",role);

        return res.status(200).json({
          status:true,
           message: 'Role retrieved successfully.',
            role 
          });
      } catch (error) {
        console.error('Error retrieving role:', error);
    
        // Specific error response for invalid ObjectId
        if (error.kind === 'ObjectId') {
          return res.status(400).json({ 
            status:false,
            error: 'Invalid ID format.'
           });
        }
    
        return res.status(500).json({
          status:false,
           error: 'An unexpected error occurred. Please try again later.' 
          });
      }
    };
    
 //Soft Delete the role by Id
    export const deleteRoleById = async (req, res) => {
      try {
        const { id } = req.params;
    
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({
            status:false,
             error: 'Invalid ID format.' 
            });
        }
    
        // Find the role by ID
        const role = await User.findById(id);
        if (!role) {
          return res.status(404).json({
            status:false,
             error: 'Role not found.' 
            });
        }
       console.log("delete role is ",role);  

        // Check if the role is already deleted
        if (role.isDeleted) {
          return res.status(400).json({ 
            status:false,
            error: 'Role is already deleted.' 
          });
        }
    
        // Soft delete the role 1 st way and 
        role.isDeleted = true;
        role.role = null; // Set role field to null
        await role.save();

          // Soft delete the role 2nd way
    // await User.findByIdAndUpdate(id, { isDeleted: true });
    
        return res.status(200).json({ 
          status:true,
          message: 'Role deleted successfully'
         });

      } catch (error) {
        console.error('Error deleting role:', error);

        return res.status(500).json({
          status:false,
           error: 'An unexpected error occurred. Please try again later.' 
          });
      }
    };
    
     // //Update the Role By Id save in notes folder
     export const updateRole = async (req, res) => {

      try {
        const { id } = req.params;
        const { role } = req.body;
    
        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
          return res.status(400).json({
            status: false,
            error: "Invalid ID format.",
          });
        }

        // eisa issue aata h to
        // "error": "Parameter \"filter\" to findOneAndUpdate() must be an object, got \"67b6f54b615ac019e20eaa68\" (type string)"
        // solution : ({ _id: id }, { role }, { new: true })
    
        // Find the role by ID and check if it's deleted

        const existingUser = await User.findOneAndUpdate({ _id: id }, { role }, { new: true });
    
        if (!existingUser) {
          return res.status(404).json({
            status: false,
            error: "User not found or has been deleted.",
          });
        }
    
        // Validate and update role only
        if (role && ["customer", "admin"].includes(role)) {
          existingUser.role = role;
        } else {
          return res.status(400).json({
            status: false,
            error: "Invalid role value. Allowed values: 'customer' or 'admin'.",
          });
        }
    
        // Save the updated user role
        existingUser.isDeleted = false;
        await existingUser.save();
    
        return res.status(200).json({
          status: true,
          message: "User role updated successfully.",
          user: existingUser,
        });
      } catch (error) {
        console.error("Error updating user role:", error);
    
        return res.status(500).json({
          status: false,
          error: "An unexpected error occurred. Please try again later.",error:error.message,
        });
      }
    };
    
    
/**
 * @function logout
 * @description          Logs out a specific user by deleting their refresh token.
 * @param {Object} req - The Express request object.
 * @param {Object} req.cookies - Request cookies containing refreshToken.
 * @param {Object} res - The Express response object.
 * @throws {Error}       Throws a 400 error if refresh token is missing.
 * @throws {Error}       Throws a 500 error if logout process fails.
 */

// export const logout =async(req,res)=>{

//   try {

//     const refreshToken = req.cookies.refreshToken;

//     if (!refreshToken) {
//       return res.status(400).json({
//         status: false,
//         msg: "Refresh token not found",
//       });
//     }

//     if(refreshToken){
//       const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET)
//       await redis.del(`refresh_token:${decoded.userId}`)
//     }
//      res.clearCookie("accessToken");
//      res.clearCookie("refreshToken");
     
//      res.status(201).json({
//       status:true,
//       msg:"logout successfully"
//      })

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       status:false,
//       msg:"server error : " + error.message
//      })
//   }
// }

// Specific User Refresh Token Delete
export const logout1 = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken; // ✅ Get refresh token from cookie

    if (!refreshToken) {
      return res.status(400).json({
        status: false,
        msg: "Refresh token not found",
      });
    }

    // ✅ Decode Refresh Token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const userId = decoded.userId; // ✅ Get User ID from Token

    if (!userId) {
      return res.status(400).json({
        status: false,
        msg: "Invalid token",
      });
    }

    // ✅ Delete Only This User's Refresh Token From Redis
    const redisKey = `refresh_token:${userId}`;
    const redisToken = await redis.get(redisKey); // ✅ Check if token exists in Redis

    if (redisToken) {
      await redis.del(redisKey); // ✅ Delete the refresh token from Redis
    }

    // ✅ Clear Cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    res.status(200).json({
      status: true,
      msg: "Logout successful",
    });

  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      status: false,
      msg: "Server error: " + error.message,
    });
  }
};

/**
 * @function login
 * @description          Handles user authentication and token generation.
 * @param {Object} req - The Express request object.
 * @param {Object} req.body - Request body containing { email: String, password: String }
 * @param {Object} res - The Express response object.
 * @throws {Error}       Throws a 400 error if email or password is missing.
 * @throws {Error}       Throws a 404 error if the user is not found or password is incorrect.
 * @throws {Error}       Throws a 500 error if there is a server error.
 */

export const login = async(req,res)=>{

  const {email,password}=req.body;

  if(!email || !password){
    res.status(404).json({
      status:false,
      msg:"both fields are required pls fill both of them"
    })
  }

  try {
    const user = await User.findOne({email});
    if(!user){
      res.status(404).json({
        status:false,
        msg:"this email is not existed pls come with exist email "
      })
    }
 
     if(user && (await user.comparePassword(password)))  {
     const{accessToken,refreshToken} = generateTokens(user._id)

     await storeRefreshToken(user._id,refreshToken)
     setCookies(res,accessToken,refreshToken)

     res.status(200).json({
      status:true,
      msg:"login successfully",
      user:{
        _id:user._id,
        name:user.name,
        email:user.email,
        role:user.role
      },
      accessToken:accessToken,
      refreshToken:refreshToken
    })

     }
     else{
      res.status(404).json({
        status:false,
        msg:"invalid email and password "
      })
     }

  } catch (error) {
    console.log("error is ",error);
    console.log("error is ",error.message);

    res.status(500).json({
      status:false,
      msg:"server error "+ error.message
    })
  }
}

/**
 * @function refreshToken
 * @description          Generates a new access token using a valid refresh token.
 * @param {Object} req - The Express request object.
 * @param {Object} req.cookies - Request cookies containing refreshToken.
 * @param {Object} res - The Express response object.
 * @throws {Error}       Throws a 401 error if refresh token is missing or invalid.
 * @throws {Error}       Throws a 500 error if token refresh fails.
 */

// this will replace (recreate ) access token 
export const refreshToken = async(req,res)=>{
  // we need to get the refresh token that user send use beacuse they provide us refresh token

try {

  const refreshToken = req.cookies.refreshToken;

  if(!refreshToken){
    return res.status(401).json({
      status:false,
      msg:"no refreshtoken provided"
    })
  }

  const decoded = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);

// decoded → Agar token valid hai toh yeh user ki information return karega (ex: { userId: "abc123", iat: 1234567890, exp: 1234569999 }).

  const storedToken = await redis.get (`refresh_token:${decoded.userId}`);

  // decoded.userId → Token se user ID nikal rahe hain, jisse hum uska stored token check kar sakein.

  if(storedToken !== refreshToken){
    return res.status(401).json({message:"Invalid refresh token"});
  }

 // generate new access token
const accessToken=jwt.sign({userId:decoded.userId},process.env.ACCESS_TOKEN_SECRET,{expiresIn:"15m"});

// we can set it into cookies

res.cookie("accessToken",accessToken,{

  httpOnly:true,
  secure:process.env.Node_ENV === "production",
  sameSite:"strict",
  maxAge:15*60*60

})

res.json({
  status:true,
  msg:"Token refreshed successfully",
  accessToken:accessToken
})

} catch (error) {
  
  console.log("error in refreshtokencontroller",error.message);

  res.status(500).json({
    status: false,
    msg: "server error  " + error.message,
  });

}
}
// get profile by get by id 
// export const getProfile = async (req, res) => {
  
//   const { userId } = req.body;
//   // const { userId } = req.user?.body;  // Token se userId milega

//   if (!userId) {
//     return res.status(400).json({
//       status: false,
//       msg: "Please provide user ID for profile.",
//     });
//   }

//   try {

//     const user = await User.findById(userId); // ✅ Fixed findById query

//     if (!user) {
//       return res.status(404).json({
//         status: false,
//         msg: "User not found.",
//       });
//     }

//     console.log("User data:", user);
//     const{accessToken,refreshToken }= generateTokens(user._id)

//     res.status(200).json({
//       status: true,
//       msg: "User profile fetched successfully.",
//       UserData: {
//         _id:user._id,
//         name:user.name,
//         email:user.email,
//         role:user.role
        
//       },
//       accessToken:accessToken,
//       refreshToken:refreshToken
//     });

//   } catch (error) {

//     console.error("Error in fetching profile:", error.message);
//     res.status(500).json({
//       status: false, // ✅ Fixed the incorrect status flag
//       msg: "Error in fetching profile: " + error.message,
//     });

//   }
// };

// new code feb 21 
// this is a good way because get profile jab hi hogi jab token valid hogi and user authenticate hogi to profile ka data aa jayega 
export const getProfile = async (req, res) => {
  try {
    res.json({
      status: true,
      msg: "User profile fetched successfully.",
      UserData: {
        _id:req.user._id,
        name:req.user.name,
        email:req.user.email,
        role:req.user.role
      } 
    })
  } catch (error) {
    
  }
}


// CSRF (Cross-Site Request Forgery) Attack Kya Hota Hai?
// CSRF ek web security vulnerability hai jo authenticated users ko target karta hai. 
// Isme attacker ek user ke behalf par bina uski permission ke requests send kar deta hai, 
// jisse unauthorized actions perform ho sakti hain.

// XSS (Cross-Site Scripting) Attack Kya Hota Hai?
// XSS (Cross-Site Scripting) ek web security vulnerability hai jisme attacker kisi website par malicious JavaScript inject karta hai.
//  Jab koi user is compromised page ko access karta hai, 
//  toh uske browser me ye script execute ho jati hai aur sensitive information chura sakti hai, 
//  session hijack kar sakti hai, ya phishing attacks perform kar sakti hai.

// development = http 
// production  = https


// router.post("/reset-password", async (req, res) => {
  export const resetpassword = async (req, res) => {

  try {

      const { email, newPassword, token } = req.body;

      if(!email || !newPassword || !token ){
        return res.status(404).json({
          status:false,
          msg: "please enter all fields data" 
        });
      }

      const user = await User.findOne({ email });

      if (!user) return res.status(404).json({
        status:false,
        msg: "User not found" 
      });

      const isValidToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if (!isValidToken) 
        return res.status(400).json({
        status:false,
         msg: "Invalid or expired token"
         });

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      user.password = hashedPassword;

      await user.save();

      res.json({
        status:true,
         msg: "Password reset successful"
         });

  } catch (error) {
      res.status(500).json({ 
        status:false,
        msg:"error in" +  error.message });
  }
};

/**
* @route POST /auth/verify-email
* @desc Verify user email after signup
* @access Public
*/
// router.post("/verify-email", async (req, res) => {
  export const verifyemail = async (req, res) => {

  try {
      const { token } = req.body;

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await User.findById(decoded.userId);

      if (!user) return res.status(404).json({
        status:false,
        msg: "User not found" 
      });

      user.isVerified = true;

      await user.save();

      res.json({ 
        status:false,
        msg: user.email + " Email verified successfully",
        userData:{
          email:user.email
        } 
      });
  } catch (error) {
      res.status(500).json({
        status:false,
         msg:"error in  "+ error.message
         });
  }
};

/**
* @route POST /auth/social-login
* @desc Social login using Google or Facebook
* @access Public
*/
// router.post("/social-login", async (req, res) => {
export const sociallogin = async(req, res) => {

  try {
      const { provider, token } = req.body;

      let userData;

      if (provider === "google") {
          userData = await googleAuth(token);
      } else if (provider === "facebook") {
          userData = await facebookAuth(token);
      } else {
          return res.status(400).json({
            status:false,
             msg: "Invalid provider" 
            });
      }
      
      let user = await User.findOne({ email: userData.email });

      if (!user) {
          user = new User({
              name: userData.name,
              email: userData.email,
              isVerified: true,
          });
          await user.save();
      }

      const accessToken = jwt.sign(
        { userId: user._id },
         process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "1h" });

      res.json({ 
        accessToken: accessToken 
      });

  } catch (error) {
      res.status(500).json({
        status:false,
        msg: error.message 
      });
  }
};


/**
* @route PATCH /auth/change-password
* @desc Change password (logged-in user)
* @access Private
*/
// router.patch("/change-password", authenticateUser, async (req, res) => {
  export const changepassword = async (req, res) => {

  try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ msg: "User not found" });

      const isMatch = await bcrypt.compare(oldPassword, user.password);

      if (!isMatch) return res.status(400).json({ 
        status:false, 
        msg: "Incorrect old password" 
      });

      user.password = await bcrypt.hash(newPassword, 10);

      await user.save();
      res.json({ 
        status:true,
        msg: "Password changed successfully" 
      });
  } catch (error) {
      res.status(500).json({ 
        status:false,
        msg: error.message
       });
  }
};

// More APIs for MFA, Account Management, and Admin functionalities will be added...


/**
 * @route   POST /api/auth/mfa-enable
 * @desc    Enable Multi-Factor Authentication for a user
 * @access  Private (Logged-in users)
 */
export const enableMFA = async (req, res) => {

  try {
      const user = await User.findById(req.user._id);

      if (!user) return res.status(404).json({
         status: false,
          msg: "User not found" 
        });

      const secret = speakeasy.generateSecret({ length: 20 });

      user.mfaSecret = secret.base32;

      await user.save();

      res.status(200).json({
          status: true,
          msg: "MFA enabled successfully",
          secret: secret.otpauth_url,
      });
  } catch (error) {
      res.status(500).json({ 
        status: false,
         msg: "Server error: " + error.message 
        });
  }
};

/**
 * @route   POST /api/auth/mfa-verify
 * @desc    Verify MFA token
 * @access  Private (Logged-in users)
 */
export const verifyMFA = async (req, res) => {
    try {
        const { token } = req.body;

        const user = await User.findById(req.user._id);

        if (!user || !user.mfaSecret) return res.status(400).json({
           status: false, 
           msg: "MFA not set up" 
          });

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: "base32",
            token,
        });

        if (!verified) return res.status(401).json({
           status: false, 
           msg: "Invalid MFA token" 
          });

        res.status(200).json({ 
          status: true, 
          msg: "MFA verified successfully"
         });
    } catch (error) {
        res.status(500).json({ 
          status: false,
           msg: "Server error: " + error.message 
          });
    }
};

/**
 * @route   PUT /api/auth/deactivate
 * @desc    Deactivate user account
 * @access  Private
 */
export const deactivateAccount = async (req, res) => {

    try {
        const user = await User.findByIdAndUpdate(req.user._id, { isActive: false }, { new: true });

        console.log("user is ",user);

        res.status(200).json({
           status: true,
            msg: "Account deactivated successfully" 
          });

    } catch (error) {
        res.status(500).json({ 
          status: false, 
          msg: "Server error: " + error.message
         });
    }
};

/**
 * @route   PUT /api/auth/reactivate
 * @desc    Reactivate user account
 * @access  Private
 */
export const reactivateAccount = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.user._id, { isActive: true }, { new: true });

        res.status(200).json({
           status: true, 
           msg: "Account reactivated successfully" 
          });

    } catch (error) {
        res.status(500).json({
           status: false,
            msg: "Server error: " + error.message 
          });
    }
};

/**
 * @route   DELETE /api/auth/delete
 * @desc    Permanently delete a user account
 * @access  Private
 */
export const deleteAccount = async (req, res) => {
    try {

        await User.findByIdAndDelete(req.user._id);

        res.status(200).json({ 
          status: true,
           msg: "Account deleted successfully" 
          });
    } catch (error) {
        res.status(500).json({
           status: false,
           msg: "Server error: " + error.message
           });
    }
};

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (Admin only)
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {

  try {

      if (!req.user.isAdmin) {
          return res.status(403).json({
             status: false,
             msg: "Access denied. Admins only." 
            });
      }

      const users = await User.find();

      res.status(200).json({ 
        status: true, 
        users
       });

  } catch (error) {
      res.status(500).json({
         status: false, 
        msg: "Server error: " + error.message
       });
  }
};

/**
 * @route   PUT /api/auth/block/:id
 * @desc    Block a user (Admin only)
 * @access  Private (Admin)
 */
export const blockUser = async (req, res) => {

    try {
        await User.findByIdAndUpdate(req.params.id, { isBlocked: true });
        res.status(200).json({ 
          status: true,
           msg: "User blocked successfully"
           });

    } catch (error) {
        res.status(500).json({ 
          status: false,
           msg: "Server error: " + error.message 
          });
    }
};

/**
 * @route   PUT /api/auth/unblock/:id
 * @desc    Unblock a user (Admin only)
 * @access  Private (Admin)
 */
export const unblockUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, { isBlocked: false });

        res.status(200).json({ 
          status: true,
           msg: "User unblocked successfully"
           });

    } catch (error) {
        res.status(500).json({
           status: false,
            msg: "Server error: " + error.message 
          });
    }
};


