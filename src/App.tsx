
import React from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Startup from "./pages/Startup";
import JarvisInterface from "./pages/JarvisInterface";
import ImageGeneration from "./pages/ImageGeneration";
import JarvisSettings from "./components/JarvisSettings";
import JarvisModeEnhancer from './components/JarvisModeEnhancer';
import { JarvisChatProvider } from "./contexts/JarvisChatProvider";
import ErrorBoundary from './components/ErrorBoundary';
import FeaturesOverview from "./pages/FeaturesOverview";
import SatelliteSurveillancePage from "./pages/SatelliteSurveillance";
import OSINTSearch from "./pages/OSINTSearch";
import { AuthProvider } from "./contexts/AuthContext";
import { WeatherContextProvider } from "./features/WeatherContext";
import AuthPage from "./components/auth/AuthPage";
import Dashboard from "./components/dashboard/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import JarvisModeSwitcher from "./components/JarvisModeSwitcher";
import JarvisV2Interface from "./pages/JarvisV2Interface";
import JarvisOS from "./components/jarvisOS/JarvisOS";
import OAuthConsent from "./pages/OAuthConsent";
import AgentConnection from "./pages/AgentConnection";


function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <JarvisChatProvider>
          <WeatherContextProvider>
            <div className="app-container">
              <JarvisModeEnhancer>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                  <Route path="/connect" element={<ProtectedRoute><AgentConnection /></ProtectedRoute>} />
                  <Route path="/startup" element={<Startup />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <JarvisOS />
                    </ProtectedRoute>
                  } />
                  <Route path="/interface" element={<ProtectedRoute><JarvisInterface /></ProtectedRoute>} />
                  <Route path="/jarvis" element={<ProtectedRoute><JarvisInterface /></ProtectedRoute>} /> 
                  <Route path="/jarvis-v2" element={<ProtectedRoute><JarvisV2Interface /></ProtectedRoute>} />
                  <Route path="/code-zero" element={<ProtectedRoute><JarvisV2Interface /></ProtectedRoute>} />
                  <Route path="/ghost" element={<ProtectedRoute><JarvisV2Interface /></ProtectedRoute>} />
                  <Route path="/image-generation" element={<ProtectedRoute><ImageGeneration /></ProtectedRoute>} />
                  <Route path="/images" element={<ProtectedRoute><ImageGeneration /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><JarvisSettings /></ProtectedRoute>} />
                  <Route path="/features" element={<ProtectedRoute><FeaturesOverview /></ProtectedRoute>} />
                  <Route path="/satellite" element={<ProtectedRoute><SatelliteSurveillancePage /></ProtectedRoute>} />
                  <Route path="/osint" element={<ProtectedRoute><OSINTSearch /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </JarvisModeEnhancer>
            </div>
            <div style={{ position: 'fixed', bottom: '0', right: '0', zIndex: '1000' }}>
              <JarvisModeSwitcher />
            </div>
          </WeatherContextProvider>
        </JarvisChatProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
