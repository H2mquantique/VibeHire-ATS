import { useEffect, useState } from "react";
import { usePuterStore } from "../lib/puter";
import type { CurrentUser, PuterUser, UserRole } from "../../types";

// Mapper PuterUser → CurrentUser
const mapPuterUserToCurrentUser = (user: Partial<PuterUser>): CurrentUser => ({
  id: user.id ?? Math.floor(Math.random() * 1000000), // id obligatoire
  username: user.name ?? "Anonymous",
  email: user.email ?? "",
  role: user.role ?? null,
  token: user.token ?? "",
});

export const useAuth = () => {
  const puterStore = usePuterStore();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Charger depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) {
      const user: CurrentUser = JSON.parse(saved);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  // Login via Puter
  const signIn = async () => {
    setIsLoading(true);
    try {
      await puterStore.auth.signIn();
      const user = (await puterStore.auth.getUser()) as Partial<PuterUser> | null;
      if (user) {
        const mappedUser = mapPuterUserToCurrentUser(user);
        setCurrentUser(mappedUser);
        setIsAuthenticated(true);
        localStorage.setItem("currentUser", JSON.stringify(mappedUser));
      }
    } catch (err) {
      console.error("Sign in failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await puterStore.auth.signOut();
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem("currentUser");
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const user = (await puterStore.auth.getUser()) as Partial<PuterUser> | null;
      if (user) {
        const mappedUser = mapPuterUserToCurrentUser(user);
        setCurrentUser(mappedUser);
        setIsAuthenticated(true);
        localStorage.setItem("currentUser", JSON.stringify(mappedUser));
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Refresh user failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserRole = (): string | null => currentUser?.role ?? null;

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    refreshUser,
    getUserRole,
    setCurrentUser,   // exposer pour login simulé
    setIsAuthenticated,
  };
};
