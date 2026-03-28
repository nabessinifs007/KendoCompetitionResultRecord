import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { getRecentMatches } from '../lib/api';
import type { Match } from '../lib/types';

export function Home() {
  const navigate = useNavigate();
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      try {
        const data = await getRecentMatches(3);
        setRecentMatches(data);
      } catch (err) {
        console.error('Failed to fetch recent matches:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecent();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl mx-auto">
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-2">
          剣道試合記録システム
        </h2>
        <p className="text-muted">公式ルールに準拠した詳細な試合記録・管理が可能です。</p>
      </div>

      <div className="flex justify-center">
        <Button size="lg" className="px-12 py-6 text-xl font-bold shadow-xl hover:scale-105 transition-transform" onClick={() => navigate('/setup')}>
          新しい試合を記録する
        </Button>
      </div>

      <div className="mt-12 bg-white/5 p-6 rounded-2xl border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">最近の試合</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
            すべて見る &rarr;
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : recentMatches.length === 0 ? (
          <p className="text-muted text-center py-8 bg-black/20 rounded-xl border border-dashed border-white/10">
            まだ記録された試合はありません。
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentMatches.map((match: Match) => (
              <div 
                key={match.id} 
                className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                onClick={() => navigate(`/match-detail/${match.id}`)}
              >
                <div>
                  <div className="text-xs text-muted mb-1">{formatDate(match.created_at)}</div>
                  <div className="font-bold flex items-center gap-2">
                    <span className={match.winner === 'team_red' ? 'text-red-400' : ''}>{match.team_red_name}</span>
                    <span className="text-muted text-xs font-normal">VS</span>
                    <span className={match.winner === 'team_white' ? 'text-gray-300' : ''}>{match.team_white_name}</span>
                  </div>
                </div>
                <div className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded bg-white/10 text-muted">
                  {match.match_type === 'individual' ? '個人' : '団体'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
