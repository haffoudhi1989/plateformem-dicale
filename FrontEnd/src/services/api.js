import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000",
    headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        // Chercher d'abord dans localStorage,
        // puis dans sessionStorage
        const token =
            localStorage.getItem("token") ||
            sessionStorage.getItem("token");

        console.log("TOKEN ENVOYÉ :", token);

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;