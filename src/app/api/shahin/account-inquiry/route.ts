import { inquireShahinAccount } from "@/lib/shahin/server";
import { isSameOriginRequest, isSystemAdminRequest } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ status: "unauthorized" }, { status: 403 });
  }
  if (!(await isSystemAdminRequest(request))) {
    return Response.json({ status: "unauthorized" }, { status: 401 });
  }

  let destination: unknown;
  try {
    const body = await request.json();
    destination = body?.destination;
  } catch {
    return Response.json({ status: "invalid_format" }, { status: 400 });
  }
  if (typeof destination !== "string" || destination.length > 40) {
    return Response.json({ status: "invalid_format" }, { status: 400 });
  }

  try {
    const result = await inquireShahinAccount(destination);
    return Response.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    // Never return vendor error bodies, tokens, or configuration values to the client.
    return Response.json(
      { status: "unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
