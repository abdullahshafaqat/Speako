export const config = {
	nodeEnv: process.env.NODE_ENV || "development",
	port: process.env.PORT || 5000,
	mongoUri: process.env.MONGODB_URI,
	jwtSecret: process.env.JWT_SECRET,
};


