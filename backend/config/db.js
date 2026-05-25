import mongoose from "mongoose";
import dotenv from "dotenv"

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
  } catch {
    process.exit(1);
  }
}

export default connectDB;