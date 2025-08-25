// src/App.tsx

import EnhancedLandingPage from "./components/EnhancedLandingPageV2";
import "./styles/mobile-optimized.css";

function App() {
  return (
    <div className="bg-background text-foreground min-h-svh">
      <EnhancedLandingPage />
    </div>
  );
}

export default App;
