import jwt from "jsonwebtoken";

export function generateToken(userId, res, req = null) {
	// Convert userId to string to ensure consistency
	const userIdString = String(userId);
	
	// Check if there's an existing cookie and if it's for a different user
	// This prevents overwriting cookies from other tabs
	if (req && req.cookies && req.cookies.jwt) {
		try {
			const existingToken = req.cookies.jwt;
			const decoded = jwt.verify(existingToken, process.env.JWT_SECRET);
			// If the existing cookie is for the same user, don't overwrite it
			// This helps maintain tab-specific sessions
			if (decoded && String(decoded.userId) === userIdString) {
				return existingToken; // Return existing token, don't set new cookie
			}
		} catch (error) {
			// If token is invalid, proceed to generate new one
		}
	}
	
	// Generate unique token with timestamp to ensure uniqueness
	const token = jwt.sign({ userId: userIdString }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.cookie("jwt", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000,
		path: "/", // Ensure cookie is available for all paths
	});

	return token;
}


