import axios from "axios";

const API = axios.create({
    baseURL: "http://192.168.3.177:5001", // Adresse de ton backend
    withCredentials: true // Permet de gérer les cookies
});

export default API;
