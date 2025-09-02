// src/App.tsx

// Main CSS styles
import './index.css';
import EnhancedLandingPage from "./components/EnhancedLandingPageV2";
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <div className="min-h-svh">
      <ThemeToggle />
      <EnhancedLandingPage />
    </div>
  );
}

export default App;
