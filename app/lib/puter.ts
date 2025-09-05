import { create } from "zustand";

declare global {
  interface Window {
    puter: {
      auth: {
        getUser: () => Promise<PuterUser>;
        isSignedIn: () => Promise<boolean>;
        signIn: () => Promise<void>;
        signOut: () => Promise<void>;
      };
      fs: {
        write: (path: string, data: string | File | Blob) => Promise<File | undefined>;
        read: (path: string) => Promise<Blob>;
        upload: (file: File[] | Blob[]) => Promise<FSItem>;
        delete: (path: string) => Promise<void>;
        readdir: (path: string) => Promise<FSItem[] | undefined>;
      };
      ai: {
        chat: (
          prompt: string | ChatMessage[],
          imageURL?: string | PuterChatOptions,
          testMode?: boolean,
          options?: PuterChatOptions
        ) => Promise<Object>;
        img2txt: (image: string | File | Blob, testMode?: boolean) => Promise<string>;
      };
      kv: {
        get: (key: string) => Promise<string | null>;
        set: (key: string, value: string) => Promise<boolean>;
        delete?: (key: string) => Promise<boolean>;
        list: (pattern: string, returnValues?: boolean) => Promise<string[]>;
        flush: () => Promise<boolean>;
      };
    };
  }
}

interface PuterStore {
  isLoading: boolean;
  error: string | null;
  puterReady: boolean;
  auth: {
    user: PuterUser | null;
    isAuthenticated: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshUser: () => Promise<void>;
    checkAuthStatus: () => Promise<boolean>;
    setUser: (user: PuterUser | null) => void;
    getUser: () => PuterUser | null;
  };
  fs: {
    write: (path: string, data: string | File | Blob) => Promise<File | undefined>;
    read: (path: string) => Promise<Blob | undefined>;
    upload: (file: File[] | Blob[]) => Promise<FSItem | undefined>;
    delete: (path: string) => Promise<void>;
    readDir: (path: string) => Promise<FSItem[] | undefined>;
  };
  ai: {
    chat: (
      prompt: string | ChatMessage[],
      imageURL?: string | PuterChatOptions,
      testMode?: boolean,
      options?: PuterChatOptions
    ) => Promise<AIResponse | undefined>;
    feedback: (path: string, message: string) => Promise<AIResponse | undefined>;
    img2txt: (image: string | File | Blob, testMode?: boolean) => Promise<string | undefined>;
  };
  kv: {
    get: (key: string) => Promise<string | null | undefined>;
    set: (key: string, value: string) => Promise<boolean | undefined>;
    delete: (key: string) => Promise<boolean | undefined>;
    list: (pattern: string, returnValues?: boolean) => Promise<string[] | KVItem[] | undefined>;
    flush: () => Promise<boolean | undefined>;
  };
  init: () => Promise<void>;
  clearError: () => void;
}

const getPuter = (): typeof window.puter | null =>
  typeof window !== "undefined" && window.puter ? window.puter : null;

