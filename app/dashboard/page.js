'use client';
import React, { useEffect, useState, useCallback, useRef } from "react";
import API from "../../api/axios";
import { Card, Button, Modal, Label, TextInput, Select, Navbar, Dropdown, Avatar } from "flowbite-react";
import dynamic from "next/dynamic";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { DataTable } from "simple-datatables";
import "simple-datatables/dist/style.css";
import { FaShoppingCart, FaChartLine, FaAmazon, FaEbay } from "react-icons/fa";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });


API.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response && error.response.status === 429) {
            // Attendre avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Réessayer la requête
            return API(originalRequest);
        }

        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

// Intercepteur de réponse Axios pour gérer les erreurs 401
API.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Supprimer le token et rediriger vers la page de connexion
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default function Dashboard() {
    const [purchases, setPurchases] = useState([]);
    const [monthlyTotal, setMonthlyTotal] = useState(0);
    const [previousMonthTotal, setPreviousMonthTotal] = useState(0);
    const [yearlyTotal, setYearlyTotal] = useState(0);
    const [storeData, setStoreData] = useState({ labels: [], series: [] });
    const [yearlyData, setYearlyData] = useState(new Array(12).fill(0));
    const [showModal, setShowModal] = useState(false);
    const [newPurchase, setNewPurchase] = useState({ store: "Amazon", amount: "", currency: "€", date: "", description: "" });
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [purchaseToDelete, setPurchaseToDelete] = useState(null);
    const [isEmpty, setIsEmpty] = useState(true);
    const [processed, setProcessed] = useState(0);
    const [total, setTotal] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [userEmail, setUserEmail] = useState(""); // État pour stocker l'e-mail de l'utilisateur
    const tableRef = useRef(null);

    const getStoreIcon = (store) => {
        switch (store) {
            case "Amazon":
                return <FaAmazon className="mr-2 text-xl" />;
            case "eBay":
                return <FaEbay className="mr-2 text-xl" />;
            default:
                return <FaShoppingCart className="mr-2 text-xl" />; // Icône par défaut si le magasin n'est pas reconnu
        }
    };

    const fetchLastUpdate = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await API.get("/api/last-update", {
                headers: { "x-auth-token": token },
            });

            const lastUpdateDate = new Date(data.lastUpdate);
            const formattedDate = lastUpdateDate.toLocaleString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });

            setLastUpdate(formattedDate);
        } catch (error) {
            console.error("❌ Erreur lors de la récupération de la dernière mise à jour :", error);
        }
    };

    const fetchProgress = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await API.get("/api/progress", { headers: { "x-auth-token": token } });

            console.log("📊 Données de progression reçues:", data);

            setProcessed(data.processed);
            setTotal(data.total);

            saveSyncState(data.processed, data.total, true);

            if (data.processed >= data.total) {
                console.log("✅ Synchronisation terminée !");
                setSyncing(false);
                saveSyncState(data.processed, data.total, false);

                fetchPurchases();
                fetchLastUpdate();
            }
        } catch (error) {
            console.error("❌ Erreur récupération progression :", error);
        }
    };

    const startSync = async () => {
        if (syncing) {
            console.log("⚠️ Synchronisation déjà en cours, annulation du redémarrage.");
            return;
        }

        console.log("🔄 Début de la synchronisation...");
        setSyncing(true);
        setProcessed(0);
        setTotal(0);
        saveSyncState(0, 0, true);

        try {
            const token = localStorage.getItem("token");

            API.get("/api/fetch-purchases", { headers: { "x-auth-token": token } })
                .then(() => console.log("✅ Requête envoyée à /api/fetch-purchases"))
                .catch(error => console.error("❌ Erreur lors de l'envoi à /api/fetch-purchases:", error));

            console.log("🚀 Lancement immédiat de la surveillance de progression...");

            const interval = setInterval(fetchProgress, 1000);

            setTimeout(() => {
                console.log("🛑 Arrêt du suivi de progression.");
                clearInterval(interval);
            }, 60000);
        } catch (error) {
            console.error("❌ Erreur lors de la synchronisation:", error);
        }
    };

    const recalculateTotals = (purchases) => {
        const now = new Date();
        const currentMonth = now.getUTCMonth();
        const currentYear = now.getUTCFullYear();

        let monthTotal = 0, yearlyTotal = 0;
        const monthlyTotals = new Array(12).fill(0);

        purchases.forEach(({ date, amount }) => {
            const purchaseDate = new Date(date);
            const purchaseMonth = purchaseDate.getUTCMonth();
            const purchaseYear = purchaseDate.getUTCFullYear();

            if (purchaseYear === currentYear) {
                monthlyTotals[purchaseMonth] += amount;
                yearlyTotal += amount;

                if (purchaseMonth === currentMonth) monthTotal += amount;
            }
        });

        setMonthlyTotal(monthTotal);
        setYearlyTotal(yearlyTotal);
        setYearlyData(monthlyTotals);
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    };

    const handleDeletePurchase = async () => {
        if (!purchaseToDelete) return;
        try {
            const token = localStorage.getItem("token");
            await API.delete(`/api/purchases/${purchaseToDelete}`, {
                headers: { "x-auth-token": token },
            });

            const updatedPurchases = purchases.filter(purchase => purchase._id !== purchaseToDelete);
            setPurchases(updatedPurchases);

            recalculateTotals(updatedPurchases);
            setIsEmpty(updatedPurchases.length === 0);
            setShowDeleteModal(false);
        } catch (error) {
            console.error("Erreur lors de la suppression de l'achat", error);
        }
    };

    const saveSyncState = (processed, total, syncing) => {
        localStorage.setItem("syncState", JSON.stringify({ processed, total, syncing }));
    };

    const loadSyncState = () => {
        const syncState = localStorage.getItem("syncState");
        return syncState ? JSON.parse(syncState) : { processed: 0, total: 0, syncing: false };
    };

    const fetchPurchases = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await API.get("/api/purchases", { headers: { "x-auth-token": token } });

            if (Array.isArray(data.purchases) && data.purchases.length > 0) {
                const sortedPurchases = data.purchases.sort((a, b) => new Date(b.date) - new Date(a.date));
                setPurchases(sortedPurchases);
                processPurchases(sortedPurchases);
                setIsEmpty(false);
            } else {
                setIsEmpty(true);
            }
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des achats", error);
        }
    }, []);

    const fetchUserEmail = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await API.get("/api/user-email", { headers: { "x-auth-token": token } });
            setUserEmail(data.email);
        } catch (error) {
            console.error("❌ Erreur lors de la récupération de l'e-mail de l'utilisateur", error);
        }
    };

    useEffect(() => {
        console.log("🚀 Dashboard monté, récupération de l'état de synchronisation...");

        const { processed, total, syncing } = loadSyncState();
        setProcessed(processed);
        setTotal(total);
        setSyncing(syncing);

        fetchPurchases();
        fetchUserEmail(); // Récupérer l'e-mail de l'utilisateur

        if (syncing) {
            console.log("🔄 Une synchronisation était déjà en cours, on reprend le suivi...");
            const interval = setInterval(fetchProgress, 1000);

            setTimeout(() => {
                console.log("🛑 Arrêt automatique du suivi de synchronisation.");
                clearInterval(interval);
            }, 60000);
        }
    }, [fetchPurchases]);

    const processPurchases = (purchases) => {
        const now = new Date();
        const currentMonth = now.getUTCMonth();
        const currentYear = now.getUTCFullYear();

        let monthTotal = 0, prevMonthTotal = 0, yearlyTotal = 0;
        const monthlyTotals = new Array(12).fill(0);
        const storeCount = {};

        purchases.forEach(({ date, amount, store }) => {
            const purchaseDate = new Date(date);
            const purchaseMonth = purchaseDate.getUTCMonth();
            const purchaseYear = purchaseDate.getUTCFullYear();

            if (purchaseYear === currentYear) {
                monthlyTotals[purchaseMonth] += amount;
                storeCount[store] = (storeCount[store] || 0) + amount;
                yearlyTotal += amount;

                if (purchaseMonth === currentMonth) monthTotal += amount;
                if (purchaseMonth === currentMonth - 1) prevMonthTotal += amount;
            }
        });

        setMonthlyTotal(monthTotal);
        setPreviousMonthTotal(prevMonthTotal);
        setYearlyTotal(yearlyTotal);
        setYearlyData(monthlyTotals);
        setStoreData({ labels: Object.keys(storeCount), series: Object.values(storeCount) });
    };

    const handleAddPurchase = async () => {
        if (!newPurchase) return;
        try {
            const token = localStorage.getItem("token");
            await API.post("/api/purchases", newPurchase, {
                headers: { "x-auth-token": token },
            });
            setShowModal(false);
            fetchPurchases();
        } catch (error) {
            console.error("Erreur lors de l'ajout de l'achat", error);
        }
    };

    useEffect(() => {
        fetchPurchases();
        fetchLastUpdate();
        startSync();
    }, [fetchPurchases]);

    useEffect(() => {
        if (tableRef.current) {
            new DataTable(tableRef.current, {
                searchable: true,
                fixedHeight: true
            });
        }
    }, [purchases]);

    return (
        <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
            <Navbar fluid rounded className="bg-white shadow-md">
                <Navbar.Brand href="/">
                    <FaShoppingCart className="mr-2 text-xl" />
                    <span className="self-center whitespace-nowrap text-xl font-semibold text-blue-600">Dashboard</span>
                </Navbar.Brand>
                <div className="flex md:order-2">
                    <Dropdown
                        arrowIcon={false}
                        inline
                        label={<Avatar alt="User" img="/avatar.svg" rounded />}
                    >
                        <Dropdown.Header>
                            <span className="block text-sm font-medium">{userEmail}</span> {/* Afficher l'e-mail de l'utilisateur */}
                        </Dropdown.Header>
                        <Dropdown.Item href="/settings">Paramètres du compte</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleSignOut} className="text-red-500">
  Se déconnecter
