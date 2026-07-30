/**
 * Role required to enter each workspace, keyed by URL prefix. Mirrors the
 * adminRoute / organizerRoute / ownerRoute / jockeyRoute / refereeRoute wrappers
 * in AppRouter — keep the two in step when a workspace is added.
 */
const roleProtectedPrefixes: Array<{ prefix: string; role: string }> = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/organizer", role: "ORGANIZER" },
  { prefix: "/owner", role: "HORSE_OWNER" },
  { prefix: "/jockey", role: "JOCKEY" },
  { prefix: "/referee", role: "REFEREE" },
];

/**
 * Routes that sit under a workspace prefix but only require a login. A spectator
 * applying to become an organizer has no ORGANIZER role yet, so /organizer/register
 * must stay reachable.
 */
const authOnlyExceptions = ["/organizer/register"];

function toPathname(path: string): string {
  // returnTo carries query and hash; access is decided by the path alone.
  const pathname = path.split("#")[0].split("?")[0];
  return pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function isUnder(pathname: string, prefix: string): boolean {
  // Segment-aware so "/ownerships" does not match the "/owner" workspace.
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function requiredRoleForPath(path: string): string | null {
  const pathname = toPathname(path);

  if (authOnlyExceptions.some((exception) => isUnder(pathname, exception))) {
    return null;
  }

  return roleProtectedPrefixes.find((item) => isUnder(pathname, item.prefix))?.role ?? null;
}

/**
 * Whether an account holding `roles` can enter `path`.
 *
 * Used to vet a post-login `returnTo`. The route guards store whichever route the
 * visitor was blocked from, including the route an admin was sitting on when they
 * logged out. Restoring that for the next account to log in on the same browser
 * drops them on the access-denied page instead of their own dashboard.
 */
export function canAccessPath(path: string, roles: string[]): boolean {
  const required = requiredRoleForPath(path);
  if (!required) {
    return true;
  }
  return roles.some((role) => role.toUpperCase() === required);
}
