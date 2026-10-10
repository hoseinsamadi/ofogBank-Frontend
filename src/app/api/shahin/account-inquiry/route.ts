import { inquireShahinAccount } from "@/lib/shahin/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // The current app login is a client-side mock, so do not expose this banking
  // proxy from a production deployment without adding real server auth first.
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return Response.json({ status: "unavailable" }, { status: 403 });
      }
    } catch {
      return Response.json({ status: "unavailable" }, { status: 403 });
    }
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
