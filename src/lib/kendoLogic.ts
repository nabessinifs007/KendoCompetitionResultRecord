function numToKanji(num: number): string {
  const KANJI_DIGITS = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
  if (num < 10) return KANJI_DIGITS[num];
  if (num === 10) return "十";
  if (num < 20) return "十" + KANJI_DIGITS[num % 10];
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return KANJI_DIGITS[tens] + "十" + KANJI_DIGITS[ones];
}

// チーム人数に応じたポジション名を取得する関数（汎用版）
export function getPositionNames(teamSize: number): string[] {
  if (teamSize === 1) return ['一本立ち（個人戦）'];
  if (teamSize === 2) return ['先鋒', '大将'];

  const names: string[] = [];
  // 中堅は「後ろから数えて」全体の半分の切り上げ位置になる法則
  const chukenK = Math.ceil(teamSize / 2);
  const chukenIndex = teamSize - chukenK;

  for (let i = 0; i < teamSize; i++) {
    const K = teamSize - i; // 後ろからの順位(1-based)
    
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

// 取得本数を表すScore型
import type { Score } from './types';

// スコアから勝者（赤/白/引き分け）を判定する
export function determineBoutWinner(redScores: Score[], whiteScores: Score[]): 'red' | 'white' | 'draw' {
  // 剣道のルール上、反則（▲）2回で相手に1本入る等の処理は
  // ここではシンプルに「スコアの個数」＝「本数」として扱う想定とする。
  // （もし反則の厳密な計算が含まれる場合は追加ロジックが必要）
  const redCount = redScores.length;
  const whiteCount = whiteScores.length;

  if (redCount > whiteCount) return 'red';
  if (whiteCount > redCount) return 'white';
  
  // 同数の場合は引き分け（先取等によらない場合）
  return 'draw';
}
