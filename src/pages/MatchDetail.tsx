import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { getMatch, getBoutsByMatchId } from '../lib/api';
import type { Match, Bout, Score } from '../lib/types';
import { getPositionNames, calculateMatchTotals } from '../lib/kendoLogic';
import { useToast } from '../components/ui/ToastContext';

export function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [match, setMatch] = useState<Match | null>(null);
  const [bouts, setBouts] = useState<Bout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [matchData, boutsData] = await Promise.all([
          getMatch(id),
          getBoutsByMatchId(id)
        ]);
        setMatch(matchData);
        setBouts(boutsData);
      } catch (err) {
        addToast('詳細データの取得に失敗しました', 'error');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, addToast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!match) return <div className="text-center py-12">試合が見つかりません</div>;

  const totals = calculateMatchTotals(bouts.map(b => ({
    redScores: b.score_red,
    whiteScores: b.score_white
  })));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const ScoreBadge = ({ score }: { score: Score }) => (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-sm border text-sm font-bold ${
      score === '▲' ? 'border-red-500/50 text-red-500 bg-red-500/10' :
      score === 'F' ? 'border-yellow-500/50 text-yellow-500 bg-yellow-500/10' :
      'border-white/20 bg-white/5 text-white'
    }`}>
      {score}
    </span>
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-3xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
        <Button variant="ghost" onClick={() => navigate('/history')}>
          &larr; 戻る
        </Button>
        <div className="text-center flex-1">
          <h2 className="text-2xl font-bold">{match.team_red_name} VS {match.team_white_name}</h2>
          <p className="text-xs text-muted mt-1">{formatDate(match.created_at)}</p>
        </div>
        <div className="w-20" /> {/* Spacer */}
      </div>

      <Card className="overflow-hidden">
        {/* スコアボード風ヘッダー */}
        <div className="grid grid-cols-[80px_1fr_120px_1fr_80px] bg-white/10 p-3 sm:p-4 text-xs font-bold uppercase tracking-widest text-muted border-b border-white/10">
          <div className="text-center">ポジション</div>
          <div className="text-center">赤</div>
          <div className="text-center">スコア</div>
          <div className="text-center">白</div>
          <div className="text-center">結果</div>
        </div>

        {/* 試合データ行 */}
        <div className="divide-y divide-white/5 overflow-x-auto">
          <div className="min-w-[600px]">
            {bouts.map((bout, idx) => {
              const positionLabel = bout.is_representative 
                ? '代表戦' 
                : (match.match_type === 'individual' 
                    ? (idx === 0 ? '本戦' : `延長${idx}`) 
                    : (getPositionNames(match.team_size)[idx] || '対戦'));

              return (
                <div key={bout.id} className="grid grid-cols-[100px_1fr_140px_1fr_80px] items-center p-3 sm:p-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                  <div className="text-xs text-center border-r border-white/5 font-bold text-muted">
                    {positionLabel}
                  </div>
                  
                  <div className="text-center px-4">
                    <div className="text-sm font-bold truncate" title={bout.player_red_name}>
                      {bout.player_red_name}
                    </div>
                  </div>

                  <div className="flex justify-center items-center gap-2 px-2">
                    <div className="flex justify-end gap-1 flex-1">
                      {bout.score_red.map((s, i) => <ScoreBadge key={i} score={s} />)}
                    </div>
                    <div className="w-[1px] bg-white/20 h-6 shrink-0" />
                    <div className="flex justify-start gap-1 flex-1">
                      {bout.score_white.map((s, i) => <ScoreBadge key={i} score={s} />)}
                    </div>
                  </div>

                  <div className="text-center px-4">
                    <div className="text-sm font-bold truncate" title={bout.player_white_name}>
                      {bout.player_white_name}
                    </div>
                  </div>

                  <div className="text-center font-black">
                    {bout.winner === 'red' ? <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 text-xs">勝</span> : 
                     bout.winner === 'white' ? <span className="text-white bg-white/10 px-2 py-1 rounded border border-white/20 text-xs text-[#f8fafc]">勝</span> : 
                     <span className="text-muted text-xs">分</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 合計表示 */}
        <div className="bg-white/10 p-5 mt-2 border-t border-white/20">
          <div className="flex justify-around items-center">
            <div className="text-center">
              <div className="text-xs text-muted mb-1">勝者数</div>
              <div className="text-3xl font-extrabold text-red-400">{totals.redWins}</div>
              <div className="text-xs text-muted mt-1">{totals.redPoints} 本</div>
            </div>

            <div className="text-center opacity-30 px-4">
              <div className="h-12 w-[1px] bg-white mx-auto" />
            </div>

            <div className="text-center">
              <div className="text-xs text-muted mb-1">勝者数</div>
              <div className="text-3xl font-extrabold text-gray-300">{totals.whiteWins}</div>
              <div className="text-xs text-muted mt-1">{totals.whitePoints} 本</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <div className={`inline-block px-8 py-2 rounded-full border-2 font-black text-xl tracking-widest ${
              match.winner === 'team_red' ? 'border-red-500 text-red-500 bg-red-500/5' :
              match.winner === 'team_white' ? 'border-gray-400 text-gray-400 bg-gray-400/5' :
              'border-white/30 text-white/50 bg-white/5'
            }`}>
              {match.winner === 'team_red' ? `${match.team_red_name} 勝` :
               match.winner === 'team_white' ? `${match.team_white_name} 勝` :
               '引き分け'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
