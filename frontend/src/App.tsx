import { Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { PollApp } from './pages/PollApp';

export const App = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/app" element={<PollApp />} />
  </Routes>
);
