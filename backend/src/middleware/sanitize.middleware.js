/**
 * Input-sanitization middleware.
 *
 * We strip HTML tags from every string field on req.body / req.query /
 * req.params as a defence-in-depth measure. React auto-escapes text when
 * rendering, and Prisma parameterises all queries, so we intentionally do
 * NOT entity-encode characters like ' " & < > — doing that would break
 * legitimate search terms ("O'Brien") and mutate user passwords before
 * they reach bcrypt.
 *
 * Password fields are skipped entirely: they're hashed, never rendered,
 * and any transformation would silently change what the user actually typed.
 */

// Fields we never touch, no matter which route they arrive on.
const SKIP_FIELDS = new Set(['password', 'currentPassword', 'newPassword', 'confirmPassword']);

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/<[^>]*>/g, '');
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (SKIP_FIELDS.has(k)) return [k, v];
      if (typeof v === 'string') return [k, sanitizeString(v)];
      return [k, v];
    })
  );
}

export function sanitizeInputs(req, _res, next) {
  req.body   = sanitizeObject(req.body);
  req.query  = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  next();
}
