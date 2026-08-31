export const DEFAULT_BOARD_BACKGROUND_COLOR = "#0f3d3a";

export const BOARD_BACKGROUND_PRESETS = [
  { name: "Teal", value: "#0f3d3a" },
  { name: "Slate", value: "#1e293b" },
  { name: "Indigo", value: "#312e81" },
  { name: "Plum", value: "#581c87" },
  { name: "Rose", value: "#881337" },
  { name: "Amber", value: "#78350f" },
  { name: "Forest", value: "#14532d" },
  { name: "Ocean", value: "#0c4a6e" },
] as const;

export function isValidBoardBackgroundColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export function randomBoardBackgroundColor() {
  const index = Math.floor(Math.random() * BOARD_BACKGROUND_PRESETS.length);
  return BOARD_BACKGROUND_PRESETS[index].value;
}
