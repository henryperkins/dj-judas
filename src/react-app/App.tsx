// src/App.tsx

import EnhancedLandingPage from "./components/EnhancedLandingPageV2";
import ThemeToggle from './components/ThemeToggle';
import { FacebookProvider } from 'react-facebook';

function App() {
  return (
    <FacebookProvider appId="YOUR_APP_ID">
      <div className="min-h-svh">
        <ThemeToggle />
        <EnhancedLandingPage />
      </div>
    </FacebookProvider>
  );
}

export default App;
