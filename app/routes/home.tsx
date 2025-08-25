import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import ResumeCard from "../components/ResumeCard";
import { usePuterStore } from "../lib/puter";
import { Link, useNavigate } from "react-router";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "VibeHire" },
    { name: "description", content: "Smart feedback for resumes !" },
  ];
}

export default function Home() {
  const { auth, kv, fs, isLoading } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);

  // 🔎 Filtres
  const [searchName, setSearchName] = useState("");
  const [searchDate, setSearchDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const resumesPerPage = 3;

  // 🔄 Chargement des CVs
  const loadResumes = async () => {
    setLoadingResumes(true);
    try {
      const list = (await kv.list("resume:*", true)) as KVItem[] | undefined;

      const parsed = list
        ?.map((item) => {
          try {
            return JSON.parse(item.value) as Resume;
          } catch (err) {
            console.warn("Impossible de parser ce CV :", item.key, err);
            return null;
          }
        })
        .filter((r): r is Resume => r !== null) ?? [];

      setResumes(parsed);
      setCurrentPage(1); // reset page à chaque rechargement
    } catch (err) {
      console.error("Erreur lors du chargement des CV :", err);
    } finally {
      setLoadingResumes(false);
    }
  };

  // ✅ Redirection si non authentifié
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/");
    }
  }, [isLoading, auth.isAuthenticated, navigate]);

  // 🔄 Chargement initial des CVs
  useEffect(() => {
    if (auth.isAuthenticated) loadResumes();
  }, [auth.isAuthenticated, kv]);

  // 🗑️ Supprimer un CV
  const handleDeleteResume = async (id: string) => {
    if (!confirm("Supprimer ce CV ? Cette action est irréversible.")) return;

    try {
      const raw = await kv.get(`resume:${id}`);
      const data = raw
        ? (JSON.parse(raw) as Resume & { resumePath?: string; imagePath?: string })
        : null;

      await kv.set(`resume:${id}`, ""); // efface la valeur

      if (data?.resumePath)
        await fs.delete(data.resumePath).catch(() => console.warn("Impossible de supprimer le PDF"));
      if (data?.imagePath)
        await fs.delete(data.imagePath).catch(() => console.warn("Impossible de supprimer l’image"));

      await loadResumes();
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      alert("Erreur lors de la suppression.");
    }
  };

  // 🔍 Filtrage
  const filteredResumes = resumes.filter((resume) => {
    const matchName = searchName
      ? resume.candidateName?.toLowerCase().includes(searchName.toLowerCase())
      : true;

    const matchDate = searchDate
      ? new Date(resume.issuedAt).toISOString().slice(0, 10) === searchDate
      : true;

    return matchName && matchDate;
  });

  // Pagination après filtre
  const indexOfLastResume = currentPage * resumesPerPage;
  const indexOfFirstResume = indexOfLastResume - resumesPerPage;
  const currentResumes = filteredResumes.slice(indexOfFirstResume, indexOfLastResume);
  const totalPages = Math.ceil(filteredResumes.length / resumesPerPage);

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16 text-center">
          <h1 className="text-3xl font-bold">Track Your Best Candidates & Resume Ratings</h1>
          {!loadingResumes && resumes.length === 0 ? (
            <h2 className="mt-2 text-gray-600">
              No resumes found. Upload your first resume to get feedback.
            </h2>
          ) : (
            <h2 className="mt-2 text-gray-600">
              Review your applications and check AI-powered feedback.
            </h2>
          )}
        </div>

        {/* 🔍 Zone de recherche */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-6">
          <input
            type="text"
            placeholder="Search by candidate name..."
            value={searchName}
            onChange={(e) => {
              setSearchName(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="date"
            value={searchDate}
            onChange={(e) => {
              setSearchDate(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
        )}

        {!loadingResumes && filteredResumes.length > 0 && (
          <>
            <div className="resumes-section grid gap-6 md:grid-cols-1 lg:grid-cols-3">
              {currentResumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onDelete={() => handleDeleteResume(resume.id)}
                />
              ))}
            </div>

            {/* ✅ Nouvelle Pagination Moderne */}
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
