import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, children, requiredRole }) {
  if (!user) {
    if (requiredRole === "admin") {
      return <Navigate to="/login/admin" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const isAdmin = user.role === "admin" || user.isAdmin === true;
  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
