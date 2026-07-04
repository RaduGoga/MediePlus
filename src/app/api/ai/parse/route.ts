import { NextRequest, NextResponse } from "next/server";
import { aiParse } from "@/lib/gemini";

// Frază → taskuri (JSON). Cheia Gemini stă pe server; fallback local.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { text, date } = await req.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ tasks: [] });
    }
    const dateISO = typeof date === "string" && date ? date : new Date().toISOString().slice(0, 10);
    const tasks = await aiParse(text, dateISO);
    return NextResponse.json({ tasks });
  } catch {
    return NextResponse.json({ tasks: [], error: "parse_failed" }, { status: 200 });
  }
}
