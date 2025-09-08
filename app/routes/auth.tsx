import { usePuterStore } from "../lib/puter";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

const Auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const navigate = useNavigate();
  const next = location.search.split("next=")[1] || "/";

  const [hydrated, setHydrated] = useState(false);

  // --- Initialiser Puter et hydrater l'utilisateur depuis localStorage ---
  useEffect(() => {
    const initPuter = async () => {
      const store = usePuterStore.getState();
      if (store.init) await store.init();

      const stored = localStorage.getItem("currentUser");
      if (stored) {
        const user = JSON.parse(stored);
        store.auth.setUser(user);
      }
      setHydrated(true);
    };
    initPuter();
  }, []);

  // --- Redirection automatique si déjà connecté ---
  useEffect(() => {
    if (hydrated && auth.isAuthenticated) navigate(next);
  }, [hydrated, auth.isAuthenticated, next, navigate]);

  // --- Connexion par rôle ---
  const loginAs = async (role: "RH" | "Manager" | "Viewer") => {
    try {
      await window.puter.auth.signIn();
      const user = await window.puter.auth.getUser();
      const userWithRole = { ...user, role };
      auth.setUser(userWithRole);
      localStorage.setItem("currentUser", JSON.stringify(userWithRole));
      navigate(next);
    } catch (err) {
      console.error("Erreur login:", err);
    }
  };

  // --- Déconnexion ---
  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem("currentUser");
  };

  // --- Affichage ---
  if (!hydrated || isLoading) {
    return (
      <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center px-4">
        <button className="auth-button animate-pulse bg-blue-600 text-white py-3 rounded-xl shadow w-full">
          Loading...
        </button>
      </main>
    );
  }

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center px-4">
      <div className="shadow-2xl w-full max-w-md rounded-3xl bg-white p-8 md:p-10">
        <section className="flex flex-col gap-8">
          {/* Logo VibeHire */}
          <div className="flex flex-col items-center gap-2">
            <img src="/images/vibehire.png" alt="VibeHire Logo" className="w-32 md:w-75" />
            <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
            <p className="text-gray-500 text-sm md:text-base">
              Log in to continue
            </p>
          </div>

          {/* Connexion / Déconnexion */}
          {auth.isAuthenticated ? (
            <div className="flex flex-col gap-4">
              <span className="text-gray-700 font-semibold bg-gray-100 px-3 py-1 rounded-full shadow-sm text-center">
                {auth.user?.username} - Role:{" "}
                <span className="text-blue-600">{auth.user?.role}</span>
              </span>
              <button
                className="auth-button bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl shadow w-full transition"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:gap-5">
              <button
                className="auth-button bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow w-full transition transform hover:-translate-y-1 hover:scale-105"
                onClick={() => loginAs("RH")}
              >
                Login as RH
              </button>
              <button
                className="auth-button bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl shadow w-full transition transform hover:-translate-y-1 hover:scale-105"
                onClick={() => loginAs("Manager")}
              >
                Login as Manager
              </button>
              <button
                className="auth-button bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl shadow w-full transition transform hover:-translate-y-1 hover:scale-105"
                onClick={() => loginAs("Viewer")}
              >
                Login as Viewer
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Auth;
