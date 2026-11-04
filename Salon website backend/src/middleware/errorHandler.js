import { ZodError } from "zod";

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    console.error("Validation failed:", JSON.stringify(err.flatten()));
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten()
    });
  }
  if (err.code === "23505") {
    const detail = String(err.detail || "") + " " + String(err.constraint || "");
    let what = "That record";
    if (/phone/i.test(detail)) what = "An account with that phone number";
    else if (/email/i.test(detail)) what = "An account with that email";
    return res.status(409).json({
      error: what + " already exists. Please log in with your phone number and email instead."
    });
  }
  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message;
  if (status === 500) {
    console.error(err);
  }
  return res.status(status).json({
    error: message,
    details: err.details
  });
}