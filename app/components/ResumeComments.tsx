import { useState } from "react";
import type { Resume, PuterUser, Comment } from "../../types";

interface Props {
  resume: Resume;
  currentUser: PuterUser;
  onUpdate: (updatedResume: Resume) => void;
}

const ResumeComments = ({ resume, currentUser, onUpdate }: Props) => {
  const [newComment, setNewComment] = useState("");
  const [newInternalNote, setNewInternalNote] = useState(resume.internalNotes || "");

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      userId: currentUser.id,
      username: currentUser.name || currentUser.email || "Unknown",
      text: newComment,
      createdAt: new Date().toISOString(),
    };
    const updatedResume = { ...resume, comments: [...(resume.comments || []), comment] };
    onUpdate(updatedResume);
    setNewComment("");
  };

  const handleUpdateInternalNote = () => {
    const updatedResume = { ...resume, internalNotes: newInternalNote };
    onUpdate(updatedResume);
  };

  return (
    <div className="mt-4 p-4 border rounded bg-gray-50">
      <h3 className="font-semibold mb-2">Notes et Commentaires</h3>

      {(resume.comments || []).map((c, i) => (
        <div key={i} className="p-2 border rounded bg-white mb-1">
          <strong>{c.username}</strong>{" "}
          <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString()}</span>
          <p>{c.text}</p>
        </div>
      ))}

      {currentUser.role !== "Viewer" && (
        <>
          <textarea
            className="w-full border rounded p-2 mb-2"
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4" onClick={handleAddComment}>
            Ajouter
          </button>
        </>
      )}

      {(currentUser.role === "RH" || currentUser.role === "Manager") && (
        <div className="mt-4">
          <h4 className="font-semibold mb-1">Notes internes</h4>
          <textarea
            className="w-full border rounded p-2 mb-2"
            value={newInternalNote}
            onChange={(e) => setNewInternalNote(e.target.value)}
          />
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleUpdateInternalNote}>
            Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
};

export default ResumeComments;
