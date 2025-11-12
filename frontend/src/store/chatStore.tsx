import { create } from "zustand";
import toast from "react-hot-toast";
import axiosMessages from "../lib/axiosMessages";
import { useAuth } from "./Auth";

export const useChatStore = create((set,get) => ({
    users: [],
    messages: [],
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,

    setSelectedUser: (user: any) => {
        set({ selectedUser: user });
        if (user) {
            set({ messages: [] });
        }
    },

    getUsers: async () => {
        try {
            set({ isUsersLoading: true });
            const { data } = await axiosMessages.get("/users");
            set({ users: data });
        } catch (error) {
            toast.error("Failed to get users");
        } finally {
            set({ isUsersLoading: false });
        }
    },

    getMessages: async (userId: string) => {
        try {
            set({ isMessagesLoading: true });
            const res = await axiosMessages.get(`/${userId}`);
            set({ messages: res.data });
        } catch (error) {
            toast.error("Failed to load messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },
    sendMessage: async (messageData: Record<string, any>) => {
  const { selectedUser, messages } = get() as { selectedUser: any; messages: any[] };

  if (!selectedUser) {
    toast.error("Please select a user to send a message");
    return;
  }

  try {
    const res = await axiosMessages.post(`/send/${selectedUser._id}`, messageData);
    
    const messageExists = messages.some((msg: any) => msg._id === res.data._id);
    if (!messageExists) {
      set({ messages: [...messages, res.data] });
    }
  } catch (error: any) {
    toast.error(error.response?.data?.message || "Something went wrong");
  }
},



    subscribeToMessages: () => {
        const { selectedUser } = get() as { selectedUser: any };
        const authState = useAuth.getState() as { socket?: any; authUser?: any };
        const socket = authState.socket;
        const authUser = authState.authUser;
        
        if (!socket || !selectedUser || !authUser) {
            console.log("Cannot subscribe: socket, selectedUser, or authUser missing");
            return;
        }

        const setupMessageListener = () => {
            socket.off("newMessage");
            
            socket.on("newMessage", (message: any) => {
                console.log("Received newMessage event:", message);
                const { messages, selectedUser: currentSelectedUser } = get() as { messages: any[]; selectedUser: any };
                const currentAuthUser = (useAuth.getState() as { authUser?: any }).authUser;
                
                if (!currentAuthUser || !currentSelectedUser) {
                    console.log("Cannot process message: missing authUser or selectedUser");
                    return;
                }
                
                const messageSenderId = String(message.senderId);
                const messageReceiverId = String(message.receiverId);
                const authUserId = String(currentAuthUser._id);
                const selectedUserId = String(currentSelectedUser._id);
                
                const isMessageBetweenUsers = 
                    (messageSenderId === authUserId && messageReceiverId === selectedUserId) ||
                    (messageSenderId === selectedUserId && messageReceiverId === authUserId);
                
                if (isMessageBetweenUsers) {
                    const messageExists = messages.some((msg: any) => String(msg._id) === String(message._id));
                    if (!messageExists) {
                        console.log("Adding new message to state");
                        set({ messages: [...messages, message] });
                    } else {
                        console.log("Message already exists, skipping");
                    }
                } else {
                    console.log("Message not for current conversation");
                }
            });
        };

        if (!socket.connected) {
            console.log("Socket not connected, waiting for connection...");
            socket.once("connect", () => {
                console.log("Socket connected, setting up message listener");
                setupMessageListener();
            });
        } else {
            console.log("Socket already connected, setting up message listener");
            setupMessageListener();
        }
    },
    unsubscribeFromMessages: () => {
        const socket = (useAuth.getState() as { socket?: any }).socket;
        if (!socket) return;
        socket.off("newMessage");
    },
}));