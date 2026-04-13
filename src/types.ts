export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Flashcard {
  question: string;
  answer: string;
  difficulty: 1 | 2 | 3;
  hint?: string;
  source: string;
}

export type Complexity = 'basics' | 'clinical' | 'specialist';

export interface GenerationConfig {
  complexity: Complexity;
  depth: 'summary' | 'deep';
  focus: string; // e.g. "pathogenesis", "treatment", "all"
  language: 'uz' | 'ru' | 'en';
}

export interface MindMapNode {
  label: string;
  color: string;
  nodes: string[];
}

export interface MindMap {
  center: string;
  branches: MindMapNode[];
}

export interface PodcastLine {
  speaker: 'MENTOR' | 'EKSPERT';
  text: string;
}

export interface Podcast {
  title: string;
  duration: string;
  script: PodcastLine[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
  source?: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export type SlideLayout = 'definition' | 'stat' | 'comparison' | 'list' | 'timeline' | 'warning' | 'hero' | 'insight' | 'grid' | 'case-study';

export interface Slide {
  title: string;
  content: string[];
  layout?: SlideLayout;
  data?: any; // For charts or matrix
}

export interface Presentation {
  title: string;
  slides: Slide[];
}

export interface AudioPodcast extends Podcast {
  audioBase64?: string;
}

export interface VirtualPatient {
  patient: {
    name: string;
    age: number;
    gender: string;
    complaint: string;
  };
  hidden_diagnosis: string;
  difficulty: number;
  opening: string;
  evaluation: {
    steps: string[];
    key_mistakes: string[];
  };
}

export interface Metric {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'PAST' | 'O\'RTA' | 'YUQORI';
}

export interface PlanItem {
  time: string;
  title: string;
  duration: string;
  status: 'completed' | 'pending' | 'active';
  type: 'flashcards' | 'vp' | 'subject' | 'prep';
}

export interface SubjectProgress {
  name: string;
  progress: number;
  warning?: boolean;
}

export interface Activity {
  time: string;
  title: string;
  details: string;
}
