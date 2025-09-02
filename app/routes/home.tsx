// Home.tsx
import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard from "../components/ResumeCard";
import { usePuterStore } from "../lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import type { Resume, KVItem, PuterUser } from "../../types";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "VibeHire" },
    { name: "description", content: "Smart feedback for resumes !" },
  ];
}

// ✅ Type guard pour TS : vérifie si l'élément est bien un KVItem
function isKVItem(item: unknown): item is KVItem {
  return typeof item === "object" && item !== null && "value" in item;
}

export default function Home() {
  const { auth, kv, fs, isLoading } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // Filtres
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchStage, setSearchStage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const resumesPerPage = 3;

  // --- Chargement des CV ---
  const loadResumes = async () => {
    setLoadingResumes(true);
    try {
      const list = (await kv.list("resume:*", true)) as (string | KVItem)[] | undefined;

      const parsed =
        list
          ?.map((item) => {
            if (!isKVItem(item)) return null;
            try {
              return JSON.parse(item.value) as Resume;
            } catch {
              return null;
            }
          })
          .filter((r): r is Resume => r !== null) ?? [];

      setResumes(parsed);
      setCurrentPage(1);
    } finally {
      setLoadingResumes(false);
    }
  };

  // --- Redirection si non authentifié ---
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) navigate("/auth?next=/");
  }, [isLoading, auth.isAuthenticated, navigate]);

  useEffect(() => {
    if (auth.isAuthenticated) loadResumes();
  }, [auth.isAuthenticated, kv]);

  // --- Supprimer un CV ---
  const handleDeleteResume = async (id: string) => {
    if (!confirm("Supprimer ce CV ?")) return;
    const raw = await kv.get(`resume:${id}`);

    const data =
      raw && isKVItem(raw)
        ? (JSON.parse(raw.value) as Resume & { resumePath?: string; imagePath?: string })
        : null;

    await kv.set(`resume:${id}`, "");

    if (data?.resumePath) await fs.delete(data.resumePath).catch(() => {});
    if (data?.imagePath) await fs.delete(data.imagePath).catch(() => {});

    await loadResumes();
  };

  // --- Filtrage ---
  const filteredResumes = resumes.filter((resume) => {
    const matchName = searchName
      ? resume.candidateName?.toLowerCase().includes(searchName.toLowerCase())
      : true;
    const matchDate = searchDate
      ? new Date(resume.issuedAt).toISOString().slice(0, 10) === searchDate
      : true;
    const matchStage = searchStage ? resume.stage === searchStage : true;
    return matchName && matchDate && matchStage;
  });

  const indexOfLastResume = currentPage * resumesPerPage;
  const indexOfFirstResume = indexOfLastResume - resumesPerPage;
  const currentResumes = filteredResumes.slice(indexOfFirstResume, indexOfLastResume);
  const totalPages = Math.ceil(filteredResumes.length / resumesPerPage);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      {/* Navbar + Logout */}
      <div className="flex justify-between items-center px-6 pt-4">
        <Navbar />
        {auth.isAuthenticated && (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 font-semibold bg-gray-100 px-3 py-1 rounded-full shadow-sm">
              Role: <span className="text-blue-600">{auth.user?.role ?? "Viewer"}</span>
            </span>
            <button
              className="px-4 py-2 bg-red-600 text-white rounded-xl shadow hover:bg-red-700 transition"
              onClick={() => {
                if (auth.signOut) {
                  auth.signOut();
                } else {
                  (auth as any).user = null as PuterUser | null;
                  (auth as any).isAuthenticated = false;
                  navigate("/auth?next=/");
                }
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      <section className="main-section">
        <div className="page-heading py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Track Your Best Candidates & Resume Ratings
          </h1>
          {!loadingResumes && resumes.length === 0 ? (
            <h2 className="mt-2 text-gray-600">
              No resumes found. Upload your first resume to get feedback.
            </h2>
          ) : (
            <h2 className="mt-2 text-gray-600">
              Review your applications and check AI-powered feedback.
            </h2>
          )}

          <div className="flex justify-center gap-4 mt-6 flex-wrap">
            <Link
              to="/upload"
              className="px-5 py-3 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition"
            >
              Upload Resume
            </Link>
            <Link
              to="/compare"
              className="px-5 py-3 bg-green-600 text-white rounded-xl shadow hover:bg-green-700 transition"
            >
              Compare CVs
            </Link>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-10 px-4">
          <div className="relative w-full md:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
            <input
              type="text"
              placeholder="Search by candidate name..."
              value={searchName}
              onChange={(e) => {
                setSearchName(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
            />
          </div>

          <div className="relative w-full md:w-60">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">📅</span>
            <input
              type="date"
              value={searchDate}
              onChange={(e) => {
                setSearchDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
            />
          </div>

          <div className="relative w-full md:w-60">
            <select
              value={searchStage}
              onChange={(e) => {
                setSearchStage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-4 pr-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-gray-700"
            >
              <option value="">All Stages</option>
              <option value="received">Received</option>
              <option value="preselection">Pre-selection</option>
              <option value="test">Test</option>
              <option value="interview">Interview</option>
              <option value="decision">Decision</option>
            </select>
          </div>
        </div>

        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && filteredResumes.length > 0 && (
          <>
            <div className="resumes-section grid gap-6 md:grid-cols-1 lg:grid-cols-3 px-4">
              {currentResumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onDelete={() => handleDeleteResume(resume.id)}
                  reloadResumes={loadResumes}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="pagination flex items-center justify-center gap-2 mt-8 flex-wrap">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                «
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition shadow-sm ${
                    page === currentPage
                      ? "bg-blue-600 text-white shadow-md scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-blue-500 hover:text-white"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                »
              </button>
            </div>
          </>
        )}

        {!loadingResumes && filteredResumes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <p className="text-gray-600">No results match your search.</p>
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
