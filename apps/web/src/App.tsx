import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AuthPage from './pages/Auth';
import './styles/darkMode.css';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './pages/dashboard/Overview';
import Surveys from './pages/dashboard/Surveys';
import Results from './pages/dashboard/Results';
import Templates from './pages/dashboard/Templates';
import SurveyBuilder from './pages/dashboard/SurveyBuilder';
import SurveyRenderer from './pages/SurveyRenderer';
import SurveyPreview from './pages/SurveyPreview';
import ThankYou from './pages/ThankYou';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
  
          <Route path="/s/:slug" element={<SurveyRenderer />} />
          <Route path="/s/:slug/thank-you" element={<ThankYou />} />
          <Route path="/preview/:slug" element={<SurveyPreview />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="surveys" element={<Surveys />} />
          <Route path="surveys/new" element={<SurveyBuilder />} />
          <Route path="surveys/:surveyId/edit" element={<SurveyBuilder />} />
          <Route path="surveys/:surveyId/view" element={<SurveyBuilder viewMode={true} />} />
          <Route path="results" element={<Results />} />
          <Route path="results/:surveyId" element={<Results />} />
          <Route path="templates" element={<Templates />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
