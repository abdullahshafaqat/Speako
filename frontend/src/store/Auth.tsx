import {create} from "zustand"
import axiosInstance from "../lib/Axios"
import toast from "react-hot-toast"
import { io } from "socket.io-client";


const BASE_URL = import.meta.env.MODE === "development" 
  ? "http://localhost:5000" 
  : "/";


const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/+$/, "") ||
  BASE_URL || "http://localhost:5000";


const SOCKET_URL =
  (import.meta as any).env?.VITE_SOCKET_URL?.replace(/\/+$/, "") ||
  API_BASE;



const SESSION_STORAGE_KEY = "chat-auth-user";

const getStoredUser = () => {
    try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error("Error reading from sessionStorage:", error);
        return null;
    }
};

const setStoredUser = (user: any) => {
    try {
        if (user) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
        } else {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    } catch (error) {
        console.error("Error writing to sessionStorage:", error);
    }
};

export const useAuth = create((set, get) => ({
    authUser: getStoredUser(), // Initialize from sessionStorage
    isSigningUp: false,
    isLoggingIn: false,
    isUpdatingProfile: false,
    isChecking: true,
    onlineUsers: [],
    socket: null,

    checkAuth: async () => {
      try {
          const res = await axiosInstance.get("/check");
  
          if (res.data.user) {
              // Always trust backend cookie as the source of truth
              setStoredUser(res.data.user);
              set({ authUser: res.data.user });
              (get() as any).connectSocket();
          } else {
              // No valid cookie → logout state
              setStoredUser(null);
              set({ authUser: null });
          }
      } catch (error) {
          // Server error also means logged out
          setStoredUser(null);
          set({ authUser: null });
          console.log("Error during checkAuth:", error);
      } finally {
          set({ isChecking: false });
      }
  },
  
    signup: async (data: FormData) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/signup", data);
      setStoredUser(res.data); // Store in sessionStorage (tab-specific)
      set({ authUser: res.data });
      toast.success("Account created successfully");
      (get() as any).connectSocket();
    } catch (error) {
      toast.error((error as any).response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },
  login: async (data: { email: string; password: string }) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/login", data);
      setStoredUser(res.data); // Store in sessionStorage (tab-specific)
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      (get() as any).connectSocket();
    } catch (error) {
      toast.error((error as any).response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/logout");
      setStoredUser(null); // Clear sessionStorage
      set({ authUser: null });
      toast.success("Logged out successfully");
      (get() as any).disconnectSocket();
    } catch (error) {
      toast.error((error as any).response?.data?.message || "Logout failed");
    }
  },
   updateProfile: async (data: FormData) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/update-profile", data);
      setStoredUser(res.data); // Update sessionStorage
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error((error as any).response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser } = get() as { authUser: any };
    if (!authUser) {
      console.log("Cannot connect socket: no authUser");
      return;
    }
    
    // Disconnect existing socket if any
    const existingSocket = (get() as any).socket;
    if (existingSocket) {
      console.log("Disconnecting existing socket");
      existingSocket.off("connect");
      existingSocket.off("disconnect");
      existingSocket.off("connect_error");
      existingSocket.off("getOnlineUsers");
      if (existingSocket.connected) {
        existingSocket.disconnect();
      }
    }
    
    // Convert userId to string to ensure consistency
    const userId = String(authUser._id);
    console.log("Connecting socket with userId:", userId);
    
    const socket = io(SOCKET_URL, {
      query: {
        userId: userId,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });
    
    set({ socket: socket });
    
    socket.on("connect", () => {
      console.log("Socket connected successfully:", socket.id);
    });
    
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });
    
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
    
    socket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
    });
    
    socket.on("getOnlineUsers", (usersIds) => {
      console.log("Received online users:", usersIds);
      set({ onlineUsers: usersIds });
    });
  },
  disconnectSocket: () => {
    const socket = (get() as any).socket;
    if (socket) {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("getOnlineUsers");
      if (socket.connected) {
        socket.disconnect();
      }
      set({ socket: null, onlineUsers: [] });
    }
  },
}))

