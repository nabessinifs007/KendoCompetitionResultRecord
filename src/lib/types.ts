export type Score = 'M' | 'K' | 'D' | 'T' | '▲' | 'F'; // メン、コテ、ドウ、ツキ、反則、不戦勝

export interface Court {
  id: string;
  name: string;
  created_at: string;
}

export interface Competition {
  id: string;
  name: string;
  type: 'tournament' | 'league';
  created_at: string;
}

export interface Match {
  id: string;
  competition_id: string;
  court_id: string | null;
  match_type: 'individual' | 'team';
  team_size: number;
  team_red_name: string;
  team_white_name: string;
  status: 'pending' | 'in_progress' | 'completed';
  winner: 'team_red' | 'team_white' | 'draw' | null;
  created_at: string;
}

export interface Bout {
  id: string;
  match_id: string;
  order_index: number;
  player_red_name: string;
  player_white_name: string;
  score_red: Score[];
  score_white: Score[];
  winner: 'red' | 'white' | 'draw' | null;
  is_representative: boolean;
  created_at: string;
}
