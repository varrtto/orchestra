const CARD_NUMBER_PAD = 5;

export function formatCardKey(boardKey: string, cardNumber: number): string {
  return `${boardKey}-${String(cardNumber).padStart(CARD_NUMBER_PAD, "0")}`;
}

export function boardKeyFromTitle(title: string): string {
  const normalized = title.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (!normalized) return "BOARD";
  return normalized.slice(0, 12);
}

type CardLike = {
  id: string;
  card_number?: number | null;
  number?: number | null;
  created_at: string;
};

type BoardLike = {
  key?: string | null;
  title: string;
};

function readCardNumber(card: CardLike): number | null {
  const value = card.card_number ?? card.number;
  return value != null ? value : null;
}

export function getCardNumber(card: CardLike, cards: CardLike[]): number | null {
  const fromDb = readCardNumber(card);
  if (fromDb != null) return fromDb;

  const sorted = [...cards].sort((a, b) => {
    const byTime =
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (byTime !== 0) return byTime;
    return a.id.localeCompare(b.id);
  });
  const index = sorted.findIndex((item) => item.id === card.id);
  return index >= 0 ? index + 1 : null;
}

export function getBoardKey(board: BoardLike): string {
  return board.key?.trim() || boardKeyFromTitle(board.title);
}

export function getCardRef(
  board: BoardLike | null | undefined,
  card: CardLike,
  cards: CardLike[],
): string | null {
  if (!board) return null;
  const cardNumber = getCardNumber(card, cards);
  if (cardNumber == null) return null;
  return formatCardKey(getBoardKey(board), cardNumber);
}
