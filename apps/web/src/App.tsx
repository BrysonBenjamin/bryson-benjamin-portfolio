import { Mail } from "lucide-react";
import type { Location } from "react-router-dom";
import { Route, Routes, useLocation } from "react-router-dom";
import HomePage from "./pages/HomePage";
import TaskPage from "./pages/TaskPage";
import TaskOverlay from "./components/TaskOverlay";

function App() {
  const location = useLocation();
  const state = location.state as { background?: Location } | null;
  const background = state?.background;

  return (
    <main className="construction-shell" aria-label="Bryson Benjamin portfolio">
      <div className="ambient-grid" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="/" aria-label="Bryson Benjamin home">
          <span className="brand-mark">BB</span>
          <span>brysonbenjamin.com</span>
        </a>
        <a className="contact-link" href="mailto:hello@brysonbenjamin.com">
          <Mail size={17} aria-hidden="true" />
          <span>hello@brysonbenjamin.com</span>
        </a>
      </header>

      <Routes location={background ?? location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/log/:id" element={<TaskPage />} />
      </Routes>

      {background && (
        <Routes>
          <Route path="/log/:id" element={<TaskOverlay />} />
        </Routes>
      )}
    </main>
  );
}

export default App;
