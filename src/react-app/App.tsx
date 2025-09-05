// src/App.tsx

import EnhancedLandingPage from "./components/EnhancedLandingPageV2";
import ThemeToggle from './components/ThemeToggle';

function App() {
  // Facebook SDK is loaded via our internal metaSDK when needed.
  // Removing react-facebook provider prevents double-initialization.
  return (
    <div className="min-h-svh">
      <ThemeToggle />
      <EnhancedLandingPage />
    </div>
  );
}

export default App;
