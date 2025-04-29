
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

const Index = () => {
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    // Initialize the app on load
    document.title = "Video Hub";
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white/50">Loading...</p>
      </div>
    );
  }

  // Redirect based on auth status
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  } else {
    return <Navigate to="/login" />;
  }
};

export default Index;
