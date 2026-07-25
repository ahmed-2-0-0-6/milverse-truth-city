// Data models for the Absolute Maximum RPG game engine

export type DetectiveTrait = 
  | "Tech Savvy" 
  | "Interrogator" 
  | "Forensics" 
  | "Intuition" 
  | "Corruptible"
  | "Incorruptible";

export interface Detective {
  id: string;
  name: string;
  level: number;
  xp: number;
  stamina: number;
  maxStamina: number;
  stats: {
    analysis: number;
    tech: number;
    investigation: number;
  };
  traits: DetectiveTrait[];
  status: "idle" | "investigating" | "recovering";
  activeCaseId?: string;
}

export interface Corrupter {
  id: string;
  name: string;
  alias: string;
  districtId: string;
  controlLevel: number; // 0 to 100%
  weaknesses: DetectiveTrait[];
  isDefeated: boolean;
}

export interface Case {
  id: string;
  title: string;
  difficulty: number;
  requiredStat: "analysis" | "tech" | "investigation";
  durationSeconds: number;
  rewardBricks: number;
  rewardEvidence: number;
}

export interface GameState {
  bricks: number;
  evidence: number;
  detectives: Detective[];
  corrupters: Corrupter[];
  activeCases: Case[];
}

export const INITIAL_GAME_STATE: GameState = {
  bricks: 100,
  evidence: 0,
  detectives: [
    {
      id: "det_01",
      name: "Arthur Penhaligon",
      level: 1,
      xp: 0,
      stamina: 100,
      maxStamina: 100,
      stats: { analysis: 5, tech: 2, investigation: 8 },
      traits: ["Intuition"],
      status: "idle",
    }
  ],
  corrupters: [
    {
      id: "corr_botmaster",
      name: "The Botmaster",
      alias: "Syntax Error",
      districtId: "industrial_01",
      controlLevel: 100,
      weaknesses: ["Tech Savvy"],
      isDefeated: false,
    },
    {
      id: "corr_illusionist",
      name: "The Illusionist",
      alias: "Deepfake King",
      districtId: "entertainment_02",
      controlLevel: 100,
      weaknesses: ["Forensics"],
      isDefeated: false,
    }
  ],
  activeCases: []
};
