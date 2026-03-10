import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        // MongoDB Connection
        // eslint-disable-next-line no-undef
        const connect = await mongoose.connect(process.env.MONGODB_URL , {
        });

        console.log("Database Connected", connect.connection.host, connect.connection.name)
    } catch (error) {
        console.log(error)
        // eslint-disable-next-line no-undef
        process.exit(1)
    }
}