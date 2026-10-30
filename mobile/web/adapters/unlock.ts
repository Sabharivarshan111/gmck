// Website checkout stays on the same origin as its Google session.
export const LINK_OUT = true;
export const UNLOCK_URL = `${location.origin}/unlock`;
export function openUnlock(): void { location.assign('/unlock?plan=adfree_1y'); }
