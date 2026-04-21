import { NextResponse } from "next/server";
import { updateApplicationStatus } from "@neomokdeul/db/store";
import type { ApplicationStatus } from "@neomokdeul/db";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { status, note } = await req.json();
  if (!["pending", "approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const updated = await updateApplicationStatus(id, status as ApplicationStatus, note);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}
