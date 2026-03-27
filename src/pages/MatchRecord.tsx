import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { ScoreInput } from '../components/ScoreInput';
import { Button } from '../components/ui/Button';
import { Score } from '../lib/types';
import { getPositionNames, determineBoutWinner } from '../lib/kendoLogic';
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
  
  const [matchData, setMatchData] = useState<any>(null);
  const [currentBoutIndex, setCurrentBoutIndex] = useState(0);
  
  const teamRedName = matchData?.team_red_name || '赤チーム';
  const teamWhiteName = matchData?.team_white_name || '白チーム';

  // State for the CURRENT bout's scores
  const [playerRedName, setPlayerRedName] = useState('');
  const [playerWhiteName, setPlayerWhiteName] = useState('');
  const [redScores, setRedScores] = useState<Score[]>([]);
  const [whiteScores, setWhiteScores] = useState<Score[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // State to track overall wins/draws/losses
  const [boutResults, setBoutResults] = useState<{winner: 'red' | 'white' | 'draw'}[]>([]);

  useEffect(() => {
    if (fallbackMode || !id) return;
    const fetchMatchInfo = async () => {
      try {
        const data = await getMatch(id);
        setMatchData(data);
      } catch (err: any) {
        addToast('試合情報の取得に失敗しました', 'error');
      }
    };
    fetchMatchInfo();
  }, [id, fallbackMode, addToast]);

  const handleAddScore = (team: 'red' | 'white', score: Score) => {
    if (team === 'red') {
      if (redScores.length < 2) setRedScores(prev => [...prev, score]);
    } else {
      if (whiteScores.length < 2) setWhiteScores(prev => [...prev, score]);
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
          is_representative: currentBoutIndex >= positions.length,
        });
      }
      
      setBoutResults(prev => [...prev, { winner }]);

      if (currentBoutIndex + 1 < positions.length) {
        // 次の対戦へ進む
        setCurrentBoutIndex(prev => prev + 1);
        setRedScores([]);
        setWhiteScores([]);
        setPlayerRedName('');
        setPlayerWhiteName('');
        addToast(`${positions[currentBoutIndex + 1]}戦へ進みます`, 'info');
      } else {
        // すべての対戦終了、全体勝敗を決めてMatch更新
        const rWins = boutResults.filter(r => r.winner === 'red').length + (winner === 'red' ? 1 : 0);
        const wWins = boutResults.filter(r => r.winner === 'white').length + (winner === 'white' ? 1 : 0);
        const overallWinner = rWins > wWins ? 'team_red' : wWins > rWins ? 'team_white' : 'draw';
        
        if (!fallbackMode && id) {
          await updateMatchStatus(id, 'completed', overallWinner);
        }
        
        addToast(`試合終了！勝者: ${overallWinner === 'draw' ? '引き分け' : (overallWinner === 'team_red' ? '赤' : '白')}`, 'success');
        navigate('/');
      }
    } catch (err: any) {
      addToast('スコア保存に失敗しました', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPosition = positions[currentBoutIndex] || '代表者戦';
  const isLastBout = currentBoutIndex >= positions.length - 1;

  const redWins = boutResults.filter(r => r.winner === 'red').length;
  const whiteWins = boutResults.filter(r => r.winner === 'white').length;

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-2xl mx-auto pb-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          {currentPosition}
        </h2>
        <p className="text-muted mt-2">団体戦 ({teamSize}人制) / 進行状況: {currentBoutIndex + 1} / {teamSize}</p>
      </div>

      <Card>
        {/* Top Header - Overall Match Status */}
        <div className="flex justify-between items-center bg-black/50 p-4 rounded mb-6 font-bold shadow-inner">
          <div className="flex items-center gap-3">
            <span className="text-sm bg-red-500/20 text-red-300 px-2 py-1 rounded">計 {redWins} 勝</span>
            <span style={{ color: 'var(--team-a-red)' }} className="text-lg md:text-xl truncate max-w-[120px]">{teamRedName}</span>
          </div>
          <span className="text-muted text-xl mx-2">VS</span>
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--team-b-white)' }} className="text-lg md:text-xl truncate max-w-[120px]">{teamWhiteName}</span>
            <span className="text-sm bg-gray-500/20 text-gray-300 px-2 py-1 rounded">計 {whiteWins} 勝</span>
          </div>
        </div>

        {/* Bout Recording Area */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex flex-col gap-2">
            <input 
              placeholder="赤選手名 (任意)" 
              className="bg-black/30 text-center text-sm p-2 rounded outline-none border border-transparent focus:border-red-500 transition-colors w-full"
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
          
          <div className="hidden sm:block w-[1px] bg-[var(--border-light)] self-stretch mx-1" />
          <div className="sm:hidden h-[1px] bg-[var(--border-light)] self-stretch my-2" />
          
          <div className="flex-1 flex flex-col gap-2">
            <input 
              placeholder="白選手名 (任意)" 
              className="bg-black/30 text-center text-sm p-2 rounded outline-none border border-transparent focus:border-gray-300 transition-colors w-full"
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
          <Button size="lg" className="w-full sm:w-auto self-center px-12" variant="primary" onClick={handleNextBout} disabled={isSaving}>
            {isSaving ? '保存中...' : (isLastBout ? '試合結果を確定する' : 'この対戦を確定して次へ')}
          </Button>
          
          <Button size="sm" variant="ghost" className="text-muted mx-auto">
            代表者戦を追加する
          </Button>
        </div>
      </Card>
    </div>
  );
}
