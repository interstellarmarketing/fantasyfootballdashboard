// lib/api.ts
export const fetchJSON = (p: string) => fetch(p).then(r => r.json());
