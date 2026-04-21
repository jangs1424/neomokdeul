import { NextResponse } from "next/server";
import { updateApplicationStatus } from "@neomokdeul/db/store";
import type { ApplicationStatus } from "@neomokdeul/db";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { ids, status } = (body ?? {}) as {
    ids?: unknown;
    status?: unknown;
  };

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((v) => typeof v === "string")) {
    return NextResponse.json({ error: "ids must be a non-empty string[]" }, { status: 400 });
  }
  if (typeof status !== "string" || !["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const results = await Promise.allSettled(
    (ids as string[]).map((id) =>
      updateApplicationStatus(id, status as ApplicationStatus),
    ),
  );

  const succeeded = results.filter((r) => r.status === "fulfilled" && r.value).length;
  const failed = results.length - succeeded;

  return NextResponse.json({
    total: results.length,
    succeeded,
    failed,
    status,
  });
}
