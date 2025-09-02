import ScoreCircle from "../components/ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { Trash2, Edit2, PlusCircle, Check } from "lucide-react";
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

const ResumeCard = ({ resume, onDelete, reloadResumes }: Props) => {
  const { fs, kv, auth } = usePuterStore();
  const [imageUrl, setImageUrl] = useState<string>("");
  const [stage, setStage] = useState<Resume["stage"]>(resume.stage ?? "received");
  const [comments, setComments] = useState<Comment[]>(resume.comments ?? []);
  const [newComment, setNewComment] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  const { id, companyName, jobTitle, candidateName, feedback, imagePath, issuedAt } = resume;

  const canEditComments = auth.user?.role === "RH" || auth.user?.role === "Manager";

  useEffect(() => {
    const loadImage = async () => {
      if (!imagePath) return;
      try {
        const blob = await fs.read(imagePath);
        if (blob) setImageUrl(URL.createObjectURL(new Blob([blob])));
      } catch (err) {
        console.error("Erreur lors du chargement de l’image :", err);
      }
    };
    loadImage();
  }, [imagePath, fs]);

  const handleStageChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    const newStage = e.target.value as Resume["stage"];
    try {
      setStage(newStage);
      const updatedResume = { ...resume, stage: newStage };
      await kv.set(`resume:${id}`, JSON.stringify(updatedResume));
      reloadResumes?.();
    } catch {
      alert("Impossible de mettre à jour le stage !");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      userId: auth.user?.uuid ?? "unknown",
      username: auth.user?.username ?? "Anonymous",
      text: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    setNewComment("");

    try {
      const updatedResume = { ...resume, comments: updatedComments };
      await kv.set(`resume:${id}`, JSON.stringify(updatedResume));
      reloadResumes?.();
    } catch (err) {
      console.error("Erreur lors de l’ajout du commentaire :", err);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingText(comments[index].text);
  };

  const saveEdit = async (index: number) => {
    const updatedComments = [...comments];
    updatedComments[index].text = editingText;
    setComments(updatedComments);
    setEditingIndex(null);
    setEditingText("");

    try {
      const updatedResume = { ...resume, comments: updatedComments };
      await kv.set(`resume:${id}`, JSON.stringify(updatedResume));
      reloadResumes?.();
    } catch (err) {
      console.error("Erreur lors de la modification du commentaire :", err);
    }
  };

  const handleDeleteComment = async (index: number) => {
    if (!canEditComments) return;
    if (!confirm("Supprimer ce commentaire ?")) return;

    const updatedComments = comments.filter((_, i) => i !== index);
    setComments(updatedComments);

    try {
      const updatedResume = { ...resume, comments: updatedComments };
      await kv.set(`resume:${id}`, JSON.stringify(updatedResume));
      reloadResumes?.();
    } catch (err) {
      console.error("Erreur lors de la suppression du commentaire :", err);
    }
  };

  const formattedDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
    : null;

  const safeStage: Resume["stage"] = stage ?? "received";

  return (
    <div className="resume-card relative flex flex-col rounded-2xl shadow-xl bg-white overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1 max-w-sm md:max-w-md lg:max-w-lg">
      {imageUrl && (
        <Link to={`/resume/${id}`} className="relative overflow-hidden max-h-72 sm:max-h-80 md:max-h-96 lg:max-h-[28rem]">
          <img
            src={imageUrl}
            alt="resume"
            className="w-full h-full object-cover object-top transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/25 flex flex-col justify-between p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="flex justify-between items-center">
              <ScoreCircle score={feedback?.overallScore ?? 0} />
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stageColors[safeStage]}`}>
                {safeStage.charAt(0).toUpperCase() + safeStage.slice(1)}
              </span>
            </div>
          </div>
        </Link>
      )}

      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold text-gray-900">{candidateName}</h2>
          {onDelete && (
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow hover:bg-red-100 text-red-600 transition"
              title="Delete Resume"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        {companyName && <p className="text-sm text-gray-600"><span className="font-medium">Company:</span> {companyName}</p>}
        {jobTitle && <p className="text-sm text-gray-600"><span className="font-medium">Job Title:</span> {jobTitle}</p>}
        {formattedDate && <p className="text-xs text-gray-400 italic">Issued on {formattedDate}</p>}

        <div className="mt-2">
          <select
            value={safeStage}
            onChange={handleStageChange}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-white cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="received">Received</option>
            <option value="preselection">Pre-selection</option>
            <option value="test">Test</option>
            <option value="interview">Interview</option>
            <option value="decision">Decision</option>
          </select>
        </div>

        <div className="mt-4 border-t pt-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Comments</h3>
          {comments.length === 0 && <p className="text-gray-400 text-sm italic">No comments yet.</p>}

          <ul className="max-h-52 overflow-y-auto mb-2">
            {comments.map((c, i) => (
              <li key={i} className="text-sm text-gray-800 border-b py-1 flex justify-between items-center">
                <div className="flex flex-col md:flex-row md:items-center md:gap-2 flex-1">
                  <span className="font-medium">{c.username}:</span>
                  {editingIndex === i ? (
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="px-2 py-1 border-b border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 flex-1"
                    />
                  ) : (
                    <span>{c.text}</span>
                  )}
                  <span className="text-gray-400 text-xs ml-2">({new Date(c.createdAt).toLocaleDateString()})</span>
                </div>

                {canEditComments && (
                  <div className="flex gap-1 ml-2">
                    {editingIndex === i ? (
                      <button
                        onClick={() => saveEdit(i)}
                        title="Save Comment"
                        className="text-green-600 hover:text-green-800 transition"
                      >
                        <Check size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditing(i)}
                        title="Edit Comment"
                        className="text-blue-600 hover:text-blue-800 transition"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteComment(i)}
                      title="Delete Comment"
                      className="text-red-600 hover:text-red-800 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {canEditComments && (
            <div className="flex flex-col md:flex-row gap-2 mt-1">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                onClick={handleAddComment}
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
};

export default ResumeCard;
