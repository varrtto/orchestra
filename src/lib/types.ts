export type BoardRole = "owner" | "editor" | "viewer";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
};

export type Board = {
  id: string;
  title: string;
  background_color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type BoardMember = {
  board_id: string;
  user_id: string;
  role: BoardRole;
  created_at: string;
  profile?: Profile;
};

export type List = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
};

export type Card = {
  id: string;
  list_id: string;
  title: string;
  description: string;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type Label = {
  id: string;
  board_id: string;
  name: string;
  color: string;
};

export type CardLabel = {
  card_id: string;
  label_id: string;
};

export type CardAssignee = {
  card_id: string;
  user_id: string;
  profile?: Profile;
};

export type Comment = {
  id: string;
  card_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
};

export type Invite = {
  id: string;
  board_id: string;
  email: string;
  role: BoardRole;
  status: "pending" | "accepted" | "revoked";
  invited_by: string;
  created_at: string;
};

export type BoardWithRole = Board & {
  role: BoardRole;
};

export type FullBoard = {
  board: Board;
  role: BoardRole;
  lists: List[];
  cards: Card[];
  labels: Label[];
  cardLabels: CardLabel[];
  cardAssignees: CardAssignee[];
  comments: Comment[];
  members: BoardMember[];
};
