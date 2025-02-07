"use client";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

export default function Navbar() {
    const router = useRouter();
    const pathname = usePathname(); // Récupère le chemin de la page actuelle

    // Liste des pages où la navbar ne doit pas apparaître
    const pagesSansNavbar = ["/login", "/register", "/dashboard","/settings"];

    if (pagesSansNavbar.includes(pathname)) {
        return null; // Ne pas afficher la navbar
    }

    const handleLogout = () => {
        localStorage.removeItem("token");
        router.push("/login");
    };

    return (
        <header className="bg-gray-900 text-white p-4 flex justify-between">
            <Link href="/dashboard">
                <h1 className="text-lg font-bold">Mon Suivi d'Achats</h1>
            </Link>
            <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded">Déconnexion</button>
        </header>
    );
}



