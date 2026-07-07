export interface KeywordMatch {
  keyword: string;
  matched: boolean;
}

export interface GenerationResult {
  matchScore: number;
  generatedText: string;
  keywords: KeywordMatch[];
  strengths: string[];
  gaps: string[];
  detectedLanguage: string; // "es" or "en"
}

export interface CVFileState {
  name: string;
  size: number;
  type: string;
  textData?: string;
  base64Data?: string;
}

export interface Vacancy {
  title: string;
  company: string;
  location: string;
  lang: "es" | "en";
  matchScore: number;
  description: string;
  requirements: string;
<<<<<<< HEAD
  platform?: "LinkedIn" | "Upwork";
  sourceApi?: string;
  recruiterEmail?: string;
=======
  platform?: "LinkedIn" | "Upwork" | "Indeed";
  autoApplied?: boolean;
  applied?: boolean;
  gapAnalysis?: {
    missingSkills: string[];
    reason: string;
  };
>>>>>>> 1742d16c17d75e6b70e636f44838e48de8d81b58
}

export type OutputFormat = "cover-letter" | "cold-email";
