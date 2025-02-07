"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "../../api/axios";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const { data } = await API.post("/api/auth/login", { email, password });
            localStorage.setItem("token", data.token);
            router.push("/dashboard");
        } catch (error) {
            alert("Login failed");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
            <h2 className="text-3xl font-bold mb-6 text-white">Sign In</h2>
            <div className="w-full max-w-md p-8 bg-gray-900 shadow-lg rounded-2xl border border-gray-700">
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button className="w-full p-3 bg-white text-black rounded-lg font-semibold transition hover:bg-gray-300">Sign In</button>
                </form>
            </div>
            <p className="mt-4 text-gray-400">Don't have an account? <a href="#" onClick={() => router.push("/register")} className="text-blue-500 hover:underline">Sign Up</a></p>
        </div>
    );
}
