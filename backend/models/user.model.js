import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import os from "os"; // 👈 OS module import
// import Product from "./product.model.js";
// import Address from "./address.model.js";

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:[true,"Name is required"] // another one for  false 
    },

    email:{
        type:String,
        required:[true,"email is required"] ,
        unique:true,
        
        lowercase:true,
        trim:true
    },

    password:{
        type:String,
        required:[true,"password is required"] ,
        minlength:[6,"password must be 6 characters"]
    },
    
    machineName: {
        type: String,
        default: os.hostname() // 👈 Default Machine Name
    },

    // cards array of items
    cardItems:[

        {
              quantity:{
                type:Number,
                default:1
              },

              product:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"Product"
              }
        }

    ],
    useraddress: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address" // 👈 Reference to Address Model
        }
    ],
   
    role:{
        type:String,
        enum:["customer","admin"],
        // default:"customer"
    },

    isDeleted: { 
        type: Boolean,
         default: false
         } // Default set to false

},

    {
        timestamps:true,
    }

) 

// **Virtual Field for Confirm Password (Not stored in DB)**
// userSchema.virtual("confirmPassword")
// .set(function(value){
//     this._confirmPassword=value;
// })
// .get(function(){
//     return this._confirmPassword;
// });

// // **Pre-save hook to check confirmPassword**
// userSchema.pre("save",function(next){
//     if(this.isModified("password") && this.password !== this._confirmPassword){
//         return next(new Error("Password do not match"))
//     }
//     next();
// })

// **Pre-save hook to dynamically update machine name**
userSchema.pre("save", function (next) {
    if (!this.machineName) {
        this.machineName = os.hostname();
    }
    next();
});

// functions for hashing passwords 
// pre save hook to hash passwords before saving to database

userSchema.pre("save",async function (next){
if(!this.isModified('password')) return next();

try {

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password,salt);
    next();

} catch (error) {
    next(error );//Ye error ko Express middleware tak propagate karta hai taaki proper error handling ho sake.

}
})
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password,this.password);
}
const User = mongoose.model("User",userSchema);


export default User; 

// confirmPassword field ko schema mein add karna best practice nahi hota, 
// kyunki database mein password ko confirm karne ka koi logic nahi hota.
//  Ye sirf client-side validation ke liye hota hai.

// Lekin agar aap chahte hain ki confirmPassword ko bhi schema mein include karein sirf validation ke liye,
//  to hum usse virtual field ke roop mein use kar sakte hain. Virtual fields MongoDB mein store nahi hote, 
//  par aap model mein unka use kar sakte hain.

//Mongoose pluralize karne ke liye inflection library use karta hai jo English rules ko follow karta hai:

// Step 2: Mongoose ka Naming Convention
// Mongoose ke andar ek naming strategy hoti hai:

// Pehle model name ka lowercase version banata hai.
// Fir uska plural form generate karta hai.
// Us plural name ko MongoDB collection name ke roop me use karta hai.
// Model Name	Mongoose ka Collection Name
// "User"	"users"
// "Product"	"products"
// "Order"	"orders"

// Step 4: Agar Aapko Custom Collection Name Chahiye?
// Agar aap chahte ho ki collection ka naam same ho jo aap dete ho, toh third argument pass kar sakte ho:

// javascript
// Copy
// Edit
// const User = mongoose.model("User", userSchema, "User");
// 👉 Ab collection ka naam "User" hi rahega, "users" nahi banega.

