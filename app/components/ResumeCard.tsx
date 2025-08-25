import { Link } from "react-router";
import ScoreCircle from "../components/ScoreCircle";
import { useEffect, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import { Trash2 } from "lucide-react";

type Props = {
  resume: Resume;
  onDelete?: () => void;
};

const ResumeCard = ({ resume, onDelete }: Props) => {
  const { fs } = usePuterStore();
  const [imageUrl, setImageUrl] = useState<string>("");

  const { id, companyName, jobTitle, candidateName, feedback, imagePath, issuedAt } = resume;

  // ✅ Charger l’image depuis puter
  useEffect(() => {
    const loadImage = async () => {
      if (!imagePath) return;
      try {
        const blob = await fs.read(imagePath);
        if (blob) {
          const url = URL.createObjectURL(new Blob([blob]));
          setImageUrl(url);
        }
      } catch (err) {
        console.error("Erreur lors du chargement de l’image :", err);
      }
    };
    loadImage();
  }, [imagePath, fs]);

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  // ✅ Format court de la date (25 Aug 2025)
  const formattedDate = issuedAt
    ? new Date(issuedAt).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : null;

  return (
    <div className="resume-card animate-in fade-in duration-700 relative block rounded-2xl shadow-lg bg-white overflow-hidden hover:shadow-2xl transition transform hover:-translate-y-1">
      {/* Bouton corbeille en haut à droite */}
      {onDelete && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow hover:bg-red-100 text-red-600 transition"
        >
          <Trash2 size={18} />
        </button>
      )}

      <Link to={`/resume/${id}`} className="block">
        {/* Header */}
        <div className="flex justify-between items-start p-4 border-b">
          <div className="flex flex-col gap-1">
            {candidateName && (
              <h2 className="text-lg font-semibold text-gray-900">{candidateName}</h2>
            )}
            {companyName && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Company:</span> {companyName}
              </p>
            )}
            {jobTitle && (
              <p className="text-sm text-gray-600">
                <span className="font-medium">Job Title:</span> {jobTitle}
              </p>
            )}
            {formattedDate && (
              <p className="text-xs text-gray-400 italic">Issued on {formattedDate}</p>
            )}
          </div>
          <div className="flex-shrink-0">
            <ScoreCircle score={feedback.overallScore} />
          </div>
        </div>

        {/* Image */}
        {imageUrl && (
          <div className="gradient-border">
            <img
              src={imageUrl}
              alt="resume"
              className="w-full h-[280px] sm:h-[320px] object-cover object-top transition-transform duration-500 hover:scale-105"
            />
          </div>
        )}
      </Link>
    </div>
  );
};

export default ResumeCard;
