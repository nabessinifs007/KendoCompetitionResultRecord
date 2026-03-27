import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { getPositionNames } from '../lib/kendoLogic';
import { useToast } from '../components/ui/ToastContext';
import { getCourts, createCourt, createMatch } from '../lib/api';
import type { Court } from '../lib/types';

export function MatchSetup() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [matchType, setMatchType] = useState<'individual' | 'team'>('team');
  const [teamSize, setTeamSize] = useState<number>(5);

  const [teamRed, setTeamRed] = useState('');
  const [teamWhite, setTeamWhite] = useState('');
  
  // 選手名管理用のState
  const [playerRedNames, setPlayerRedNames] = useState<string[]>(Array(5).fill(''));
  const [playerWhiteNames, setPlayerWhiteNames] = useState<string[]>(Array(5).fill(''));
  const [showPlayerInputs, setShowPlayerInputs] = useState(false);

  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [newCourtName, setNewCourtName] = useState('');
  const [isAddingCourt, setIsAddingCourt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const data = await getCourts();
        setCourts(data);
        if (data.length > 0) setSelectedCourtId(data[0].id);
      } catch (err) {
        addToast('試合場の読み込みに失敗しました。Supabaseの設定を確認してください。', 'error');
        console.error('Fetch courts error:', err);
      }
    };
    fetchCourts();
  }, [addToast]);

  // 人数変更に合わせて配列サイズを調整
  useEffect(() => {
    const size = matchType === 'team' ? teamSize : 1;
    setPlayerRedNames(prev => {
      const next = [...prev];
      if (next.length < size) {
        return [...next, ...Array(size - next.length).fill('')];
      }
      return next.slice(0, size);
    });
    setPlayerWhiteNames(prev => {
      const next = [...prev];
      if (next.length < size) {
        return [...next, ...Array(size - next.length).fill('')];
      }
      return next.slice(0, size);
    });
  }, [teamSize, matchType]);

  const handleAddCourt = async () => {
    if (!newCourtName.trim()) return;
    try {
      const added = await createCourt(newCourtName);
      setCourts([...courts, added]);
      setSelectedCourtId(added.id);
      setNewCourtName('');
      setIsAddingCourt(false);
      addToast('試合場を追加しました', 'success');
    } catch (err) {
      addToast('試合場の作成に失敗しました', 'error');
      console.error('Create court error:', err);
    }
  };

  const handlePlayerNameChange = (team: 'red' | 'white', index: number, value: string) => {
    if (team === 'red') {
      const next = [...playerRedNames];
      next[index] = value;
      setPlayerRedNames(next);
    } else {
      const next = [...playerWhiteNames];
      next[index] = value;
      setPlayerWhiteNames(next);
    }
  };

  const PRESET_TEAM_SIZES = [3, 5, 7, 8, 9, 10, 11, 14, 15];

  const handleStartMatch = async () => {
    if (!teamRed || !teamWhite) return addToast('チーム名を入力してください', 'error');
    
    setIsLoading(true);
    try {
      const match = await createMatch({
        court_id: selectedCourtId || null,
        match_type: matchType,
        team_size: matchType === 'team' ? teamSize : 1,
        team_red_name: teamRed,
        team_white_name: teamWhite,
        player_red_names: playerRedNames,
        player_white_names: playerWhiteNames,
        status: 'in_progress',
        winner: null,
      });

      navigate(`/match/${match.id}?size=${match.team_size}`);
    } catch (err) {
      addToast('試合の作成に失敗しました。（DBエラー）', 'error');
      console.error('Match creation error:', err);
      
      const fallbackId = Math.random().toString(36).substring(2, 10);
      navigate(`/match/${fallbackId}?size=${matchType === 'team' ? teamSize : 1}&fallback=true`);
    } finally {
      setIsLoading(false);
    }
  };

  const positions = getPositionNames(matchType === 'team' ? teamSize : 1);

  return (
    <div className="flex flex-col gap-6 animate-fade-in max-w-lg mx-auto pb-10">
      <h2 className="text-2xl text-center font-bold">試合設定</h2>

      <Card className="flex flex-col gap-6">
        {/* 試合場選択 */}
        <div className="bg-black/20 p-4 rounded border border-white/5">
          <label className="text-sm text-muted mb-2 block">試合場（Court）選択</label>
          {!isAddingCourt ? (
            <div className="flex gap-2">
              <select 
                value={selectedCourtId}
                onChange={e => setSelectedCourtId(e.target.value)}
                className="input-field flex-1"
                style={{ appearance: 'none' }}
              >
                <option value="">-- 指定なし --</option>
                {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button variant="secondary" onClick={() => setIsAddingCourt(true)}>追加</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input 
                placeholder="新しい試合場名..." 
                value={newCourtName}
                onChange={e => setNewCourtName(e.target.value)}
              />
              <Button variant="primary" onClick={handleAddCourt}>保存</Button>
              <Button variant="ghost" onClick={() => setIsAddingCourt(false)}>戻る</Button>
            </div>
          )}
        </div>

        {/* 形式選択 */}
        <div>
          <label className="text-sm text-muted mb-2 block">試合形式</label>
          <div className="flex gap-2">
            <Button 
              variant={matchType === 'team' ? 'primary' : 'secondary'} 
              onClick={() => setMatchType('team')}
              fullWidth
            >
              団体戦
            </Button>
            <Button 
              variant={matchType === 'individual' ? 'primary' : 'secondary'} 
              onClick={() => setMatchType('individual')}
              fullWidth
            >
              個人戦
            </Button>
          </div>
        </div>

        {/* 人数設定 */}
        {matchType === 'team' && (
          <div className="animate-fade-in">
            <label className="text-sm text-muted mb-3 block">団体戦の人数設定</label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_TEAM_SIZES.map(size => (
                <Button 
                  key={size}
                  variant={teamSize === size ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setTeamSize(size)}
                  className="px-3"
                >
                  {size}名
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* チーム名・選手名 */}
        <div className="flex flex-col gap-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="赤 チーム名" 
              placeholder="例: 赤チーム" 
              value={teamRed}
              onChange={e => setTeamRed(e.target.value)}
            />
            <Input 
              label="白 チーム名" 
              placeholder="例: 白チーム" 
              value={teamWhite}
              onChange={e => setTeamWhite(e.target.value)}
            />
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            className="text-muted"
            onClick={() => setShowPlayerInputs(!showPlayerInputs)}
          >
            {showPlayerInputs ? '▲ 選手名入力を閉じる' : '▼ 選手名を入力する (任意)'}
          </Button>

          {showPlayerInputs && (
            <div className="flex flex-col gap-4 p-4 bg-black/20 rounded-lg border border-white/5 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-1">Red Players</span>
                  {positions.map((pos, idx) => (
                    <div key={`red-${idx}`} className="flex items-center gap-2">
                      <span className="text-[10px] w-8 opacity-50">{pos}</span>
                      <input 
                        className="bg-black/30 text-xs p-1.5 rounded border border-white/5 focus:border-red-500 outline-none w-full"
                        value={playerRedNames[idx] || ''}
                        onChange={e => handlePlayerNameChange('red', idx, e.target.value)}
                        placeholder={`${pos}名`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">White Players</span>
                  {positions.map((pos, idx) => (
                    <div key={`white-${idx}`} className="flex items-center gap-2">
                      <span className="text-[10px] w-8 opacity-50">{pos}</span>
                      <input 
                        className="bg-black/30 text-xs p-1.5 rounded border border-white/5 focus:border-gray-400 outline-none w-full"
                        value={playerWhiteNames[idx] || ''}
                        onChange={e => handlePlayerNameChange('white', idx, e.target.value)}
                        placeholder={`${pos}名`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <Button size="lg" className="mt-4" onClick={handleStartMatch} disabled={isLoading}>
          {isLoading ? '試合を作成中...' : '試合開始！'}
        </Button>
      </Card>
    </div>
  );
}
