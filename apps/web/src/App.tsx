import type { Location } from "react-router-dom";
import { Route, Routes, useLocation } from "react-router-dom";
import TaskOverlay from "./components/TaskOverlay";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";
import { SaSaActor } from "./features/sa-sa/SaSaActor";
import { SaSaProvider } from "./features/sa-sa/SaSaProvider";
import { SaSaSceneProvider } from "./features/sa-sa/SaSaSceneProvider";
import HomePage from "./pages/HomePage";
import SaSaPlaygroundPage from "./pages/SaSaPlaygroundPage";
import TaskPage from "./pages/TaskPage";

function App() {
  const location = useLocation();
  const state = location.state as { background?: Location } | null;
  const background = state?.background;

  return (
    <SaSaProvider>
      <SaSaSceneProvider>
        <div className="portfolio-shell">
          <SiteHeader />

          <main aria-label="Bryson Benjamin portfolio">
            <Routes location={background ?? location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/log/:id" element={<TaskPage />} />
              <Route path="/sa-sa/playground" element={<SaSaPlaygroundPage />} />
            </Routes>
          </main>

          {background && (
            <Routes>
              <Route path="/log/:id" element={<TaskOverlay />} />
            </Routes>
          )}

          <SiteFooter />
          <SaSaActor hidden={Boolean(background)} />
        </div>
      </SaSaSceneProvider>
    </SaSaProvider>
  );
}

export default App;
