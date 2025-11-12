import jwt from "jsonwebtoken";

export function generateToken(userId, res, req = null) {
	const userIdString = String(userId);
	
	if (req && req.cookies && req.cookies.jwt) {
		try {
			const existingToken = req.cookies.jwt;
			const decoded = jwt.verify(existingToken, process.env.JWT_SECRET);
			if (decoded && String(decoded.userId) === userIdString) {
				return existingToken;
			}
		} catch (error) {
		}
	}
	
	const token = jwt.sign({ userId: userIdString }, process.env.JWT_SECRET, {
		expiresIn: "7d",
	});

	res.cookie("jwt", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000,
		path: "/",
	});

	return token;
}


