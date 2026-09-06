import axios from "axios";

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("healthnest_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("healthnest_token");
      localStorage.removeItem("healthnest_user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default axiosClient;