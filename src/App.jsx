import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import CropRecommendation from "./pages/CropRecommendation";
import DiseaseDetection from "./pages/DiseaseDetection";
import History from "./pages/History";
import Notifications from "./pages/Notifications";
import RemediesInformation from "./pages/RemediesInformation";
import ExpertVerification from "./pages/ExpertVerification";
import AdminExpertApplications from "./pages/AdminExpertApplications";

function ProtectedRoute({
  children,
}) {
  const {
    currentUser,
    loading,
  } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (!currentUser.emailVerified) {
    return (
      <Navigate
        to="/verify-email"
        replace
      />
    );
  }

  return children;
}

function VerificationRoute({
  children,
}) {
  const {
    currentUser,
    loading,
  } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (currentUser.emailVerified) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

function PublicRoute({
  children,
}) {
  const {
    currentUser,
    loading,
  } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return children;
  }

  if (!currentUser.emailVerified) {
    return children;
  }

  return (
    <Navigate
      to="/dashboard"
      replace
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/verify-email"
          element={
            <VerificationRoute>
              <VerifyEmail />
            </VerificationRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/crop-recommendation"
          element={
            <ProtectedRoute>
              <CropRecommendation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/disease-detection"
          element={
            <ProtectedRoute>
              <DiseaseDetection />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/remedies-information"
          element={
            <ProtectedRoute>
              <RemediesInformation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/expert-verification"
          element={
            <ProtectedRoute>
              <ExpertVerification />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/expert-applications"
          element={
            <ProtectedRoute>
              <AdminExpertApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/admin/expert-applications"
          element={
            <ProtectedRoute>
              <AdminExpertApplications />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;