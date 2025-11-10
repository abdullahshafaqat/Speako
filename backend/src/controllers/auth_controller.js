import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/utils.js";
import cloudinary from "../utils/cloudinary.js";

export async function signup(req, res) {
	try {
		const { fullName, email, password } = req.body;
		if (!fullName || !email || !password) {
			return res.status(400).json({ message: "All fields are required" });
		}

		if (password.length < 6) {
			return res
				.status(400)
				.json({ message: "Password must be at least 6 characters" });
		}
		const existing = await User.findOne({ email });
		if (existing) {
			return res.status(400).json({ message: "Email already exists" });
		}

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({ fullName, email, password: hashedPassword });
		if (newUser) {
			generateToken(newUser._id, res, req);
			await newUser.save();
			return res.status(201).json({
				_id: newUser._id,
				fullName: newUser.fullName,
				email: newUser.email,
				profilePic: newUser.profilePic,
			});
		} else {
			return res.status(400).json({ message: "Invalid user data" });
		}
	} catch (err) {
		console.log("Error in signup controller", err.message);
		return res.status(500).json({ message: "Internal Server Error" });
	}
}

export async function login(req, res) {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: "Email and password are required" });
		}
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}
		const isPasswordCorrect = await bcrypt.compare(password, user.password);
		if (!isPasswordCorrect) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		generateToken(user._id, res, req);

		return res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			email: user.email,
			profilePic: user.profilePic,
		});
	} catch (err) {
		console.log("Error in login controller", err.message);
		return res.status(500).json({ message: "Internal Server Error" });
	}
}

export async function logout(_req, res) {
	try {
		res.cookie("jwt", "", { 
			maxAge: 0,
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			path: "/",
		});
		return res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		return res.status(500).json({ message: "Internal Server Error" });
	}
}

export async function updateProfile(req, res) {
	try {
		const { profilePic } = req.body;
		const userId = req.user?._id;

		if (!profilePic) {
			return res.status(400).json({ message: "Profile pic is required" });
		}

		const uploadResponse = await cloudinary.uploader.upload(profilePic);
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ profilePic: uploadResponse.secure_url },
			{ new: true }
		);

		return res.status(200).json(updatedUser);
	} catch (error) {
		console.log("error in update profile:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function checkAuth(req, res) {
	try {
		return res.status(200).json({ user: req.user });
	} catch (error) {
		console.log("error in check auth:", error.message);
		return res.status(500).json({ message: "Internal server error" });
	}
}
