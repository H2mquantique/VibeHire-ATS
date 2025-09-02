export type UserRole = "RH" | "Manager" | "Viewer";

export interface PuterUser {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
}

export interface KVItem {
  key: string;
  value: string;
}

export interface Comment {
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface FeedbackTip {
  type: "good" | "improve";
  tip: string;
  explanation?: string;
}

export interface FeedbackCategory {
  score: number;
  tips: FeedbackTip[];
}

export interface Feedback {
  overallScore: number;
  ATS: FeedbackCategory;
  toneAndStyle: FeedbackCategory;
  content: FeedbackCategory;
  structure: FeedbackCategory;
  skills: FeedbackCategory;
}

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
