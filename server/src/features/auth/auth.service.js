import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma.js';
import { JWT_SECRET } from '../../config/env.js';

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}

export async function register(email, password) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error('Email already in use'), { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({ data: { email, passwordHash } });

  return { token: signToken(user), user: { id: user.id, email: user.email } };
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  const invalid = Object.assign(new Error('Invalid credentials'), { status: 401 });

  if (!user) throw invalid;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw invalid;

  return { token: signToken(user), user: { id: user.id, email: user.email } };
}
