import { useEffect, useState } from "react";
import { loadFirstPhone, type FirstPhoneState } from "@/lib/firstPhone/profile";

export function useJuniorMode(): FirstPhoneState {
  const [state, setState] = useState<FirstPhoneState>(() => loadFirstPhone());
  useEffect(() => {
    const on = () => setState(loadFirstPhone());
    window.addEventListener("milverse:firstphone", on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener("milverse:firstphone", on);
      window.removeEventListener("storage", on);
    };
  }, []);
  return state;
}
