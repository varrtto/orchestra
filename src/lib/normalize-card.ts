import type { Card } from "@/lib/types";

type CardRow = Card & {
  number?: number | null;
};

export function normalizeCard(row: CardRow): Card {
  const cardNumber = row.card_number ?? row.number ?? null;
  const { number: _legacyNumber, ...card } = row;
  return {
    ...card,
    card_number: cardNumber,
  };
}

export function normalizeCards(rows: CardRow[]): Card[] {
  return rows.map(normalizeCard);
}
