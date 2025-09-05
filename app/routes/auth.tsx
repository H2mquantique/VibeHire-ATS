import { usePuterStore } from "../lib/puter";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

const Auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const navigate = useNavigate();
  const next = location.search.split("next=")[1] || "/";

  const [hydrated, setHydrated] = useState(false);

  // --- Initialiser Puter.js et hydrater l'utilisateur depuis localStorage ---
  useEffect(() => {
    const initPuter = async () => {
      const store = usePuterStore.getState();
      if (store.init) await store.init();

      const stored = localStorage.getItem("currentUser");
      if (stored) {
        const user = JSON.parse(stored);
        // Utilise la méthode du store si elle existe
        store.auth.setUser
          ? store.auth.setUser(user)
          : usePuterStore.setState({
            auth: { ...store.auth, user, isAuthenticated: true },
          });
      }
      setHydrated(true);
    };
    initPuter();
  }, []);

  // --- Redirection automatique si déjà connecté ---
  useEffect(() => {
    if (hydrated && auth.isAuthenticated) navigate(next);
  }, [hydrated, auth.isAuthenticated, next, navigate]);

  // --- Connexion fictive pour test uniquement si aucun user réel ---
  const loginAs = (role: "RH" | "Manager" | "Viewer") => {
    const stored = localStorage.getItem("currentUser");
    const user = stored
      ? JSON.parse(stored) // Utilise le vrai utilisateur si présent
      : {
        uuid: Math.random().toString(),
        username: `Test ${role}`,
        role,
      };

    const store = usePuterStore.getState();
    store.auth.setUser
      ? store.auth.setUser(user)
      : usePuterStore.setState({
        auth: { ...store.auth, user, isAuthenticated: true },
      });

    localStorage.setItem("currentUser", JSON.stringify(user));
    navigate(next);
  };

  // --- Déconnexion ---
  const handleLogout = () => {
    const store = usePuterStore.getState();
    if (auth.signOut) auth.signOut();
    else
      usePuterStore.setState({
        auth: { ...auth, user: null, isAuthenticated: false },
      });
    localStorage.removeItem("currentUser");
  };

  // --- Affichage seulement quand l'état est hydraté ---
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
      <div className="gradient-border shadow-lg w-full max-w-md">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-8 md:p-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">Welcome</h1>
            <h2 className="text-gray-600 text-sm md:text-base">Log In to Continue</h2>
          </div>

          {auth.isAuthenticated ? (
            <div className="flex flex-col gap-4">
              <span className="text-gray-700 font-semibold bg-gray-100 px-3 py-1 rounded-full shadow-sm">
                {auth.user?.username} - Role:{" "}
                <span className="text-blue-600">{auth.user?.role ?? "Viewer"}</span>
              </span>
              <button
                className="auth-button bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl shadow w-full"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 md:gap-5">
              <button
                className="auth-button bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow w-full transition"
                onClick={() => loginAs("RH")}
              >
                Login as RH
              </button>
              <button
                className="auth-button bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl shadow w-full transition"
                onClick={() => loginAs("Manager")}
              >
                Login as Manager
              </button>
              <button
                className="auth-button bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl shadow w-full transition"
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
