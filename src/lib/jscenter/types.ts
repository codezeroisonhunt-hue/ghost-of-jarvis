export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Competition Advanced";
export type ProjectType = "Physical" | "Software" | "Hybrid";

export interface ScienceProject {
  id: string;
  title: string;
  subject: string;
  category: string;
  difficulty: Difficulty;
  minClass: number; // 1..12 (11 = 1st PUC, 12 = 2nd PUC)
  maxClass: number;
  costMin: number;
  costMax: number;
  innovation: number; // 0-100
  type: ProjectType;
  ai: boolean;
  sensors: boolean;
  tags: string[];
  competition: string; // School / District / State / National
  days: number; // estimated build days
}

export const CLASS_LABELS: Record<number, string> = {
  1: "Class 1", 2: "Class 2", 3: "Class 3", 4: "Class 4", 5: "Class 5", 6: "Class 6",
  7: "Class 7", 8: "Class 8", 9: "Class 9", 10: "Class 10", 11: "1st PUC", 12: "2nd PUC",
};

export const SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Environmental Science", "General Science",
  "Mathematics", "Statistics", "Applied Mathematics",
  "Computer Science", "Artificial Intelligence", "Machine Learning", "Robotics", "IoT",
  "Electronics", "Cybersecurity", "Computer Vision",
  "Geography", "Agriculture", "Astronomy", "Health Science", "Energy",
  "Sustainable Development", "Engineering",
];

export const BUDGET_BANDS = [
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000 – ₹2,500", min: 1000, max: 2500 },
  { label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
  { label: "₹5,000+", min: 5000, max: 1000000 },
];

export const COMPETITION_LEVELS = ["School", "District", "State", "National"];

export const DIFFICULTY_META: Record<Difficulty, { dot: string; emoji: string }> = {
  Beginner: { dot: "bg-emerald-400", emoji: "🟢" },
  Intermediate: { dot: "bg-yellow-400", emoji: "🟡" },
  Advanced: { dot: "bg-orange-400", emoji: "🟠" },
  "Competition Advanced": { dot: "bg-red-400", emoji: "🔴" },
};
