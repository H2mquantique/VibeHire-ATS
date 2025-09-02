// Auth.tsx
import { usePuterStore } from "../lib/puter";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

export const meta = () => [
  { title: "VibeHire | Auth" },
  { name: "description", content: "Log into your account" },
];

const Auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const next = location.search.split("next=")[1] || "/";
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isAuthenticated) navigate(next);
  }, [auth.isAuthenticated, next, navigate]);

  // Connexion rapide pour test
  const loginAs = (role: "RH" | "Manager" | "Viewer") => {
    auth.user = {
      uuid: Math.random().toString(),
      username: `Test ${role}`,
      role,
    };
    auth.isAuthenticated = true;
    navigate(next);
  };

  return (
    <main className="bg-[url('/images/bg-auth.svg')] bg-cover min-h-screen flex items-center justify-center px-4">
      <div className="gradient-border shadow-lg w-full max-w-md">
        <section className="flex flex-col gap-8 bg-white rounded-2xl p-8 md:p-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">Welcome</h1>
            <h2 className="text-gray-600 text-sm md:text-base">Log In to Continue</h2>
          </div>

          {isLoading ? (
            <button className="auth-button animate-pulse bg-blue-600 text-white py-3 rounded-xl shadow w-full">
              Signing you in...
            </button>
          ) : auth.isAuthenticated ? (
            <button
              className="auth-button bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl shadow w-full"
              onClick={auth.signOut}
            >
              Log Out
            </button>
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
