import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStudent?: boolean;
}

const ProtectedRoute: React.FC<Props> = ({
  children,
  requireAdmin,
  requireStudent
}) => {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStudent, setIsStudent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const role = localStorage.getItem("userRole");
        const userData = localStorage.getItem("userData");

        if (role && userData) {
          setIsAuthenticated(true);

          if (role === "admin") {
            setIsAdmin(true);
            setIsStudent(false);
          } else {
            setIsAdmin(false);
            setIsStudent(true);
          }
        } else {
          setIsAuthenticated(false);
        }

      } catch (error) {
        console.error("Auth error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  if (requireStudent && !isStudent) return <Navigate to="/" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;