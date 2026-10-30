export type SessionPlan = string | null | undefined;

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  plan?: SessionPlan;
  brokerAutomationEnabled?: boolean;
  csrf?: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

export interface SessionClaims {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  plan?: SessionPlan;
  brokerAutomationEnabled?: boolean;
  csrf: string;
  typ: "session";
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface OAuthClaims {
  state: string;
  verifier: string;
  cb: string;
  typ: "oauth";
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface AdminClaims {
  sub: string;
  typ: "admin";
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
}
