// types.ts

// Roles possibles
export type UserRole = "RH" | "Manager" | "Viewer";

// Utilisateur stocké dans Puter (provenant de Puter.js)
export interface PuterUser {
  id: number;            // identifiant unique généré par Puter (number)
  name?: string;         // nom d'affichage
  email?: string;        // email optionnel
  role?: UserRole;       // rôle optionnel pour éviter TS2345
  token?: string;        // token optionnel pour compatibilité avec localStorage
}

// Utilisateur "CurrentUser" utilisé dans l'app React
export interface CurrentUser {
  id: number;            // mappé depuis PuterUser.id
  username?: string;     // mappé depuis PuterUser.name
  email?: string;
  role?: UserRole | null;
  token?: string;
}

// KVItem pour le stockage clé/valeur
export interface KVItem {
  key: string;
  value: string;
}

// Commentaire sur un CV
export interface Comment {
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

// Tips de feedback
export interface FeedbackTip {
  type: "good" | "improve";
  tip: string;
  explanation?: string;
}

// Catégorie de feedback
export interface FeedbackCategory {
  score: number;
  tips: FeedbackTip[];
}

// Feedback complet sur un CV
export interface Feedback {
  overallScore: number;
  ATS: FeedbackCategory;
  toneAndStyle: FeedbackCategory;
  content: FeedbackCategory;
  structure: FeedbackCategory;
  skills: FeedbackCategory;
}

// CV (Resume)
export interface Resume {
  id: string;
  candidateName?: string;
  companyName?: string;
  jobTitle?: string;
  imagePath?: string;
  resumePath?: string;
  feedback?: Feedback;
  issuedAt: string;
  stage?: "received" | "preselection" | "test" | "interview" | "decision";
  comments?: Comment[];
  internalNotes?: string;
}
