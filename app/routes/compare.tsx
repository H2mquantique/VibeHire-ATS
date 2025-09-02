import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { usePuterStore } from "../lib/puter";
import ResumeCard from "../components/ResumeCard";
import { useNavigate } from "react-router";
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
// ⚠️ Vite + CommonJS : on importe le défaut puis on destructure
import pkg from "file-saver";
const { saveAs } = pkg;

type Tip = {
  type: "good" | "improve";
  tip: string;
  explanation?: string;
};
type CategoryBlock = { score: number; tips: Tip[] };
type CategoryKey = "ATS" | "toneAndStyle" | "content" | "structure" | "skills";

const categories: CategoryKey[] = ["ATS", "toneAndStyle", "content", "structure", "skills"];
const getScoreColor = (score: number) =>
  score >= 80 ? "#16a34a" : score >= 50 ? "#f59e0b" : "#ef4444";

const pdfStyles = StyleSheet.create({
  page: { padding: 20, fontFamily: "Helvetica", backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  subtitle: { fontSize: 12, textAlign: "center", color: "#6b7280", marginBottom: 12 },
  table: { display: "flex", flexDirection: "column", borderWidth: 1, borderColor: "#e5e7eb" },
  row: { display: "flex", flexDirection: "row" },
  th: { fontSize: 11, fontWeight: "bold", backgroundColor: "#f3f4f6", padding: 6, borderRightWidth: 1, borderColor: "#e5e7eb" },
  td: { fontSize: 10, padding: 6, borderTopWidth: 1, borderRightWidth: 1, borderColor: "#e5e7eb" },
  cellCategory: { width: "28%" },
  cellCandidate: { width: "36%" },
  scoreText: { fontSize: 10, fontWeight: "bold" },
  tipLine: { fontSize: 9, marginTop: 2 },
  badge: { fontSize: 11, fontWeight: "bold", padding: 6, backgroundColor: "#ecfeff", borderLeftWidth: 4, borderColor: "#06b6d4", marginTop: 14 },
  recommend: { fontSize: 11, padding: 8, backgroundColor: "#e6ffed", borderLeftWidth: 4, borderColor: "#34d399", marginTop: 10 },
});

const ComparePDF = ({ selected }: { selected: Resume[] }) => {
  const [left, right] = selected;

  const readCategory = (fb: Feedback, key: CategoryKey): { score: number; tips: Tip[] } => {
    const block = fb[key] as unknown as CategoryBlock | number | undefined;
    if (!block) return { score: 0, tips: [] };
    if (typeof block === "number") return { score: block, tips: [] };
    return { score: block.score ?? 0, tips: Array.isArray(block.tips) ? block.tips : [] };
  };

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>Resume Comparison</Text>
        <Text style={pdfStyles.subtitle}>
          {left.jobTitle} @ {left.companyName} — {left.candidateName} vs {right.candidateName}
        </Text>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.row}>
            <Text style={[pdfStyles.th, pdfStyles.cellCategory]}>Catégorie</Text>
            <Text style={[pdfStyles.th, pdfStyles.cellCandidate]}>{left.candidateName} (Overall {left.feedback.overallScore}/100)</Text>
            <Text style={[pdfStyles.th, pdfStyles.cellCandidate]}>{right.candidateName} (Overall {right.feedback.overallScore}/100)</Text>
          </View>

          {categories.map((cat) => {
            const l = readCategory(left.feedback, cat);
            const r = readCategory(right.feedback, cat);
            return (
              <View key={cat} style={pdfStyles.row}>
                <Text style={[pdfStyles.td, pdfStyles.cellCategory]}>{cat}</Text>
                <View style={[pdfStyles.td, pdfStyles.cellCandidate]}>
                  <Text style={[pdfStyles.scoreText, { color: getScoreColor(l.score) }]}>{l.score}/100</Text>
                  {l.tips.slice(0, 5).map((tip, idx) => (
                    <Text key={idx} style={pdfStyles.tipLine}>
                      {tip.type === "good" ? "✔" : "⚠"} {tip.tip} {tip.explanation ? `(${tip.explanation})` : ""}
                    </Text>
                  ))}
                </View>
                <View style={[pdfStyles.td, pdfStyles.cellCandidate]}>
                  <Text style={[pdfStyles.scoreText, { color: getScoreColor(r.score) }]}>{r.score}/100</Text>
                  {r.tips.slice(0, 5).map((tip, idx) => (
                    <Text key={idx} style={pdfStyles.tipLine}>
                      {tip.type === "good" ? "✔" : "⚠"} {tip.tip} {tip.explanation ? `(${tip.explanation})` : ""}
                    </Text>
                  ))}
                </View>
              </View>
            );
          })}
        </View>

        <Text style={pdfStyles.badge}>Poste : {left.jobTitle} — Entreprise : {left.companyName}</Text>
        {left && right && (
          <Text style={pdfStyles.recommend}>
            Recommandation : {left.feedback.overallScore >= right.feedback.overallScore ? left.candidateName : right.candidateName} est le meilleur choix
            (score global {Math.max(left.feedback.overallScore, right.feedback.overallScore)}/100).
          </Text>
        )}
      </Page>
    </Document>
  );
};

