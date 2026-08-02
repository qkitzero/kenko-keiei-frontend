import { client as authClient } from "@/app/api/auth/client";
import { measurementClient } from "@/app/api/fitness/client";

export type StaffIdResult =
  { ok: true; staffId: string } | { ok: false; status: number; error: unknown };

export async function resolveStaffId(
  accessToken: string,
): Promise<StaffIdResult> {
  const { data, response } = await authClient.POST("/v1/verify", {
    body: {},
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const staffId = data?.userId?.trim() ?? "";
  if (!staffId) {
    return {
      ok: false,
      status: response.ok ? 500 : response.status,
      error: { message: "failed to resolve the signed in staff" },
    };
  }

  return { ok: true, staffId };
}

export async function resolveMeasuredBy(
  accessToken: string,
  measurementId: string,
): Promise<StaffIdResult> {
  const { data, error, response } = await measurementClient.GET(
    "/v1/measurement/{measurementId}",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { path: { measurementId } },
    },
  );

  if (!response.ok) {
    return { ok: false, status: response.status, error };
  }

  const staffId = data?.measurement?.measuredBy?.trim() ?? "";
  if (staffId) return { ok: true, staffId };

  return resolveStaffId(accessToken);
}
