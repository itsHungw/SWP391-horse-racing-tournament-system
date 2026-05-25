import { decodeAccessTokenPayload } from "./authSession";

export function getRolesFromAccessToken(accessToken: string | null): string[] {
  const payload = decodeAccessTokenPayload(accessToken);

  if (!Array.isArray(payload?.roles)) {
    return [];
  }

  return payload.roles.filter((role): role is string => typeof role === "string");
}