export default function Compare() {
  const { kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selected, setSelected] = useState<Resume[]>([]);
  const [recommended, setRecommended] = useState<Resume | null>(null);

  const [page, setPage] = useState(1);
  const perPage = 3;
  const totalPages = Math.ceil(resumes.length / perPage);
  const paginatedResumes = resumes.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    const load = async () => {
      try {
        const list = (await kv.list("resume:*", true)) as KVItem[] | undefined;
        const parsed =
          list
            ?.map((item) => {
              try {
                return JSON.parse(item.value) as Resume;
              } catch {
                return null;
              }
            })
            .filter((r): r is Resume => r !== null) ?? [];
        setResumes(parsed);
      } catch (err) {
        console.error("Erreur lors du chargement :", err);
      }
    };
    load();
  }, [kv]);

  const toggleSelect = (resume: Resume) => {
    setSelected((prev) => {
      const exists = prev.find((r) => r.id === resume.id);
      if (exists) return prev.filter((r) => r.id !== resume.id);
      if (prev.length === 1) {
        const first = prev[0];
        if (first.jobTitle !== resume.jobTitle || first.companyName !== resume.companyName) {
          alert("Vous ne pouvez comparer que des CV pour le même poste ET la même entreprise.");
          return prev;
        }
      }
      if (prev.length < 2) return [...prev, resume];
      alert("Vous ne pouvez comparer que 2 CV à la fois.");
      return prev;
    });
  };

  useEffect(() => {
    if (selected.length === 2) {
      const best = selected[0].feedback.overallScore >= selected[1].feedback.overallScore ? selected[0] : selected[1];
      setRecommended(best);
    } else {
      setRecommended(null);
    }
  }, [selected]);

  const canExport = selected.length === 2;
  const handleDownloadPDF = async () => {
    if (!canExport) return;
    const blob = await pdf(<ComparePDF selected={selected} />).toBlob();
    saveAs(blob, "resume-comparison.pdf");
  };

  return (
    <main className="min-h-screen bg-[url('/images/bg-main.svg')] bg-cover p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compare Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">
            {selected[0]?.jobTitle && selected[0]?.companyName
              ? `${selected[0].jobTitle} @ ${selected[0].companyName}`
              : "Choisissez des CV du même poste et de la même entreprise"}
          </p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <button
            onClick={() => navigate("/")}
            className="px-3 md:px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-gray-800 shadow-sm"
          >
            ← Retour
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={!canExport}
            className={`px-3 md:px-4 py-2 rounded-lg text-white shadow ${
              canExport ? "bg-green-600 hover:bg-green-700" : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Exporter PDF
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-dashed border-cyan-300 bg-cyan-50 p-3 text-cyan-900 text-sm">
        Astuce : cliquez sur deux cartes “résumé”. Vous ne pourrez sélectionner que des CV du <strong>même Job Title</strong> et de la <strong>même Company</strong>.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {paginatedResumes.map((resume) => {
          const isSelected = selected.some((r) => r.id === resume.id);
          return (
            <motion.div
              key={resume.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`relative rounded-2xl border-4 ${
                isSelected ? "border-blue-500" : "border-transparent"
              } hover:shadow-lg cursor-pointer bg-white`}
              onClick={() => toggleSelect(resume)}
            >
              <ResumeCard resume={resume} />
              {isSelected && (
                <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs shadow">
                  Selected
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ✅ Pagination style Home page */}
      {totalPages > 1 && (
        <div className="pagination flex items-center justify-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            «
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition shadow-sm ${
                p === page
                  ? "bg-blue-600 text-white shadow-md scale-105"
                  : "bg-gray-100 text-gray-700 hover:bg-blue-500 hover:text-white"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-full bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            »
          </button>
        </div>
      )}

      {selected.length === 2 && (
        <>
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-4">
              <ResumeCard resume={selected[0]} />
              <span className="font-bold text-xl text-gray-700">VS</span>
              <ResumeCard resume={selected[1]} />
            </div>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full table-auto border-collapse rounded-xl overflow-hidden">
              <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="border border-gray-200 px-3 py-2 text-left w-1/4">Catégorie</th>
                {selected.map((r) => (
                  <th key={r.id} className="border border-gray-200 px-3 py-2 text-left">
                    {r.candidateName} <span className="text-gray-500">(Overall {r.feedback.overallScore}/100)</span>
                  </th>
                ))}
              </tr>
              </thead>
              <tbody>
              {categories.map((cat) => (
                <tr key={cat} className="border-t border-gray-200 align-top">
                  <td className="border border-gray-200 px-3 py-2 font-medium bg-white">{cat}</td>
                  {selected.map((r) => {
                    const block = r.feedback[cat] as unknown as CategoryBlock | number | undefined;
                    const score = typeof block === "number" ? block : block?.score ?? 0;
                    const tips: Tip[] = typeof block === "number" ? [] : (block?.tips as Tip[]) ?? [];
                    return (
                      <td key={r.id} className="border border-gray-200 px-3 py-2 bg-white">
                        <div className="font-semibold" style={{ color: getScoreColor(score) }}>
                          Score&nbsp;: {score}/100
                        </div>
                        <ul className="mt-1 space-y-1 text-sm">
                          {tips.slice(0, 5).map((tip, idx) => (
                            <li key={idx} className="flex gap-1">
                              <span className="shrink-0">{tip.type === "good" ? "✔" : "⚠"}</span>
                              <span>
                                  {tip.tip} {tip.explanation && <em className="text-gray-500">({tip.explanation})</em>}
                                </span>
                            </li>
                          ))}
                          {tips.length === 0 && <li className="text-gray-400 italic">No tips</li>}
                        </ul>
                      </td>
                    );
                  })}
                </tr>
              ))}
              </tbody>
            </table>
          </div>

          {recommended && (
            <div className="mt-6 text-center bg-green-50 border border-green-200 p-4 rounded-xl">
              <h3 className="text-lg md:text-xl font-bold mb-1 text-green-800">CV Recommandé</h3>
              <p className="text-green-900">
                <strong>{recommended.candidateName}</strong> est le meilleur choix pour le poste de <strong>{recommended.jobTitle}</strong> chez <strong>{recommended.companyName}</strong> (score global&nbsp;: {recommended.feedback.overallScore}/100)
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
