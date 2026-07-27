import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { User, UserRole } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'asr-security-jwt-secret-key-2024'
);

const COOKIE_NAME = 'asr-session';

export interface TokenPayload {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

export async function createToken(user: Pick<User, '_id' | 'name' | 'email' | 'role'>): Promise<string> {
  return new SignJWT({
    userId: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 12, // 12 hours
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Role permission checks
const ROLE_HIERARCHY: Record<UserRole, number> = {
  superadmin: 5,
  admin: 4,
  manager: 3,
  supervisor: 2,
  officer: 1,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canCreate(role: UserRole): boolean {
  return ['superadmin', 'admin', 'officer', 'supervisor'].includes(role);
}

export function canEdit(role: UserRole, isOwner: boolean): boolean {
  if (role === 'superadmin' || role === 'admin' || role === 'supervisor') return true;
  if (role === 'officer' && isOwner) return true;
  return false;
}

export function canDelete(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin';
}

export function canViewAll(role: UserRole): boolean {
  return ['superadmin', 'admin', 'supervisor', 'manager'].includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'superadmin' || role === 'admin';
}

export function canGenerateReports(role: UserRole): boolean {
  return ['superadmin', 'admin', 'supervisor', 'manager'].includes(role);
}

export function canApprovePlayback(role: UserRole): boolean {
  return ['superadmin', 'admin', 'supervisor'].includes(role);
}

export function canCloseIncidents(role: UserRole): boolean {
  return ['superadmin', 'admin', 'supervisor'].includes(role);
}
