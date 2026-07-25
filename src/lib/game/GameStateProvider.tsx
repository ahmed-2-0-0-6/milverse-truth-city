import { createContext, useContext, useEffect, useReducer, ReactNode } from "react";
import { GameState, INITIAL_GAME_STATE, Detective, Corrupter, Case } from "./gameSave";
import { readStore, writeStore } from "@/lib/storage";

const GAME_SAVE_KEY = "milverse.game.v1";

type GameAction = 
  | { type: "LOAD_SAVE"; payload: GameState }
  | { type: "RECRUIT_DETECTIVE"; payload: Detective }
  | { type: "ASSIGN_CASE"; payload: { detId: string; caseId: string } }
  | { type: "COMPLETE_CASE"; payload: { detId: string; caseId: string; success: boolean } }
  | { type: "LOWER_CORRUPTION"; payload: { districtId: string; amount: number } };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD_SAVE":
      return action.payload;
    case "RECRUIT_DETECTIVE":
      return {
        ...state,
        detectives: [...state.detectives, action.payload]
      };
    case "ASSIGN_CASE":
      return {
        ...state,
        detectives: state.detectives.map(d => 
          d.id === action.payload.detId ? { ...d, status: "investigating", activeCaseId: action.payload.caseId } : d
        )
      };
    case "COMPLETE_CASE": {
      const activeCase = state.activeCases.find(c => c.id === action.payload.caseId);
      const bonusBricks = action.payload.success && activeCase ? activeCase.rewardBricks : 0;
      const bonusEvidence = action.payload.success && activeCase ? activeCase.rewardEvidence : 0;
      
      return {
        ...state,
        bricks: state.bricks + bonusBricks,
        evidence: state.evidence + bonusEvidence,
        detectives: state.detectives.map(d => 
          d.id === action.payload.detId ? { 
            ...d, 
            status: "idle", 
            activeCaseId: undefined,
            xp: d.xp + (action.payload.success ? 50 : 10)
          } : d
        ),
        activeCases: state.activeCases.filter(c => c.id !== action.payload.caseId)
      };
    }
    case "LOWER_CORRUPTION":
      return {
        ...state,
        corrupters: state.corrupters.map(c => 
          c.districtId === action.payload.districtId 
            ? { ...c, controlLevel: Math.max(0, c.controlLevel - action.payload.amount) } 
            : c
        )
      };
    default:
      return state;
  }
}

const GameStateContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_GAME_STATE);

  // Load from local storage on mount
  useEffect(() => {
    const saved = readStore<GameState>(GAME_SAVE_KEY);
    if (saved && saved !== "corrupt") {
      dispatch({ type: "LOAD_SAVE", payload: saved });
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    // Debounce save slightly in a real app, but synchronous is fine for now
    writeStore(GAME_SAVE_KEY, state);
  }, [state]);

  return (
    <GameStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameEngine() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error("useGameEngine must be used within a GameStateProvider");
  }
  return context;
}