export const usePuterStore = create<PuterStore>((set, get) => {
  const setError = (msg: string) => set({ error: msg, isLoading: false });

  const updateUser = (user: PuterUser | null) => {
    if (!user) {
      set({
        auth: {
          ...get().auth,
          user: null,
          isAuthenticated: false,
          getUser: () => null,
          setUser: (u: PuterUser | null) => updateUser(u),
        },
        isLoading: false,
      });
      localStorage.removeItem("currentUser");
      return;
    }

    const currentUser = get().auth.user;

    // --- récupérer role depuis localStorage si présent ---
    const savedUser = localStorage.getItem("currentUser");
    const savedRole = savedUser ? JSON.parse(savedUser).role : undefined;

    const mergedUser: PuterUser = {
      uuid: user.uuid || currentUser?.uuid || "unknown-uuid",
      username: user.username || currentUser?.username || "unknown",
      role: user.role || savedRole || currentUser?.role || "Viewer",
    };

    set({
      auth: {
        ...get().auth,
        user: mergedUser,
        isAuthenticated: true,
        getUser: () => mergedUser,
        setUser: (u: PuterUser | null) => updateUser(u),
      },
      isLoading: false,
    });

    localStorage.setItem("currentUser", JSON.stringify(mergedUser));
  };

  const checkAuthStatus = async (): Promise<boolean> => {
    const puter = getPuter();
    if (!puter) {
      setError("Puter.js not available");
      return false;
    }

    set({ isLoading: true, error: null });

    try {
      const isSignedIn = await puter.auth.isSignedIn();
      if (isSignedIn) {
        const user = await puter.auth.getUser();
        updateUser(user);
        return true;
      } else {
        const saved = localStorage.getItem("currentUser");
        updateUser(saved ? JSON.parse(saved) : null);
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check auth status");
      return false;
    }
  };

  const signIn = async (): Promise<void> => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");

    set({ isLoading: true, error: null });

    try {
      await puter.auth.signIn();
      const user = await puter.auth.getUser();
      updateUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    }
  };

  const signOut = async (): Promise<void> => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");

    set({ isLoading: true, error: null });

    try {
      await puter.auth.signOut();
      updateUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign out failed");
    }
  };

  const refreshUser = async (): Promise<void> => {
    const puter = getPuter();
    if (!puter) return setError("Puter.js not available");

    set({ isLoading: true, error: null });

    try {
      const user = await puter.auth.getUser();
      updateUser(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh user");
    }
  };

  const init = async (): Promise<void> => {
    try {
      const puter = await new Promise<typeof window.puter>((resolve, reject) => {
        if (getPuter()) resolve(getPuter()!);
        const interval = setInterval(() => {
          const p = getPuter();
          if (p) {
            clearInterval(interval);
            resolve(p);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(interval);
          reject("Puter.js failed to load within 10s");
        }, 10000);
      });

      set({ puterReady: true });

      const isSignedIn = await puter.auth.isSignedIn();
      if (isSignedIn) {
        const user = await puter.auth.getUser();
        updateUser(user);
      } else {
        const saved = localStorage.getItem("currentUser");
        updateUser(saved ? JSON.parse(saved) : null);
      }
    } catch (err) {
      setError(typeof err === "string" ? err : "Failed to init Puter");
    }
  };

  // --- FS / AI / KV helpers ---
  const write = async (path: string, data: string | File | Blob) => getPuter()?.fs.write(path, data);
  const readDir = async (path: string) => getPuter()?.fs.readdir(path);
  const readFile = async (path: string) => getPuter()?.fs.read(path);
  const upload = async (files: File[] | Blob[]) => getPuter()?.fs.upload(files);
  const deleteFile = async (path: string) => getPuter()?.fs.delete(path);
  const chat = async (
    prompt: string | ChatMessage[],
    imageURL?: string | PuterChatOptions,
    testMode?: boolean,
    options?: PuterChatOptions
  ) => getPuter()?.ai.chat(prompt, imageURL, testMode, options) as Promise<AIResponse | undefined>;
  const feedback = async (path: string, message: string) =>
    getPuter()?.ai.chat([{ role: "user", content: [{ type: "file", puter_path: path }, { type: "text", text: message }] }], { model: "claude-3-7-sonnet" }) as Promise<AIResponse | undefined>;
  const img2txt = async (image: string | File | Blob, testMode?: boolean) => getPuter()?.ai.img2txt(image, testMode);

  const getKV = async (key: string) => getPuter()?.kv.get(key);
  const setKV = async (key: string, value: string) => getPuter()?.kv.set(key, value);
  const deleteKV = async (key: string) => getPuter()?.kv.delete?.(key);
  const listKV = async (pattern: string, returnValues?: boolean) => getPuter()?.kv.list(pattern, returnValues);
  const flushKV = async () => getPuter()?.kv.flush();

  return {
    isLoading: true,
    error: null,
    puterReady: false,
    auth: {
      user: null,
      isAuthenticated: false,
      signIn,
      signOut,
      refreshUser,
      checkAuthStatus,
      getUser: () => get().auth.user,
      setUser: (u: PuterUser | null) => updateUser(u),
    },
    fs: { write, read: readFile, readDir, upload, delete: deleteFile },
    ai: { chat, feedback, img2txt },
    kv: { get: getKV, set: setKV, delete: deleteKV, list: listKV, flush: flushKV },
    init,
    clearError: () => set({ error: null }),
  };
});
