export function validatePvpTeam(team) {
  if (!Array.isArray(team) || team.length !== 3) {
    return { ok: false, error: 'Team must contain exactly 3 animals' };
  }
  return { ok: true };
}
