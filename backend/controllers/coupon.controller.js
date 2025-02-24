import Coupon from "../models/coupon.model.js"

/**
 * @function getCoupon
 * @description Fetches a coupon for the authenticated user by ID if it exists and is active.
 * @param {Object} req - The Express request object containing the user ID in the request body.
 * @param {Object} res - The response object used to send the HTTP response.
 * @returns {Object} - The response object with the coupon details if it exists.
 * @throws {Error} - Returns a 500 error if there is a server error during the operation.
 */
export const getCoupon = async(req,res)=>{

    // First, we try to find a coupon in the Coupon collection that matches the
    // user ID from the request body. We only want to fetch active coupons, so
    // we also specify that the isActive field must be true.

    try {
        
        // userId: req.user._id: It looks for a coupon whose userId matches the _id of the currently logged-in user (from req.user._id).
        // Example Scenario:
        // Suppose req.user._id is "5f8c74e1d4f5b63e0427c342".
        // The database has a Coupon document with userId: "5f8c74e1d4f5b63e0427c342" and isActive: true.
        // The query will fetch that coupon and assign it to coupon.
        
        const coupon = await Coupon.findOne({userId:req.user._id,isActive:true});

        res.status(200).json({
            status:true,
            msg:"Coupon details fetched successfully",
            coupon:coupon || null
        })
    } catch (error) {
    
        res.status(500).json({
            status:false,
            msg:"failed to fetched coupon",error:error.message
        })
    }
}


/**
 * @function validateCoupon
 * @description Validates a coupon code for the authenticated user.
 * @param {Object} req - The Express request object containing the coupon code in the request body.
 * @param {Object} res - The response object used to send the HTTP response.
 * @returns {Object} - The response object with the coupon details if the coupon is valid, otherwise, throws a 404 error.
 * @throws {Error} - Returns a 500 error if there is a server error during the operation.
 */
export const validateCoupon = async (req, res) => {
    try {
        // Extract the coupon code from the request body
        const { code } = req.body;

        // Attempt to find a coupon that matches the given code, belongs to the authenticated user, and is active
        const coupon = await Coupon.findOne({ code: code, userId: req.user._id, isActive: true });

        // If no coupon is found, return a 404 error indicating that the coupon was not found
        if (!coupon) {
            return res.status(404).json({
                status: false,
                msg: "coupon not found"
            });
        }

        // Check if the coupon has expired by comparing the expiration date with the current date
        if (coupon.expirationDate < new Date()) {
            // If the coupon is expired, set its isActive status to false
            coupon.isActive = false;

            // Save the updated coupon status to the database
            await coupon.save();

            // Return a 400 error indicating that the coupon has expired
            return res.status(400).json({
                status: false,
                msg: "coupon expired"
            });
        }

        // If the coupon is valid and not expired, return a success response with coupon details
        res.status(200).json({
            status: true,
            msg: "Coupon is valid",
            coupon: coupon,
            code: coupon.code,
            discountPercentage: coupon.discountPercentage
        });

    } catch (error) {
        // Log the error message for debugging purposes
        console.error("error is ", error.message);

        // Return a 500 error indicating that there was a server error during coupon validation
        res.status(500).json({
            status: false,
            msg: "failed to validate coupon",
            error: error.message
        });
    }
}
