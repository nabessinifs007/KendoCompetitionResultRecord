import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContext';
import { Home } from './pages/Home';
import { MatchSetup } from './pages/MatchSetup';
import { MatchRecord } from './pages/MatchRecord';
import { History } from './pages/History';
import { MatchDetail } from './pages/MatchDetail';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="container">
          <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
            <h1 className="text-gradient hover:opacity-80 transition cursor-pointer" onClick={() => window.location.href = '/'}>
              剣道試合記録
            </h1>
            <nav className="flex gap-4">
              <Link to="/" className="text-sm font-bold opacity-60 hover:opacity-100 transition">ホーム</Link>
              <Link to="/history" className="text-sm font-bold opacity-60 hover:opacity-100 transition">履歴</Link>
            </nav>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/setup" element={<MatchSetup />} />
              <Route path="/match/:id" element={<MatchRecord />} />
              <Route path="/history" element={<History />} />
              <Route path="/match-detail/:id" element={<MatchDetail />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
