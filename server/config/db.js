import mongoose from 'mongoose';
const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGODB_URI)
        console.log("MongoDB connect successfully")
        
    }

    catch(error){
        console.log("MongoDB connection Faile", error.message)
    }
}

export default connectDB