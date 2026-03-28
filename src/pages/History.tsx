import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getAllMatches, getCourts } from '../lib/api';
import type { Match, Court } from '../lib/types';
import { useToast } from '../components/ui/ToastContext';

export function History() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCourt, setFilterCourt] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchesData, courtsData] = await Promise.all([
          getAllMatches(),
          getCourts()
        ]);
        setMatches(matchesData);
        setCourts(courtsData);
      } catch (err) {
        addToast('データの取得に失敗しました', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [addToast]);

  const filteredMatches = filterCourt === 'all' 
    ? matches 
    : matches.filter(m => m.court_id === filterCourt);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWinnerLabel = (match: Match) => {
    if (match.status !== 'completed') return '進行中';
    if (match.winner === 'team_red') return `勝者: ${match.team_red_name}`;
    if (match.winner === 'team_white') return `勝者: ${match.team_white_name}`;
    return '引き分け';
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">試合履歴</h2>
          <p className="text-muted">過去に記録されたすべての試合を表示します。</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/10">
          <span className="text-sm text-muted px-2">試合場:</span>
          <select 
            className="bg-transparent border-none outline-none text-sm cursor-pointer min-w-[120px]"
            value={filterCourt}
            onChange={(e) => setFilterCourt(e.target.value)}
          >
            <option value="all">すべて表示</option>
            {courts.map((c: Court) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <Card className="py-12 text-center text-muted">
          該当する試合データが見つかりません。
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredMatches.map((match: Match) => (
            <Card 
              key={match.id} 
              className="hover:border-white/20 transition-all cursor-pointer group"
              onClick={() => navigate(`/match-detail/${match.id}`)}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded text-muted">
                      {match.match_type === 'individual' ? '個人戦' : `${match.team_size}人制 団体戦`}
                    </span>
                    <span className="text-xs text-muted">
                      {formatDate(match.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-lg font-bold">
                    <span className={match.winner === 'team_red' ? 'text-red-400' : ''}>{match.team_red_name}</span>
                    <span className="text-muted text-sm font-normal">VS</span>
                    <span className={match.winner === 'team_white' ? 'text-gray-300' : ''}>{match.team_white_name}</span>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col justify-between items-end gap-2">
                  <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                    match.winner === 'draw' ? 'bg-white/10 text-white' : 
                    match.winner === 'team_red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                    'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                  }`}>
                    {getWinnerLabel(match)}
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-50 group-hover:opacity-100">
                    詳細を見る &rarr;
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
