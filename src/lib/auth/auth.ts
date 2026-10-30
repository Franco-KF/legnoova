/**
 * Public server-side auth surface.
 *
 * The rest of the app only ever imports `auth()` from here, so swapping the
 * implementation (NextAuth -> native stateless sessions) stays contained.
 */

export {
  auth,
  createSession,
  destroySession,
  getSessionToken,
  requireSession,
} from "./session";

export {
  claimsToSession,
  signSessionFromClaims,
  signSessionToken,
  verifySessionToken,
} from "./token";

export { sessionCookieOptions } from "./config";
export type { Session, SessionUser, SessionClaims } from "./types";
