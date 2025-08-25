export function generateJoinCode(length = 6) {
  // Zeichen ohne 0/O und 1/I, damit nichts verwechselt wird
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}
