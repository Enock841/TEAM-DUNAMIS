import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import {
  createCustomer,
  findUserByEmail,
  findUserById,
  findUserByPhone,
  findUserWithPasswordById,
  updateUserPassword,
  updateUserProfile,
  createPasswordReset,
  findValidPasswordReset,
  markPasswordResetUsed
} from "../models/user.model.js";
import { HttpError, notFound } from "../utils/httpError.js";
import { sendPasswordResetEmail } from "../utils/email.js";

const authSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(7).max(120),
  password: z.string().min(6),
  email: z.string().email(),
  area: z.string().max(120).optional()
});

const ghanaPhoneRegex = /^(0|\+233)[0-9]{9}$/;
const strongPasswordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(ghanaPhoneRegex, "Enter a valid Ghanaian phone number, e.g. 024 123 4567"),
  password: z.string().regex(strongPasswordRegex, "Password needs at least 8 characters, including a letter and a number"),
  email: z.string().email(),
  area: z.string().max(120).optional()
});

const profileSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal("")),
  area: z.string().max(120).optional(),
  avatarUrl: z.string().optional().or(z.literal(""))
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(6)
});

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    email: user.email || null,
    area: user.area || null,
    avatarUrl: user.avatar_url || null
  };
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, {
    expiresIn: "2h"
  });
}

export async function register(req, res) {
  const body = registerSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await createCustomer({
    name: body.name,
    phone: body.phone,
    passwordHash,
    email: body.email,
    area: body.area || null
  });
  res.status(201).json({ user: publicUser(user), token: signToken(user) });
}

export async function login(req, res) {
  const body = authSchema.omit({ name: true, email: true, area: true }).parse(req.body);
  const identifier = body.phone.trim();
  const user = identifier.includes("@")
    ? await findUserByEmail(identifier.toLowerCase())
    : await findUserByPhone(identifier);
  if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
    throw new HttpError(401, "Invalid login or password");
  }
  res.json({ user: publicUser(user), token: signToken(user) });
}

export async function me(req, res) {
  const user = await findUserById(req.user.id);
  if (!user) throw notFound("User not found");
  res.json({ user: publicUser(user) });
}

export async function updateProfile(req, res) {
  const user = await updateUserProfile(
    req.user.id,
    profileSchema.parse(req.body)
  );
  if (!user) throw notFound("User not found");
  res.json({ user: publicUser(user) });
}

export async function changePassword(req, res) {
  const body = passwordSchema.parse(req.body);
  const user = await findUserWithPasswordById(req.user.id);
  if (!user) throw notFound("User not found");
  if (!(await bcrypt.compare(body.currentPassword, user.password_hash))) {
    throw new HttpError(401, "Current password is incorrect");
  }

  const passwordHash = await bcrypt.hash(body.newPassword, 12);
  await updateUserPassword(user.id, passwordHash);
  res.json({ message: "Password updated successfully" });
}

const forgotSchema = z.object({
  identifier: z.string().trim().min(3).max(120)
});

const resetSchema = z.object({
  token: z.string().min(20).max(200),
  newPassword: z.string().regex(strongPasswordRegex, "Password needs at least 8 characters, including a letter and a number")
});

const FRONTEND_URL = (process.env.FRONTEND_URL || "https://berylsbeautymark-lac.vercel.app").replace(/\/+$/, "");

export async function forgotPassword(req, res) {
  const body = forgotSchema.parse(req.body);
  const identifier = body.identifier;
  const user = identifier.includes("@")
    ? await findUserByEmail(identifier.toLowerCase())
    : await findUserByPhone(identifier);

  if (user && user.email && user.is_active !== false) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await createPasswordReset(user.id, tokenHash, new Date(Date.now() + 60 * 60 * 1000));
    sendPasswordResetEmail(user.email, user.name, `${FRONTEND_URL}/#/reset-password?token=${token}`);
  }

  res.json({ message: "If an account matches, we have emailed a link to reset the password." });
}

export async function resetPassword(req, res) {
  const body = resetSchema.parse(req.body);
  const tokenHash = crypto.createHash("sha256").update(body.token).digest("hex");
  const reset = await findValidPasswordReset(tokenHash);
  if (!reset) {
    throw new HttpError(400, "This reset link is invalid or has expired. Please request a new one.");
  }
  const passwordHash = await bcrypt.hash(body.newPassword, 12);
  await updateUserPassword(reset.userId, passwordHash);
  await markPasswordResetUsed(reset.id);
  res.json({ message: "Your password has been changed. You can now sign in." });
}
