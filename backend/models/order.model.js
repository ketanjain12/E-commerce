import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        required:true,
      },

      products: [
        {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref:"Product",
          },
          quantity: {
            type: Number,
            required:true,
            min: 1,
          },
          price:{
            type: Number,
            required:true,
            min: 0,
          }
        },
      ],
      
      totalAmount: {
         type: Number,
         required: true,
          min: 0
         },

    //   address: { type: Object, required: true },        
    //   status: { type: String, default: "pending" },
    
    stripeSessionId:{
        type: String,
        required: true
    },

},

{
  timestamps:true
}
);
const Order = mongoose.model("Order",orderSchema);
export default Order;