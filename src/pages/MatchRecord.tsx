import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { ScoreInput } from '../components/ScoreInput';
import { Button } from '../components/ui/Button';
import type { Score, Match } from '../lib/types';
import { getPositionNames, determineBoutWinner, calculateBoutPoints, calculateMatchTotals } from '../lib/kendoLogic';
import { useToast } from '../components/ui/ToastContext';
import { getMatch, createBout, updateMatchStatus } from '../lib/api';

export function MatchRecord() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const sizeParam = searchParams.get('size');
  const fallbackMode = searchParams.get('fallback') === 'true';
  const teamSize = sizeParam ? parseInt(sizeParam, 10) : 5;
  const positions = getPositionNames(teamSize);
  
  const [matchData, setMatchData] = useState<Match | null>(null);
  const [currentBoutIndex, setCurrentBoutIndex] = useState(0);
  
  const teamRedName = matchData?.team_red_name || '赤チーム';
  const teamWhiteName = matchData?.team_white_name || '白チーム';

  // State for the CURRENT bout's scores
  const [playerRedName, setPlayerRedName] = useState('');
  const [playerWhiteName, setPlayerWhiteName] = useState('');
  const [redScores, setRedScores] = useState<Score[]>([]);
  const [whiteScores, setWhiteScores] = useState<Score[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Track ALL finished bouts to calculate totals
  const [finishedBouts, setFinishedBouts] = useState<{redScores: Score[], whiteScores: Score[]}[]>([]);

  useEffect(() => {
    if (fallbackMode || !id) return;
    const fetchMatchInfo = async () => {
      try {
        const data = await getMatch(id);
        setMatchData(data);
      } catch (err) {
        addToast('試合情報の取得に失敗しました', 'error');
        console.error(err);
      }
    };
    fetchMatchInfo();
  }, [id, fallbackMode, addToast]);

  // 現在のポジションに応じた選手名を自動セット
  useEffect(() => {
    if (matchData) {
      if (matchData.player_red_names && matchData.player_red_names[currentBoutIndex]) {
        setPlayerRedName(matchData.player_red_names[currentBoutIndex]);
      }
      if (matchData.player_white_names && matchData.player_white_names[currentBoutIndex]) {
        setPlayerWhiteName(matchData.player_white_names[currentBoutIndex]);
      }
    }
  }, [matchData, currentBoutIndex]);

  const handleAddScore = (team: 'red' | 'white', score: Score) => {
    const currentPoints = calculateBoutPoints(redScores, whiteScores);
    if (score !== 'F' && (currentPoints.red >= 2 || currentPoints.white >= 2)) {
      addToast('すでに勝負が決まっています', 'info');
      return;
    }

    if (team === 'red') {
      setRedScores(prev => [...prev, score]);
    } else {
      setWhiteScores(prev => [...prev, score]);
    }

    if (score === 'F') {
      if (team === 'red') setRedScores(['F', 'F']);
      else setWhiteScores(['F', 'F']);
      addToast('不戦勝（2本）を設定しました', 'info');
    }
  };

  const handleRemoveScore = (team: 'red' | 'white', index: number) => {
    if (team === 'red') {
      setRedScores(prev => prev.filter((_, i) => i !== index));
    } else {
      setWhiteScores(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleNextBout = async () => {
    const winner = determineBoutWinner(redScores, whiteScores);
    const isRepresentative = currentBoutIndex >= positions.length;
    
    setIsSaving(true);
    try {
      if (!fallbackMode && id) {
        await createBout({
          match_id: id,
          order_index: currentBoutIndex,
          player_red_name: playerRedName || '選手赤',
          player_white_name: playerWhiteName || '選手白',
          score_red: redScores,
          score_white: whiteScores,
          winner,
          is_representative: isRepresentative,
        });
      }
      
      const newFinishedBouts = [...finishedBouts, { redScores, whiteScores }];
      setFinishedBouts(newFinishedBouts);

      const totals = calculateMatchTotals(newFinishedBouts);
      const isTeamMatchFinished = currentBoutIndex + 1 >= positions.length;

      if (!isTeamMatchFinished) {
        setCurrentBoutIndex(prev => prev + 1);
        setRedScores([]);
        setWhiteScores([]);
        setPlayerRedName('');
        setPlayerWhiteName('');
        addToast(`${positions[currentBoutIndex + 1]}戦へ進みます`, 'info');
      } else {
        if (totals.winner === 'draw' && !isRepresentative) {
          addToast('引き分けのため代表者戦を行います', 'info');
          setCurrentBoutIndex(prev => prev + 1);
          setRedScores([]);
          setWhiteScores([]);
          setPlayerRedName('');
          setPlayerWhiteName('');
        } else {
          if (!fallbackMode && id) {
            await updateMatchStatus(id, 'completed', totals.winner);
          }
          const winLabel = totals.winner === 'draw' ? '引き分け' : (totals.winner === 'team_red' ? '赤' : '白');
          addToast(`試合終了！勝者: ${winLabel}`, 'success');
          navigate('/');
        }
      }
    } catch (err) {
      addToast('スコア保存に失敗しました', 'error');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentPosition = positions[currentBoutIndex] || '代表者戦';
  const isLastNormalBout = currentBoutIndex === positions.length - 1;
  const isRepresentative = currentBoutIndex >= positions.length;

  // 現在進行中のものも含めた合計スコア
  const currentBout = { redScores, whiteScores };
  const allBoutsForTotals = [...finishedBouts, currentBout];
  const totals = calculateMatchTotals(allBoutsForTotals);

  const isIndividual = matchData?.match_type === 'individual' || (!matchData && teamSize === 1);

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl mx-auto pb-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          {currentPosition}
        </h2>
        <p className="text-muted mt-2">
          {isRepresentative 
            ? '一本勝負' 
            : isIndividual 
              ? '個人戦' 
              : `団体戦 (${teamSize}人制) / 進行状況: ${currentBoutIndex + 1} / ${teamSize}`}
        </p>
      </div>

      <Card>
        <div className="bg-black/50 p-4 rounded mb-6 shadow-inner border border-white/5">
          <div className="flex justify-between items-center mb-2 text-xs text-muted uppercase tracking-widest">
            <span>{teamRedName}</span>
            <span>Current Status</span>
            <span>{teamWhiteName}</span>
          </div>
          <div className="flex justify-between items-center font-bold">
            <div className="flex flex-col items-start gap-1">
              <span className="text-2xl text-[var(--team-a-red)]">{totals.redWins} <span className="text-xs">勝</span></span>
              <span className="text-sm opacity-70">({totals.redPoints} 本)</span>
            </div>
            
            <div className="text-xl opacity-30">VS</div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-2xl text-[var(--team-b-white)]">{totals.whiteWins} <span className="text-xs">勝</span></span>
              <span className="text-sm opacity-70">({totals.whitePoints} 本)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex flex-col gap-3">
            <input 
              placeholder="赤選手名" 
              className="bg-black/30 text-center p-3 rounded-lg border border-white/10 focus:border-red-500 outline-none transition-all placeholder:opacity-30"
              value={playerRedName}
              onChange={e => setPlayerRedName(e.target.value)}
            />
            <ScoreInput 
              label={playerRedName || '選手赤'}
              team="red" 
              scores={redScores} 
              onScoreAdd={(s) => handleAddScore('red', s)}
              onScoreRemove={(idx) => handleRemoveScore('red', idx)}
            />
          </div>
          
          <div className="hidden sm:block w-[1px] bg-white/5 self-stretch mx-2" />
          
          <div className="flex-1 flex flex-col gap-3">
            <input 
              placeholder="白選手名" 
              className="bg-black/30 text-center p-3 rounded-lg border border-white/10 focus:border-gray-400 outline-none transition-all placeholder:opacity-30"
              value={playerWhiteName}
              onChange={e => setPlayerWhiteName(e.target.value)}
            />
            <ScoreInput 
              label={playerWhiteName || '選手白'}
              team="white" 
              scores={whiteScores} 
              onScoreAdd={(s) => handleAddScore('white', s)}
              onScoreRemove={(idx) => handleRemoveScore('white', idx)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <Button 
            size="lg" 
            className="w-full font-bold py-4 text-lg shadow-lg" 
            variant="primary" 
            onClick={handleNextBout} 
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : (isLastNormalBout ? '試合結果を確定する' : (isRepresentative ? '代表者戦を確定させる' : '次の対戦へ進む'))}
          </Button>
          
          {!isRepresentative && !isIndividual && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-muted hover:text-white"
              onClick={() => {
                setCurrentBoutIndex(positions.length);
                addToast('代表者戦モードに切り替えました', 'info');
              }}
            >
              代表者戦を行う
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-4 flex flex-col gap-2">
        <h3 className="text-sm font-bold opacity-50 px-2">対戦履歴</h3>
        {finishedBouts.map((bout, idx) => {
          const p = calculateBoutPoints(bout.redScores, bout.whiteScores);
          return (
            <div key={idx} className="flex justify-between items-center text-xs bg-white/5 p-2 rounded border border-white/5">
              <span className="w-16 opacity-50">{positions[idx] || '代表'}</span>
              <div className="flex gap-1">
                {bout.redScores.map((s, i) => <span key={i} className="text-red-400">{s}</span>)}
              </div>
              <span className="font-bold">{p.red} - {p.white}</span>
              <div className="flex gap-1">
                {bout.whiteScores.map((s, i) => <span key={i} className="text-gray-300">{s}</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
