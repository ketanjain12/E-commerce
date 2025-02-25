import axios from "axios";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? "http://localhost:5000/api" : "http://localhost:5000/api"
});

export default axiosInstance;



