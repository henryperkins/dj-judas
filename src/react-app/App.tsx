// src/App.tsx

import EnhancedLandingPage from "./components/EnhancedLandingPageV2";
import ThemeToggle from './components/ThemeToggle';
import './components/ThemeToggle.css';

function App() {
  return (
    <div className="min-h-svh">
      <ThemeToggle />
      <EnhancedLandingPage />
    </div>
  );
}

export default App;
