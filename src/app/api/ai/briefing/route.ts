import { NextRequest, NextResponse } from "next/server";
import { aiBriefing } from "@/lib/gemini";

// Plan + stare → text scurt (max 2 fraze) pe vocea lui Lumi.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = await aiBriefing({
      nrTaskuri: Number(body?.nrTaskuri) || 0,
      minuteFocus: Number(body?.minuteFocus) || 0,
      stare: body?.stare === "recovery" ? "recovery" : "normal",
      streak: Number(body?.streak) || 0,
      celMaiImportant: typeof body?.celMaiImportant === "string" ? body.celMaiImportant : undefined,
      profil: typeof body?.profil === "string" ? body.profil : undefined,
    });
    return NextResponse.json({ text });
  } catch {
    return NextResponse.json(
      { text: "Bună! Hai să prindem ritm azi — o sesiune bună schimbă toată ziua." },
      { status: 200 }
    );
  }
}
