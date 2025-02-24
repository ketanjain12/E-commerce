import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export const dbconnect = async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`connection done: ${conn.connection.host} `)
    } catch (error) {
        console.log("error in moongoose connection ",error.message);
        process.exit(1)   // here 1 = failure and 0= success
    }
}