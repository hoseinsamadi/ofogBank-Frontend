export type AuthUser = {
  id: string;
  nationalCode: string;
  displayName: string;
  organizations: Array<{
    organizationId: string;
    organizationName: string;
    role: string;
  }>;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/backend/api/auth/me", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) return null;
  return (await response.json()) as AuthUser;
}

export async function getCsrfToken(): Promise<string> {
  const response = await fetch("/api/backend/api/auth/csrf", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("csrf-unavailable");
  const result = (await response.json()) as { requestToken?: string };
  if (!result.requestToken) throw new Error("csrf-unavailable");
  return result.requestToken;
}
