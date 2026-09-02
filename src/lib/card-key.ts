const CARD_NUMBER_PAD = 5;

export function formatCardKey(boardKey: string, number: number): string {
  return `${boardKey}-${String(number).padStart(CARD_NUMBER_PAD, "0")}`;
}
