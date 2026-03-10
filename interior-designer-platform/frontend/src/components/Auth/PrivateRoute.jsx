import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Restricts access by role. Redirects to /login if not authenticated,
 * or to / if authenticated but role not in allowedRoles.
 */
export default function PrivateRoute({ user, token, allowedRoles, children }) {
  if (!token || !user) return <Navigate to="/login" replace />;
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
