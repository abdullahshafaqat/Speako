import User from "../models/User.js";
import Message from "../models/message.js";
import cloudinary from "../utils/cloudinary.js";
import { getReceiverSocketId, io } from "../utils/socket.js";

export async function getAllUsers(req, res) {
  try {
    const loggedInUser = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUser },
    }).select("-password");
    return res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllUsers ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getChats(req, res) {
  try {
    const { id: userChatId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userChatId },
        { senderId: userChatId, receiverId: senderId },
      ],
    });

    const messagesWithStringIds = messages.map((msg) => ({
      ...msg.toObject(),
      senderId: msg.senderId.toString(),
      receiverId: msg.receiverId.toString(),
      _id: msg._id.toString(),
    }));

    return res.status(200).json(messagesWithStringIds);
  } catch (error) {
    console.log("Error in getChats ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendMessage(req, res) {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;

    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image, {
        resource_type: "auto",
        chunk_size: 6000000,
        timeout: 120000,
      });

      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const messageToEmit = {
      ...newMessage.toObject(),
      senderId: newMessage.senderId.toString(),
      receiverId: newMessage.receiverId.toString(),
      _id: newMessage._id.toString(),
    };

    const receiverSocketId = getReceiverSocketId(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageToEmit);
    }

    const senderSocketId = getReceiverSocketId(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", messageToEmit);
    }

    return res.status(201).json(messageToEmit);
  } catch (error) {
    console.log("Error in sendMessage ", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
