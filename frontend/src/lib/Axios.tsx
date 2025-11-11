import axios from "axios";


const API_BASE =
  import.meta.env.MODE === "development"
    ? "http://localhost:5000"   
    : "";                       

const axiosInstance = axios.create({
  baseURL: `${API_BASE}/api/auth`,
  withCredentials: true,
});


axiosInstance.interceptors.request.use(
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
  (error) => Promise.reject(error)
);

export default axiosInstance;
