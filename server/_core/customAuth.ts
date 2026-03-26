import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

const secret = new TextEncoder().encode(ENV.cookieSecret);

export type SessionPayload = {
  id: number;
  type: "candidate" | "admin" | "agency";
  email: string;
  name: string;
  agencyId?: number;
  iat?: number;
  exp?: number;
};

/**
 * Create a JWT session token
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT session token
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, secret);
    return verified.payload as SessionPayload;
  } catch (error) {
    return null;
  }
}
