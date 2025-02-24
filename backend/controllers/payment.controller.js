import { stripe } from "../lib/stripe.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";

/**
 * @function createCheckoutSession
 * @description Creates a Stripe checkout session for the provided products and applies a coupon if available.
 * @param {Object} req - The Express request object containing the products and an optional coupon code in the request body.
 * @param {Object} res - The Express response object used to send the HTTP response.
 * @returns {Object} - The response object with the Stripe session ID and total amount to be charged.
 * @throws {Error} - Returns a 400 error if the products array is invalid, or a 500 error if the Stripe session creation fails.
 */

export const createCheckoutSession = async (req, res) => {
    try {
        // Step 1: Extract products and coupon code from request body
        const { products, couponCode } = req.body;

        // Step 2: Validate products array
        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                status: false,
                msg: "Invalid products or empty product array",
            });
        }

        let totalAmount = 0;

        // Step 3: Create line items for Stripe checkout session
        const lineItems = products.map((product) => {
            const amount = Math.round(product.price * 100); // Convert to cents
            totalAmount += amount * product.quantity;

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        images: [product.image],
                    },
                    unit_amount: amount,
                },
                quantity: product.quantity,
            };
        });

        let coupon = null;

        // Step 4: Validate and apply coupon if provided
        if (couponCode) {
            coupon = await Coupon.findOne({
                code: couponCode,
                userId: req.user._id,
                isActive: true,
            });

            if (coupon) {
                totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
            }
        }

        // Step 5: Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "paypal"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            discounts: coupon
                ? [
                      {
                          coupon: await createStripeCoupon(coupon.discountPercentage),
                      },
                  ]
                : [],
            metadata: {
                userId: req.user._id.toString(),
                couponCode: couponCode || null,
                // add products data 
                  products:JSON.stringify(
                    products.map((p)=>({
                        id:p._id,
                        quantity:p.quantity,
                        price:p.price
                    }))
                  )
            },
        });

        // Step 6: If totalAmount > $200, create a new discount coupon for the user
        if (totalAmount > 20000) {
            await createNewCoupon(req.user._id);
        }

        // Step 7: Return session ID and total amount in response
        res.status(200).json({
            status: true,
            sessionId: session.id,
            totalAmount: totalAmount / 100, // Convert cents back to dollars
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            msg: "Internal server error",
            error: error.message,
        });
    }

    
};
/**
 * @function checkoutSuccess
 * @description Processes a successful checkout session by verifying payment status, 
 * deactivating the coupon if used, and creating a new order with the provided session details.
 * @param {Object} req - The Express request object containing the session ID in the request body.
 * @param {Object} res - The Express response object used to send the HTTP response.
 * @returns {Object} - The response object with the order ID if the payment is successful, otherwise an error message.
 * @throws {Error} - Returns a 500 error if there is a server error during the operation.
 */

export const checkoutSuccess = async (req, res) => {
    try {
        const {sessionId}=req.body;
        // get from the stripe
        const session = await Stripe.checkout.sessions.retrieve(sessionId);
         
        // check pay was successfully or not 
        if(session.payment_status === 'paid'){
    
            // coupon code ko inactive karenge 
            if(session.metadata.couponCode){
                await Coupon.findOneAndUpdate({
                    code:session.metadata.couponCode, userId:session.metadata.userId
                },{
                    isActive:false
                })
            }
    
            // create a new order if pay is paid and take from the orders to meta data 
    
            const products = JSON.parse(session.metadata.products); // converting into js object USING parse method
            const newOrder = new Order({
                user:session.metadata.userId,
    
                // same with product model fields
    
                products:products.map(product =>({
                    productId:product.id,
                    quantity:product.quantity,
                    price:product.price
                })),
                totalAmount:session.amount_total/100 ,  // converts from cents to dollars
                stripeSessionId:sessionId
            })
            await newOrder.save();
            res.status(200).json({
                status:true,
                msg:"payment successful,Order created successfully, and coupon deactivated if used",
                orderId:newOrder._id
            })
        }
    } catch (error) {
        console.log("server error",error.message);
        res.status(500).json({
            status:false,
            msg:"Internal server error",error:error.message
        })
    }
    }
// Function to create a one-time Stripe coupon
async function createStripeCoupon(discountPercentage) {
    const coupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once",
    });
    return coupon.id;
}

// Function to create a new discount coupon for the user
async function createNewCoupon(userId) {
    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // Valid for 30 days
        userId: userId,
    });

    await newCoupon.save();
    return newCoupon;
}



