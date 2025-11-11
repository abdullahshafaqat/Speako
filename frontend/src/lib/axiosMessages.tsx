import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

const axiosMessages = axios.create({
  baseURL: `${API_BASE}/api/messages`,
  withCredentials: true,
});

// Add interceptor to include stored user ID in header for tab-specific sessions
axiosMessages.interceptors.request.use(
    (config) => {
        // Get stored user from sessionStorage
        try {
            const stored = sessionStorage.getItem("chat-auth-user");
            if (stored) {
                const user = JSON.parse(stored);
                // Add user ID to header so backend can verify/restore correct cookie
                config.headers["x-user-id"] = user._id;
            }
        } catch (error) {
            // Ignore errors
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosMessages;
