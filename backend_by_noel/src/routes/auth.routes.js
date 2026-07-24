import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { query } from "../db/pool.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();

const authSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(7).max(20),
  password: z.string().min(6)
});

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role
  };
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: "2h" });
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = authSchema.required({ name: true }).parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);

    const result = await query(
      `insert into users (name, phone, password_hash, role)
       values ($1, $2, $3, 'customer')
       returning id, name, phone, role`,
      [body.name, body.phone, passwordHash]
    );

    const user = result.rows[0];
    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = authSchema.omit({ name: true }).parse(req.body);
    const result = await query("select * from users where phone = $1", [body.phone]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(body.password, user.password_hash))) {
      throw new HttpError(401, "Invalid phone or password");
    }

    res.json({ user: publicUser(user), token: signToken(user) });
  })
);

export default router;
