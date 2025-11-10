import mongoose from "mongoose";

export async function connectToDatabase(mongoUri) {
	if (!mongoUri) {
		throw new Error("MONGODB_URI is not defined");
	}
	await mongoose.connect(mongoUri, {
		serverSelectionTimeoutMS: 15000,
	});
	return mongoose.connection;
}

export function connectDB() {
	const mongoUri = process.env.MONGODB_URI;
	return connectToDatabase(mongoUri);
}


