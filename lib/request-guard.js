// Same-origin enforcement for state-changing / sensitive endpoints.
// Browsers attach an `Origin` header to cross-origin and (for POST)
// same-origin requests. Absence of `Origin` implies a non-browser client
// (curl, Paystack webhook server, service-to-service) and is allowed.

export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}