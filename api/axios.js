import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:5001", // Adresse de ton backend
    withCredentials: true // Permet de gérer les cookies
});

export default API;
