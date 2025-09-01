import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import fileSaver from "file-saver";
const { saveAs } = fileSaver;

const pdfStyles = StyleSheet.create({
  page: { padding: 25, fontFamily: "Helvetica", backgroundColor: "#fff" },
  header: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  sectionHeader: { fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 8 },
  scoreContainer: { marginBottom: 10 },
  scoreBar: { height: 12, borderRadius: 6, marginBottom: 5 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3 },
  tipIcon: { marginRight: 6, fontSize: 12 },
  tipText: { fontSize: 12 },
  tipList: { marginLeft: 12 },
});

const getScoreColor = (score: number) =>
  score >= 80 ? "#4caf50" : score >= 50 ? "#ff9800" : "#f44336";

type Category = {
  score: number;
  tips: { type: "good" | "improve"; tip: string; explanation?: string }[];
};

const FeedbackPDF = ({ feedback, candidateName }: { feedback: Feedback; candidateName: string }) => {
  const categories: [string, Category | undefined][] = [
    ["ATS Feedback", feedback.ATS],
    ["Tone & Style", feedback.toneAndStyle],
    ["Content", feedback.content],
    ["Structure", feedback.structure],
    ["Skills", feedback.skills],
  ];

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.header}>Resume Review - {candidateName}</Text>
        <Text style={{ marginBottom: 15 }}>Overall Score: {feedback.overallScore || 0}/100</Text>

        {categories.map(([title, category], idx) => (
          <View key={idx} style={{ marginBottom: 20 }}>
            <Text style={pdfStyles.sectionHeader}>{title}</Text>
            {category && (
              <>
                <View style={pdfStyles.scoreContainer}>
                  <View
                    style={[
                      pdfStyles.scoreBar,
                      { width: `${category.score}%`, backgroundColor: getScoreColor(category.score) },
                    ]}
                  />
                  <Text>Score: {category.score}/100</Text>
                </View>
                <View style={pdfStyles.tipList}>
                  {category.tips.map((tip, tIdx) => {
                    const explanationText = tip.explanation ? ` (${tip.explanation})` : "";
                    return (
                      <View style={pdfStyles.tipRow} key={tIdx}>
                        <Text style={pdfStyles.tipIcon}>{tip.type === "good" ? "✔" : "⚠"}</Text>
                        <Text style={pdfStyles.tipText}>- {tip.tip}{explanationText}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        ))}
      </Page>
    </Document>
  );
};

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [candidateName, setCandidateName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated)
      navigate(`/auth?next=/resume/${id}`);
  }, [isLoading]);

  useEffect(() => {
    const loadResume = async () => {
      const resume = await kv.get(`resume:${id}`);
      if (!resume) return;

      const data: Resume = JSON.parse(resume);

      setCandidateName(data.candidateName || "");

      const resumeBlob = await fs.read(data.resumePath);
      if (resumeBlob)
        setResumeUrl(URL.createObjectURL(new Blob([resumeBlob], { type: "application/pdf" })));

      const imageBlob = await fs.read(data.imagePath);
      if (imageBlob) setImageUrl(URL.createObjectURL(imageBlob));

      // ✅ Normalisation en cas de data corrompue
      setFeedback({
        overallScore: data.feedback?.overallScore || 0,
        ATS: data.feedback?.ATS || { score: 0, tips: [] },
        toneAndStyle: data.feedback?.toneAndStyle || { score: 0, tips: [] },
        content: data.feedback?.content || { score: 0, tips: [] },
        structure: data.feedback?.structure || { score: 0, tips: [] },
        skills: data.feedback?.skills || { score: 0, tips: [] },
      });
    };
    loadResume();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!feedback) return;
    const blob = await pdf(<FeedbackPDF feedback={feedback} candidateName={candidateName} />).toBlob();
    saveAs(blob, `resume-feedback-${id}.pdf`);
  };

  return (
    <main className="!pt-0 min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>

      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg')] bg-cover h-[100vh] sticky top-0 flex items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-w-xl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={imageUrl}
                  className="w-full h-full object-contain rounded-2xl shadow-lg"
                  title="resume"
                />
              </a>
            </div>
          )}
        </section>

        <section className="feedback-section p-8">
          <h2 className="text-4xl !text-black font-bold mb-6">
            Resume Review - {candidateName}
          </h2>
          {feedback ? (
            <>
              <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                <Summary feedback={feedback} />
                <ATS score={feedback.ATS?.score || 0} suggestions={feedback.ATS?.tips || []} />
                <Details feedback={feedback} />
              </div>

              <div className="mt-6">
                <button
                  onClick={handleDownloadPDF}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Export Feedback as PDF
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center">
              <img src="/images/resume-scan-2.gif" className="w-48" />
              <p className="mt-4 text-gray-600">Analyzing your resume...</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default Resume;
