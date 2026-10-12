import "server-only";

type BackendUser = {
  roles?: unknown;
};

/** Validates the forwarded ASP.NET Identity cookie before a server route calls Shahin. */
export async function isSystemAdminRequest(request: Request): Promise<boolean> {
  const cookie = request.headers.get("cookie");
  if (!cookie) return false;

  const backendUrl = (process.env.BACKEND_URL ?? "http://localhost:5050").replace(/\/$/, "");
  try {
    const response = await fetch(`${backendUrl}/api/auth/me`, {
      headers: { cookie },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return false;
    const user = (await response.json()) as BackendUser;
    return Array.isArray(user.roles) && user.roles.includes("SystemAdmin");
  } catch {
    return false;
  }
}

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
