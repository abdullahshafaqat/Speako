import { Server } from 'socket.io';
import http from 'http';
import express from 'express';

const app = express();
const server = http.createServer(app); 
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
  maxHttpBufferSize: 25 * 1024 * 1024
});
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}
const userSocketMap ={}
io.on("connection", (socket) => {
    console.log("a user connected", socket.id);
    const userId = String(socket.handshake.query.userId || "");
    
    if (userId) {
        const existingSocketId = userSocketMap[userId];
        if (existingSocketId && existingSocketId !== socket.id) {
            console.log(`User ${userId} already has a socket ${existingSocketId}, disconnecting old one`);
            const oldSocket = io.sockets.sockets.get(existingSocketId);
            if (oldSocket) {
                oldSocket.disconnect();
            }
        }
        
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} mapped to socket ${socket.id}`);
    }
    
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    
    socket.on("disconnect", () => {
        console.log("user disconnected", socket.id);
        if (userId) {
            if (userSocketMap[userId] === socket.id) {
                delete userSocketMap[userId];
                console.log(`Removed user ${userId} from socket map`);
            }
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});
export { io, app, server };