import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "http://localhost:5000";

const axiosMessages = axios.create({
  baseURL: `${API_BASE}/api/messages`,
  withCredentials: true,
});

axiosMessages.interceptors.request.use(
    (config) => {
        try {
            const stored = sessionStorage.getItem("chat-auth-user");
            if (stored) {
                const user = JSON.parse(stored);
                config.headers["x-user-id"] = user._id;
            }
        } catch (error) {
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosMessages;
