export function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s) {
    console.warn('[jwt] JWT_SECRET is not set; using insecure dev default. Set JWT_SECRET in production.');
    return 'dev-insecure-change-me';
  }
  return s;
}
