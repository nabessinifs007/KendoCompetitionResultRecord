import type { Score } from '../lib/types';

interface ScoreInputProps {
  label: string;
  team: 'red' | 'white';
  scores: Score[];
  onScoreAdd: (score: Score) => void;
  onScoreRemove: (index: number) => void;
}

export function ScoreInput({ label, team, scores, onScoreAdd, onScoreRemove }: ScoreInputProps) {
  // Score button styling
  const getScoreStyle = (type: Score) => {
    switch (type) {
      case 'M': return { color: 'var(--score-men)', borderColor: 'var(--score-men)' };
      case 'K': return { color: 'var(--score-kote)', borderColor: 'var(--score-kote)' };
      case 'D': return { color: 'var(--score-do)', borderColor: 'var(--score-do)' };
      case 'T': return { color: 'var(--score-tsuki)', borderColor: 'var(--score-tsuki)' };
      case '▲': return { color: 'var(--score-hansoku)', borderColor: 'var(--score-hansoku)' };
      case 'F': return { color: '#fbbf24', borderColor: '#fbbf24' }; // 不戦勝はオレンジ系
      default: return {};
    }
  };

  const scoreButtons: { type: Score; label: string }[] = [
    { type: 'M', label: 'メ' },
    { type: 'K', label: 'コ' },
    { type: 'D', label: 'ド' },
    { type: 'T', label: 'ツ' },
    { type: '▲', label: '反' },
    { type: 'F', label: '不' },
  ];

  const bannerColor = team === 'red' ? 'var(--team-a-red)' : 'var(--team-b-white)';
  const textColor = team === 'red' ? '#fff' : '#000';

  return (
    <div className="flex flex-col gap-4" style={{ flex: 1 }}>
      {/* Player Header Banner */}
      <div 
        className="flex items-center justify-center p-2 rounded-t-lg"
        style={{ background: bannerColor, color: textColor, fontWeight: 'bold' }}
      >
        {label} ({team === 'red' ? '赤' : '白'})
      </div>

      <div className="flex flex-col gap-2 p-2">
        {/* Current Scores Display */}
        <div className="flex gap-2 min-h-[40px] items-center justify-center p-2 rounded bg-black/30">
          {scores.length === 0 ? (
            <span className="text-muted text-sm">スコアなし</span>
          ) : (
            scores.map((s, idx) => (
              <button 
                key={idx} 
                className="badge"
                style={{ ...getScoreStyle(s), border: '1px solid', cursor: 'pointer' }}
                onClick={() => onScoreRemove(idx)}
                title="クリックで削除"
              >
                {s}
              </button>
            ))
          )}
        </div>

        {/* Input Controls */}
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {scoreButtons.map(btn => (
            <button
              key={btn.type}
              className="btn btn-secondary text-sm font-bold"
              style={{ ...getScoreStyle(btn.type), width: '40px', height: '40px', padding: 0 }}
              onClick={() => onScoreAdd(btn.type)}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
