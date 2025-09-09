import ScoreCircle from "../components/ScoreCircle";
import { useEffect, useState, memo } from "react";
import { usePuterStore } from "~/lib/puter";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router";
import type { Resume, Comment } from "../../types";

type Props = {
  resume: Resume;
  onDelete?: () => void;
  reloadResumes?: () => void;
};

const stageColors: Record<NonNullable<Resume["stage"]>, string> = {
  received: "bg-gray-100 text-gray-800",
  preselection: "bg-yellow-100 text-yellow-800",
  test: "bg-blue-100 text-blue-800",
  interview: "bg-indigo-100 text-indigo-800",
  decision: "bg-green-100 text-green-800",
};

const ResumeCard = memo(({ resume, onDelete, reloadResumes }: Props) => {
  const readFile = usePuterStore((s) => s.fs.read);
  const kvSet = usePuterStore((s) => s.kv.set);
  const user = usePuterStore((s) => s.auth.user);

  const [imageUrl, setImageUrl] = useState<string>("");
  const [stage, setStage] = useState<Resume["stage"]>(resume.stage ?? "received");
  const [comments, setComments] = useState<Comment[]>(resume.comments ?? []);
  const [newComment, setNewComment] = useState("");

  const { id, companyName, jobTitle, candidateName, feedback, imagePath, issuedAt } = resume;

  const canEditComments = user?.role === "RH" || user?.role === "Manager";
  const canEditStage = user?.role !== "Viewer";

  useEffect(() => {
    if (!imagePath) {
      setImageUrl("");
      return;
    }
    let url: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const blob = await readFile(imagePath);
        if (!blob || cancelled) return;
        url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error("Erreur image:", err);
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [imagePath, readFile]);

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!canEditStage) return;
    const newStage = e.target.value as Resume["stage"];
    setStage(newStage);
    try {
      await kvSet(`resume:${id}`, JSON.stringify({ ...resume, stage: newStage }));
      reloadResumes?.();
    } catch {
      alert("Impossible de mettre à jour le stage !");
    }
  };

  const formattedDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : null;

  const safeStage: Resume["stage"] = stage ?? "received";

  return (
    <div className="relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition w-full max-w-sm sm:max-w-md lg:max-w-lg h-full">
      {/* Image */}
      {imageUrl && (
        <Link to={`/resume/${id}`} className="block">
          <img
            src={imageUrl}
            alt={`${candidateName} resume`}
            className="w-full h-56 sm:h-64 object-cover object-top rounded-t-2xl"
          />
        </Link>
      )}

      {/* Contenu */}
      <div className="p-5 flex flex-col h-full">
        {/* Header avec Score + Stage */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{candidateName}</h2>
            {companyName && (
              <span className="block text-sm text-gray-700">
                <span className="font-medium">Company:</span> {companyName}
              </span>
            )}
            {jobTitle && (
              <span className="block text-sm text-gray-700">
                <span className="font-medium">Job:</span> {jobTitle}
              </span>
            )}
            {formattedDate && (
              <span className="text-xs text-gray-400 italic block">
                Issued {formattedDate}
              </span>
            )}
          </div>

          {/* Score + Stage */}
          <div className="flex flex-col items-end gap-2">
            <ScoreCircle score={feedback?.overallScore ?? 0} />
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${stageColors[safeStage]}`}
            >
              {safeStage.charAt(0).toUpperCase() + safeStage.slice(1)}
            </span>
          </div>
        </div>

        {/* Stage selector */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
          <select
            value={safeStage}
            onChange={handleStageChange}
            disabled={!canEditStage}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
          >
            <option value="received">Received</option>
            <option value="preselection">Pre-selection</option>
            <option value="test">Test</option>
            <option value="interview">Interview</option>
            <option value="decision">Decision</option>
          </select>
        </div>

        {/* Comments */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Comments</h3>
          <div className="flex-1 overflow-y-auto mb-3 px-1">
            {comments.length === 0 && (
              <p className="text-gray-400 text-sm italic">No comments yet.</p>
            )}
            <ul className="divide-y divide-gray-100">
              {comments.map((c, i) => (
                <li key={`${c.userId}-${i}`} className="py-2 text-sm text-gray-800">
                  <span className="font-medium">{c.username}:</span> {c.text}
                </li>
              ))}
            </ul>
          </div>

          {canEditComments && (
            <div className="flex gap-2 mt-auto">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={() => {
                  if (!newComment.trim()) return;
                  const newC = {
                    userId: user?.uuid ?? "unknown",
                    username: user?.username ?? "Anonymous",
                    text: newComment,
                    createdAt: new Date().toISOString(),
                  };
                  setComments([...comments, newC]);
                  setNewComment("");
                  kvSet(`resume:${id}`, JSON.stringify({ ...resume, comments: [...comments, newC] }));
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
              >
                <PlusCircle size={16} /> Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default ResumeCard;
