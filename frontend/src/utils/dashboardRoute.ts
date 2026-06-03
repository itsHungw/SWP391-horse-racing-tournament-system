const rolePriorityRoutes: Array<{ role: string; route: string }> = [
  { role: "ADMIN", route: "/admin" },
  { role: "HORSE_OWNER", route: "/owner/dashboard" },
  { role: "JOCKEY", route: "/jockey/dashboard" },
  { role: "REFEREE", route: "/referee/dashboard" },
];

export function getDashboardRouteForRoles(roles: string[]) {
  const normalizedRoles = new Set(roles.map((role) => role.toUpperCase()));
  return rolePriorityRoutes.find((item) => normalizedRoles.has(item.role))?.route ?? "/spectator/dashboard";
}
