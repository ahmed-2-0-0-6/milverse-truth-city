// MILVERSE — First Phone wallpaper presets. Pure CSS, no asset deps.
// Kid picks one at handover; stored as an index on the profile.

export interface Wallpaper {
  id: number;
  name: string;
  /** Full CSS background value (gradient stack). */
  bg: string;
  /** Foreground token — light or dark — to keep clock/name readable. */
  fg: "light" | "dark";
}

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 0,
    name: "Sunset",
    bg: "linear-gradient(160deg,#ff9966 0%,#ff5e62 50%,#7a2ea6 100%)",
    fg: "light",
  },
  {
    id: 1,
    name: "Ocean",
    bg: "linear-gradient(180deg,#0ea5e9 0%,#1e3a8a 100%)",
    fg: "light",
  },
  {
    id: 2,
    name: "Forest",
    bg: "linear-gradient(180deg,#065f46 0%,#052e2b 60%,#0b3d2e 100%)",
    fg: "light",
  },
  {
    id: 3,
    name: "Cosmos",
    bg: "radial-gradient(circle at 30% 20%,#a78bfa 0%,#312e81 40%,#0b0722 100%)",
    fg: "light",
  },
];

export function getWallpaper(i: number): Wallpaper {
  return WALLPAPERS[i] ?? WALLPAPERS[0];
}
