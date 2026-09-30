import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import mongoose from "mongoose";
import type { AuthenticatedUser, AuthSession, UserRole } from "@resolveai/shared";
import { UserModel, toAuthenticatedUser } from "../models/User.js";

const scryptAsync = promisify(scrypt);

const tokenExpiresIn = "1d";

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  department?: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

interface AuthTokenPayload {
  sub: string;
  role: UserRole;
}

interface DevelopmentUserRecord extends AuthenticatedUser {
  passwordHash: string;
}

const developmentUsersByEmail = new Map<string, DevelopmentUserRecord>();
const developmentUsersById = new Map<string, DevelopmentUserRecord>();

export class AuthenticationError extends Error {
  constructor(message = "Invalid email or password") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export async function registerUser(input: RegisterUserInput): Promise<AuthSession> {
  const email = normalizeEmail(input.email);

  if (!isDatabaseConnected()) {
    return registerDevelopmentUser({ ...input, email });
  }

  const existing = await UserModel.exists({ email });

  if (existing) {
    throw new ConflictError("A user with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await UserModel.create({
    name: input.name,
    email,
    passwordHash,
    role: input.role ?? "USER",
    department: input.department,
    phone: input.phone
  });

  return issueSession(toAuthenticatedUser(user));
}

export async function loginUser(input: LoginInput): Promise<AuthSession> {
  const email = normalizeEmail(input.email);

  if (!isDatabaseConnected()) {
    return loginDevelopmentUser({ ...input, email });
  }

  const user = await UserModel.findOne({ email }).select("+passwordHash");

  if (!user || !user.active) {
    throw new AuthenticationError();
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthenticationError();
  }

  return issueSession(toAuthenticatedUser(user));
}

export async function getUserFromToken(token: string): Promise<AuthenticatedUser> {
  const payload = verifyToken(token);

  if (!isDatabaseConnected()) {
    const user = developmentUsersById.get(payload.sub);

    if (!user || !user.active) {
      throw new AuthenticationError("User is no longer active");
    }

    return toPublicDevelopmentUser(user);
  }

  const user = await UserModel.findById(payload.sub);

  if (!user || !user.active) {
    throw new AuthenticationError("User is no longer active");
  }

  return toAuthenticatedUser(user);
}

export function issueSession(user: AuthenticatedUser): AuthSession {
  const options: SignOptions = { expiresIn: tokenExpiresIn };
  const token = jwt.sign({ role: user.role }, getJwtSecret() as Secret, { ...options, subject: user.id });
  return { user, token };
}

export function resetDevelopmentAuthStore() {
  developmentUsersByEmail.clear();
  developmentUsersById.clear();
}

async function registerDevelopmentUser(input: RegisterUserInput): Promise<AuthSession> {
  const email = normalizeEmail(input.email);

  if (developmentUsersByEmail.has(email)) {
    throw new ConflictError("A user with this email already exists");
  }

  const user: DevelopmentUserRecord = {
    id: randomUUID(),
    name: input.name,
    email,
    role: input.role ?? "USER",
    department: input.department,
    phone: input.phone,
    active: true,
    passwordHash: await hashPassword(input.password)
  };

  developmentUsersByEmail.set(user.email, user);
  developmentUsersById.set(user.id, user);

  return issueSession(toPublicDevelopmentUser(user));
}

async function loginDevelopmentUser(input: LoginInput): Promise<AuthSession> {
  const user = developmentUsersByEmail.get(normalizeEmail(input.email));

  if (!user || !user.active) {
    throw new AuthenticationError();
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthenticationError();
  }

  return issueSession(toPublicDevelopmentUser(user));
}

function toPublicDevelopmentUser(user: DevelopmentUserRecord): AuthenticatedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone,
    active: user.active
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, key] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !key) {
    return false;
  }

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(key, "hex");

  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}

function getJwtSecret() {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }

  return "resolveai-development-jwt-secret";
}

function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

function verifyToken(token: string): AuthTokenPayload {
  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;

    if (!payload.sub || !payload.role) {
      throw new AuthenticationError("Invalid token payload");
    }

    return payload;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    throw new AuthenticationError("Invalid or expired token");
  }
}
