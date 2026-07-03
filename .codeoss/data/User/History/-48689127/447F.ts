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
  platform?: string;
  sourceApi?: string;
  recruiterEmail: string;
}

export type OutputFormat = "cover-letter" | "cold-email";
