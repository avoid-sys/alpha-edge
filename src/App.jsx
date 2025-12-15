import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<div style={{padding: '20px'}}><h1>Dashboard</h1><p>Dashboard page</p></div>} />
        <Route path="/leaderboard" element={<div style={{padding: '20px'}}><h1>Leaderboard</h1><p>Leaderboard page</p></div>} />
      </Routes>
    </Router>
  );
}

export default App;
