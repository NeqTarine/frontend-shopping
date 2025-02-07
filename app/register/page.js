"use client";
import { useState } from "react";
import API from "../../api/axios";
import { useRouter } from 'next/navigation';



export default function Signup() {
    const router = useRouter(); // Initialisez le router
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        imapServer: "",
        imapUser: "",
        imapPassword: "",
        imapPort: "993",
        imapTLS: true,
    });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            const response = await API.post("/api/auth/register", {
                email: formData.email,
                password: formData.password,
                imapServer: "fake",
                imapUser: "fake",
                imapPassword: "fake"
            });
            localStorage.setItem("token", response.data.token);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.msg || "An error occurred");
        }
    };

    const handleIMAPUpdate = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const token = localStorage.getItem("token");
            await API.put("/api/user/update-imap", formData, {
                headers: { "x-auth-token": token },
            });

            const checkResponse = await API.get("/api/check-imap", {
                headers: { "x-auth-token": token },
            });

            if (checkResponse.data.status !== "success") throw new Error("IMAP validation failed");

            window.location.href = "/dashboard";
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update IMAP settings");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
            <h2 className="text-3xl font-bold mb-6">{step === 1 ? "Sign Up" : "IMAP Settings"}</h2>
            <div className="w-full max-w-md p-8 bg-gray-900 shadow-lg rounded-2xl border border-gray-700">
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                {step === 1 ? (
                    <form onSubmit={handleSignup} className="space-y-4">
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400" required />
                        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400" required />
                        <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400" required />
                        <button type="submit" className="w-full p-3 bg-white text-black rounded-lg font-semibold transition hover:bg-gray-300">Next</button>
                    </form>
                ) : (
                    <form onSubmit={handleIMAPUpdate} className="space-y-4">
                        <input type="text" name="imapServer" placeholder="IMAP Server" value={formData.imapServer} onChange={handleChange} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400" required />
                        <input type="text" name="imapUser" placeholder="IMAP Username" value={formData.imapUser} onChange={handleChange} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400" required />
                        <input type="password" name="imapPassword" placeholder="IMAP Password" value={formData.imapPassword} onChange={handleChange} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400" required />
                        <input type="number" name="imapPort" placeholder="IMAP Port" value={formData.imapPort} onChange={handleChange} className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400" required />
                        <label className="flex items-center text-white">
                            <input type="checkbox" name="imapTLS" checked={formData.imapTLS} onChange={(e) => setFormData({ ...formData, imapTLS: e.target.checked })} className="mr-2" /> Use TLS
                        </label>
                        <button type="submit" className="w-full p-3 bg-white text-black rounded-lg font-semibold transition hover:bg-gray-300">Validate IMAP</button>
                    </form>
                )}
            </div>
            <p className="mt-4 text-gray-400">Already have an account? <a href="#" onClick={() => router.push("/login")} className="text-blue-500 hover:underline">Sign In</a></p>
        </div>
    );
}
