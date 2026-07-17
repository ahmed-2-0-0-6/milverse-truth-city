import { useEffect, useState } from "react";
import { loadFirstPhone, type FirstPhoneState } from "@/lib/firstPhone/profile";

/**
 * Hydration-safe reader for First Phone state.
 * Server and first client render always return { state: fresh, ready: false }
 * so markup matches. After mount we read localStorage and re-render.
 * Consumers MUST branch on `ready` before showing gate/UI that depends on
 * the persisted state — otherwise juniors will flash the adult district
 * before the soft-lock lands.
 */
function fresh(): FirstPhoneState {
  return {
    active: false,
    kidCityName: "",
    familyCode: null,
    lessonsCompleted: [],
    licenseIssuedAt: null,
    licenseNumber: null,
    wallpaper: 0,
    handoverSeen: false,
  };
}

export function useJuniorMode(): FirstPhoneState & { ready: boolean } {
  const [state, setState] = useState<FirstPhoneState>(fresh);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(loadFirstPhone());
    setReady(true);
    const on = () => setState(loadFirstPhone());
    window.addEventListener("milverse:firstphone", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("milverse:firstphone", on);
      window.removeEventListener("storage", on);
    };
  }, []);

  return { ...state, ready };
}
