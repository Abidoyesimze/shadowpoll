import { Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { PollApp } from './pages/PollApp';
import { CreatePoll } from './pages/CreatePoll';

export const App = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/app" element={<PollApp />} />
    <Route path="/app/:contractAddress" element={<PollApp />} />
    <Route path="/create" element={<CreatePoll />} />
  </Routes>
);
