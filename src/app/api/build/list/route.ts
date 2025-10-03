import { NextResponse } from "next/server";
import { jobStore } from "@/lib/jobs";

export async function GET() {
  return NextResponse.json({ items: jobStore.list(100) });
}


