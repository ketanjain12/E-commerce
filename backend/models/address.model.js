// import mongoose from "mongoose";

// const addressSchema = new mongoose.Schema({
//     user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     street: { type: String, required: true },
//     address2: { type: String },
//     landmark: { type: String },
//     city: { type: String, required: true },
//     state: { type: String, required: true },
//     country: { type: String, required: true },
//     postalCode: { type: String, required: true },
//     latitude: { type: Number },
//     longitude: { type: Number }
// }, { timestamps: true });

// const Address = mongoose.model("Address", addressSchema);
// export default Address;

// new model
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    street: { type: String, required: true, trim: true },
    address2: { type: String, trim: true, default: "" }, // Optional
    landmark: { type: String, trim: true, default: "" }, // Optional
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    postalCode: { 
        type: String, 
        required: true, 
        match: [/^\d{5,6}$/, "Invalid postal code"] // 5 or 6 digit ZIP/Pin code
    },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    // Contact Numbers
    phoneNumber: { 
        type: String, 
        required: true, 
        match: [/^\d{10}$/, "Invalid phone number"], // Ensures exactly 10 digits
        trim: true 
    },
    alternatePhone: { 
        type: String, 
        match: [/^\d{10}$/, "Invalid phone number"], // Optional but should be 10 digits
        trim: true,
        default: "" 
    },

    // Address Details
    addressType: {
        type: String,
        enum: ["home", "work", "other"],
        default: "home"
    },
    isDefault: { type: Boolean, default: false },
    deliveryInstructions: { 
        type: String, 
        maxlength: 500, 
        trim: true, 
        default: ""  
    },

    // Verification Fields
    isVerified: { type: Boolean, default: false },
    verificationSource: { 
        type: String, 
        enum: ["user", "admin", "system"], 
        required: function() { return this.isVerified; } // Required only if address is verified
    },

    // Building Details
    buildingName: { type: String, trim: true, default: "" },
    apartmentNumber: { type: String, trim: true, default: "" },
    floor: { type: Number, default: null },
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", addressSchema);
export default Address;

