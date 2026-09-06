import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { findUserById } from "../models/user.model.js";
import { HttpError } from "../utils/httpError.js";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next(new HttpError(401, "Missing or invalid authorization header"));
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return next(new HttpError(401, "Invalid or expired token"));
  }

  return findUserById(payload.id)
    .then((user) => {
      if (!user || !user.isActive) {
        return next(new HttpError(401, "Account no longer exists"));
      }

      req.user = { id: user.id, role: user.role };
      return next();
    })
    .catch(next);
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return next();
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return next();
  }

  return findUserById(payload.id)
    .then((user) => {
      if (user && user.isActive) {
        req.user = { id: user.id, role: user.role };
      }
      return next();
    })
    .catch(() => next());
}

export function requireRole(...roles) {
  return function roleGuard(req, _res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have permission to access this resource"));
    }

    return next();
  };
}

export const requireAdmin = requireRole("admin");