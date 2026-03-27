import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-2xl mb-2">大会・試合記録システム</h2>
        <p className="text-muted">新しい試合を記録するか、過去の記録を表示します。</p>
      </div>

      <div className="flex justify-center mt-4">
        <Button size="lg" onClick={() => navigate('/setup')}>
          新しい試合を記録する
        </Button>
      </div>

      <div className="mt-8">
        <h3 className="text-xl mb-4 border-b pb-2" style={{ borderColor: 'var(--border-light)' }}>
          最近の試合
        </h3>
        <Card>
          <p className="text-muted text-center py-4">データがありません</p>
        </Card>
      </div>
    </div>
  );
}
