import mongoose from "mongoose";

export const connectDB = async () => {
    try{
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: process.env.DB_NAME || "database"
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }catch(error){
        console.error('Error connecting to MongoDB:', error);
    }
}