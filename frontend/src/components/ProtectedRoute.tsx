
import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const accessToken = localStorage.getItem("access_token");

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
