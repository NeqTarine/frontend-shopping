'use client';
import React, { useEffect, useState } from "react";
import API from "../../api/axios";
import { Card, Button, Modal, Label, TextInput, Select, Navbar } from "flowbite-react";
import { HiMail, HiLockClosed, HiCog } from "react-icons/hi";

export default function Profile() {
    const [userEmail, setUserEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [imapSettings, setImapSettings] = useState({
        imapServer: "",
        imapUser: "",
        imapPassword: "",
        imapPort: 993,
        imapTLS: true,
    });
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem("token");
            const emailResponse = await API.get("/api/user-email", { headers: { "x-auth-token": token } });
            const imapResponse = await API.get("/api/user/imap-settings", { headers: { "x-auth-token": token } });

            setUserEmail(emailResponse.data.email);
            setNewEmail(emailResponse.data.email);
            setImapSettings(imapResponse.data);
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des données utilisateur", error);
        }
    };

    const updateEmail = async () => {
        if (!newEmail) {
            setEmailError("L'e-mail ne peut pas être vide.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await API.put("/api/user/update-email", { newEmail }, { headers: { "x-auth-token": token } });
            setModalMessage("Email mis à jour avec succès !");
            setShowModal(true);
            setUserEmail(newEmail);
            setEmailError("");
        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour de l'e-mail", error);
            setModalMessage("Erreur lors de la mise à jour de l'e-mail.");
            setShowModal(true);
        }
    };

    const updatePassword = async () => {
        if (!currentPassword || !newPassword) {
            setPasswordError("Les champs de mot de passe ne peuvent pas être vides.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await API.put("/api/user/update-password", { currentPassword, newPassword }, { headers: { "x-auth-token": token } });
            setModalMessage("Mot de passe mis à jour avec succès !");
            setShowModal(true);
            setPasswordError("");
        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour du mot de passe", error);
            setModalMessage("Erreur lors de la mise à jour du mot de passe.");
            setShowModal(true);
        }
    };

    const handleIMAPUpdate = async (e) => {
        e.preventDefault();
        setError("");

        if (!imapSettings.imapServer || !imapSettings.imapUser || !imapSettings.imapPassword) {
            setError("Tous les champs IMAP sont requis.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            await API.put("/api/user/update-imap", imapSettings, {
                headers: { "x-auth-token": token },
            });

            const checkResponse = await API.get("/api/check-imap", {
                headers: { "x-auth-token": token },
            });

            if (checkResponse.data.status !== "success") {
                throw new Error("La validation IMAP a échoué");
            }

            setModalMessage("Paramètres IMAP mis à jour avec succès ! Redirection vers le tableau de bord...");
            setShowModal(true);

            // Redirection vers le tableau de bord après 2 secondes
            setTimeout(() => {
                window.location.href = "/dashboard";
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Échec de la mise à jour des paramètres IMAP");
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
        } else {
            fetchUserData();
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Navbar fluid rounded className="bg-white shadow-md mb-6 w-full max-w-4xl">
                <Navbar.Brand href="/dashboard">
                    <span className="self-center whitespace-nowrap text-xl font-semibold text-blue-600">Retour au tableau de bord</span>
                </Navbar.Brand>
            </Navbar>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
                <Card className="bg-white shadow-lg rounded-lg p-6 space-y-6 transition-transform transform hover:scale-105">
                    <div className="flex items-center space-x-4">
                        <HiMail className="text-blue-600 text-2xl" />
                        <h2 className="text-2xl font-bold text-blue-600">Modifier l'e-mail</h2>
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="newEmail" value="Nouvel e-mail" />
                        <TextInput id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} aria-describedby="emailError" className="border-gray-300 rounded-md" />
                        {emailError && <p className="text-red-500" id="emailError">{emailError}</p>}
                        <Button onClick={updateEmail} className="bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow">Mettre à jour l'e-mail</Button>
                    </div>
                </Card>

                <Card className="bg-white shadow-lg rounded-lg p-6 space-y-6 transition-transform transform hover:scale-105">
                    <div className="flex items-center space-x-4">
                        <HiLockClosed className="text-blue-600 text-2xl" />
                        <h2 className="text-2xl font-bold text-blue-600">Modifier le mot de passe</h2>
                    </div>
                    <div className="space-y-4">
                        <Label htmlFor="currentPassword" value="Mot de passe actuel" />
                        <TextInput id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} aria-describedby="passwordError" className="border-gray-300 rounded-md" />
                        <Label htmlFor="newPassword" value="Nouveau mot de passe" />
                        <TextInput id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} aria-describedby="passwordError" className="border-gray-300 rounded-md" />
                        {passwordError && <p className="text-red-500" id="passwordError">{passwordError}</p>}
                        <Button onClick={updatePassword} className="bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow">Mettre à jour le mot de passe</Button>
                    </div>
                </Card>

                <Card className="bg-white shadow-lg rounded-lg p-6 space-y-6 transition-transform transform hover:scale-105">
                    <div className="flex items-center space-x-4">
                        <HiCog className="text-blue-600 text-2xl" />
                        <h2 className="text-2xl font-bold text-blue-600">Modifier les paramètres IMAP</h2>
                    </div>
                    <form onSubmit={handleIMAPUpdate}>
                        <div className="space-y-4">
                            <Label htmlFor="imapServer" value="Serveur IMAP" />
                            <TextInput id="imapServer" type="text" value={imapSettings.imapServer} onChange={(e) => setImapSettings({ ...imapSettings, imapServer: e.target.value })} aria-describedby="imapError" className="border-gray-300 rounded-md" />
                            <Label htmlFor="imapUser" value="Utilisateur IMAP" />
                            <TextInput id="imapUser" type="text" value={imapSettings.imapUser} onChange={(e) => setImapSettings({ ...imapSettings, imapUser: e.target.value })} aria-describedby="imapError" className="border-gray-300 rounded-md" />
                            <Label htmlFor="imapPassword" value="Mot de passe IMAP" />
                            <TextInput id="imapPassword" type="password" value={imapSettings.imapPassword} onChange={(e) => setImapSettings({ ...imapSettings, imapPassword: e.target.value })} aria-describedby="imapError" className="border-gray-300 rounded-md" />
                            <Label htmlFor="imapPort" value="Port IMAP" />
                            <TextInput id="imapPort" type="number" value={imapSettings.imapPort} onChange={(e) => setImapSettings({ ...imapSettings, imapPort: e.target.value })} aria-describedby="imapError" className="border-gray-300 rounded-md" />
                            <Label htmlFor="imapTLS" value="Utiliser TLS" />
                            <Select id="imapTLS" value={imapSettings.imapTLS.toString()} onChange={(e) => setImapSettings({ ...imapSettings, imapTLS: e.target.value === "true" })} aria-describedby="imapError" className="border-gray-300 rounded-md">
                                <option value="true">Oui</option>
                                <option value="false">Non</option>
                            </Select>
                            {error && <p className="text-red-500" id="imapError">{error}</p>}
                            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow">Mettre à jour les paramètres IMAP</Button>
                        </div>
                    </form>
                </Card>
            </div>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <Modal.Header>{modalMessage}</Modal.Header>
                <Modal.Footer>
                    <Button onClick={() => setShowModal(false)} className="bg-blue-600 text-white hover:bg-blue-700 rounded-md shadow">Fermer</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
