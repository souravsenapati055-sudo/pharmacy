import { Navigate } from "react-router-dom";
import { getStoredUser } from "../lib/auth";

export default function ProtectedRoute({ user, children, requiredRole }) {
  // Fallback to checking localStorage if user prop is momentarily empty
  const activeUser = user || getStoredUser();

  if (!activeUser) {
    if (requiredRole === "admin") {
      return <Navigate to="/login/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const roleStr = String(activeUser.role || "").toLowerCase();
  const isAdmin =
    Boolean(activeUser.isAdmin) ||
    activeUser.isAdmin === 1 ||
    activeUser.isAdmin === "1" ||
    activeUser.isAdmin === "true" ||
    roleStr === "admin" ||
    roleStr.includes("admin");

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

