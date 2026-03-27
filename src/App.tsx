import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContext';

// Lazy load pages for performance (we can create them in the next steps)
import { Home } from './pages/Home';
import { MatchSetup } from './pages/MatchSetup';
import { MatchRecord } from './pages/MatchRecord';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="container">
          <header className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
            <h1 className="text-gradient hover:opacity-80 transition cursor-pointer" onClick={() => window.location.href = '/'}>
              剣道試合記録
            </h1>
          </header>
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/setup" element={<MatchSetup />} />
              <Route path="/match/:id" element={<MatchRecord />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
