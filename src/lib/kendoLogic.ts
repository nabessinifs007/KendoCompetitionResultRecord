import type { Score } from './types';

function numToKanji(num: number): string {
  const KANJI_DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (num < 10) return KANJI_DIGITS[num];
  if (num === 10) return "十";
  if (num < 20) return "十" + KANJI_DIGITS[num % 10];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return KANJI_DIGITS[tens] + "十" + KANJI_DIGITS[ones];
}

// チーム人数に応じたポジション名を取得する関数
export function getPositionNames(teamSize: number): string[] {
  if (teamSize === 1) return ['個人戦'];
  if (teamSize === 2) return ['先鋒', '大将'];

  const names: string[] = [];
  const chukenK = Math.ceil(teamSize / 2);
  const chukenIndex = teamSize - chukenK;

  for (let i = 0; i < teamSize; i++) {
    const K = teamSize - i; 
    
    if (i === 0) {
      names.push('先鋒');
    } else if (K === 1) {
      names.push('大将');
    } else if (i === chukenIndex) {
      names.push('中堅');
    } else if (K === 2) {
      names.push('副将');
    } else if (i === 1) {
      names.push('次鋒');
    } else {
      names.push(`${numToKanji(K)}将`);
    }
  }

  return names;
}

/**
 * 1つの対戦（Bout）の取得本数を計算する
 * 反則(▲)は2つで相手の1本としてカウントする。
 * 不戦勝(F)はそのまま1本としてカウントする（通常1試合で2つ並ぶ）。
 */
export function calculateBoutPoints(redScores: Score[], whiteScores: Score[]): { red: number, white: number } {
  // 通常の技（M, K, D, T）と不戦勝（F）をカウント
  const redNormal = redScores.filter(s => s !== '▲').length;
  const whiteNormal = whiteScores.filter(s => s !== '▲').length;

  // 反則による相手への加点
  const redPenalties = redScores.filter(s => s === '▲').length;
  const whitePenalties = whiteScores.filter(s => s === '▲').length;

  const redFromWhitePenalties = Math.floor(whitePenalties / 2);
  const whiteFromRedPenalties = Math.floor(redPenalties / 2);

  return {
    red: redNormal + redFromWhitePenalties,
    white: whiteNormal + whiteFromRedPenalties
  };
}

// スコアから勝者（red/white/draw）を判定する
export function determineBoutWinner(redScores: Score[], whiteScores: Score[]): 'red' | 'white' | 'draw' {
  const points = calculateBoutPoints(redScores, whiteScores);

  if (points.red > points.white) return 'red';
  if (points.white > points.red) return 'white';
  return 'draw';
}

/**
 * 団体戦全体の集計を行う
 */
export function calculateMatchTotals(bouts: { redScores: Score[], whiteScores: Score[] }[]) {
  let redWins = 0;
  let whiteWins = 0;
  let redPoints = 0;
  let whitePoints = 0;

  for (const bout of bouts) {
    const p = calculateBoutPoints(bout.redScores, bout.whiteScores);
    redPoints += p.red;
    whitePoints += p.white;

    if (p.red > p.white) redWins++;
    else if (p.white > p.red) whiteWins++;
  }

  // 判定：1. 勝者数、2. 取得本数
  let winner: 'team_red' | 'team_white' | 'draw' = 'draw';
  if (redWins > whiteWins) {
    winner = 'team_red';
  } else if (whiteWins > redWins) {
    winner = 'team_white';
  } else {
    // 勝者数同数の場合、本数で比較
    if (redPoints > whitePoints) winner = 'team_red';
    else if (whitePoints > redPoints) winner = 'team_white';
    else winner = 'draw'; // 本数も同数の場合は引き分け（＝代表者戦が必要）
  }

  return { redWins, whiteWins, redPoints, whitePoints, winner };
}