</Dropdown.Item>
                    </Dropdown>
                </div>
            </Navbar>

            <div className="p-6 flex items-center space-x-4 bg-white shadow-md rounded-lg">
                {lastUpdate && (
                    <p className="text-gray-500 text-sm">
                        Dernière mise à jour : <span className="font-semibold">{lastUpdate}</span>
                    </p>
                )}

                {syncing && (
                    <div className="flex items-center text-gray-500 text-sm">
                        <AiOutlineLoading3Quarters className="animate-spin mr-2" />
                        Synchronisation des e-mails {processed}/{total}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 flex flex-col justify-between md:col-span-1 bg-white shadow-md rounded-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-blue-600 flex items-center">
                            <FaShoppingCart className="mr-2" /> Dépenses ce mois-ci
                        </h2>
                        <p className="text-3xl">
                            {monthlyTotal < previousMonthTotal ? "😃" : monthlyTotal > previousMonthTotal ? "😞" : "😐"}
                        </p>
                    </div>
                    {isEmpty ? (
                        <p className="text-gray-500 mt-4">
                            Aucune dépense enregistrée. <br />
                            <span className="font-bold">Ajoutez un achat</span> ou <span className="font-bold">synchronisez votre compte.</span>
                        </p>
                    ) : (
                        <p className="text-2xl font-semibold mt-2 text-green-600">{monthlyTotal.toFixed(2)} €</p>
                    )}

                    <div className="mt-6 border-t pt-4">
                        <h2 className="text-lg font-bold mb-2 text-blue-600 flex items-center">
                            <FaChartLine className="mr-2" /> Magasins préférés
                        </h2>
                        {isEmpty || storeData.series.length === 0 ? (
                            <p className="text-gray-500">
                                Aucune donnée disponible. <br />
                                <span className="font-bold">Ajoutez un achat</span> pour voir vos magasins préférés.
                            </p>
                        ) : (
                            <Chart
                                options={{ labels: storeData.labels }}
                                series={storeData.series}
                                type="pie"
                                height={250}
                            />
                        )}
                    </div>
                </Card>

                <Card className="p-6 md:col-span-2 bg-white shadow-md rounded-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-blue-600 flex items-center">
                            <FaChartLine className="mr-2" /> Dépenses annuelles
                        </h2>
                        <p className="text-2xl font-semibold text-green-600">Total : {yearlyTotal.toFixed(2)} €</p>
                    </div>
                    {isEmpty ? (
                        <p className="text-gray-500 mt-4">
                            Aucune donnée annuelle. Commencez par ajouter un achat.
                        </p>
                    ) : (
                        <Chart
                            options={{
                                chart: { type: "area" },
                                xaxis: { categories: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"] },
                            }}
                            series={[{ name: "Dépenses (€)", data: yearlyData }]}
                            type="area"
                            height={300}
                        />
                    )}
                </Card>
            </div>

            <Card className="w-full p-6 bg-white shadow-md rounded-lg">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-blue-600 flex items-center">
                        <FaShoppingCart className="mr-2" /> Mes Achats
                    </h2>
                    <Button onClick={() => setShowModal(true)} className="bg-blue-600 text-white hover:bg-blue-700">+</Button>
                </div>

                {purchases.length === 0 ? (
                    <p className="text-gray-500">Aucun achat enregistré. Ajoutez-en un pour commencer.</p>
                ) : (
                    <table id="filter-table" ref={tableRef} className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Magasin</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchases.map(({ _id, description, store, amount, currency, date }) => (
                                <tr key={_id} className="hover:bg-gray-100 transition-colors duration-150">
                                    <td className="px-6 py-4 whitespace-no-wrap">{description}</td>
                                    <td className="px-6 py-4 whitespace-no-wrap flex items-center">
                                        {getStoreIcon(store)}
                                        {store}
                                    </td>
                                    <td className="px-6 py-4 whitespace-no-wrap">{amount.toFixed(2)} {currency}</td>
                                    <td className="px-6 py-4 whitespace-no-wrap">{new Date(date).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-no-wrap">
                                        <Button size="xs" color="failure" onClick={() => {
                                            setPurchaseToDelete(_id);
                                            setShowDeleteModal(true);
                                        }}>Supprimer</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
                <Modal.Header>Confirmation</Modal.Header>
                <Modal.Body>Voulez-vous vraiment supprimer cet achat ?</Modal.Body>
                <Modal.Footer>
                    <Button color="gray" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
                    <Button color="failure" onClick={handleDeletePurchase}>Supprimer</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showModal} onClose={() => setShowModal(false)}>
                <Modal.Header>Ajouter un achat</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <Label htmlFor="store" value="Magasin" />
                        <Select id="store" value={newPurchase.store} onChange={(e) => setNewPurchase({ ...newPurchase, store: e.target.value })}>
                            <option value="Amazon">Amazon</option>
                            <option value="eBay">eBay</option>
                            <option value="Autre">Autre</option>
                        </Select>
                        <Label htmlFor="description" value="Description" />
                        <TextInput id="description" value={newPurchase.description} onChange={(e) => setNewPurchase({ ...newPurchase, description: e.target.value })} />
                        <Label htmlFor="amount" value="Montant" />
                        <TextInput id="amount" type="number" value={newPurchase.amount} onChange={(e) => setNewPurchase({ ...newPurchase, amount: e.target.value })} />
                        <Label htmlFor="date" value="Date" />
                        <TextInput id="date" type="date" value={newPurchase.date} onChange={(e) => setNewPurchase({ ...newPurchase, date: e.target.value })} />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleAddPurchase} className="bg-blue-600 text-white hover:bg-blue-700">Ajouter</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
