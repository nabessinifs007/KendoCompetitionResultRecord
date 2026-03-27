import { supabase } from './supabase';
import type { Court, Competition, Match, Bout, Score } from './types';

// Courts API
export async function getCourts(): Promise<Court[]> {
  const { data, error } = await supabase.from('courts').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data as Court[];
}

export async function createCourt(name: string): Promise<Court> {
  const { data, error } = await supabase.from('courts').insert([{ name }]).select().single();
  if (error) throw error;
  return data as Court;
}

// Competitions API
export async function getCompetitions(): Promise<Competition[]> {
  const { data, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data as Competition[];
}

// Match API
export async function createMatch(matchData: Partial<Match>): Promise<Match> {
  const { data, error } = await supabase.from('matches').insert([matchData]).select().single();
  if (error) throw error;
  return data as Match;
}

export async function getMatch(id: string): Promise<Match> {
  const { data, error } = await supabase.from('matches').select('*').eq('id', id).single();
  if (error) throw error;
  return data as Match;
}

export async function updateMatchStatus(id: string, status: Match['status'], winner: Match['winner']): Promise<void> {
  const { error } = await supabase.from('matches').update({ status, winner }).eq('id', id);
  if (error) throw error;
}

// Bout API
export async function createBout(boutData: Partial<Bout>): Promise<Bout> {
  const { data, error } = await supabase.from('bouts').insert([boutData]).select().single();
  if (error) throw error;
  return data as Bout;
}
