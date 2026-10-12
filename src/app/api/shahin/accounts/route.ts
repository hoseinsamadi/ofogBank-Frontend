import {
  readShahinAccountData,
  ShahinInputError,
  type AccountReadAction,
} from "@/lib/shahin/server";
import { isSameOriginRequest, isSystemAdminRequest } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS: AccountReadAction[] = ["list", "info", "balance", "statement"];
const NO_STORE = { "Cache-Control": "no-store" };

function str(value: unknown, max: number) {
  return typeof value === "string" && value.length <= max ? value : undefined;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ status: "unauthorized" }, { status: 403, headers: NO_STORE });
  }
  if (!(await isSystemAdminRequest(request))) {
    return Response.json({ status: "unauthorized" }, { status: 401, headers: NO_STORE });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: "invalid_request" }, { status: 400, headers: NO_STORE });
  }

  const action = body?.action as AccountReadAction;
  if (!ACTIONS.includes(action)) {
    return Response.json({ status: "invalid_request" }, { status: 400, headers: NO_STORE });
  }

  try {
    const data = await readShahinAccountData({
      action,
      sourceAccount: str(body.sourceAccount, 40),
      fromDate: str(body.fromDate, 8),
      toDate: str(body.toDate, 8),
      fromTime: str(body.fromTime, 6),
      toTime: str(body.toTime, 6),
    });
    return Response.json({ status: "ok", data }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ShahinInputError) {
      return Response.json(
        { status: "invalid_request" },
        { status: 400, headers: NO_STORE }
      );
    }
    // Never return vendor error bodies, tokens, or configuration values to the client.
    return Response.json({ status: "unavailable" }, { status: 502, headers: NO_STORE });
  }
}
