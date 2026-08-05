import { getAnonId, getAuthContext } from "./auth";

export { canAccessTournament } from "./tournamentAccessCore";

export async function getOwnerContext() {
  const auth = await getAuthContext();
  const anonId = await getAnonId();
  return { auth, anonId };
}
