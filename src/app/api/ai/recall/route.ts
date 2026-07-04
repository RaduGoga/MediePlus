import { NextRequest, NextResponse } from "next/server";
import { aiRecall } from "@/lib/gemini";

// Sesiune → întrebare de fixare. Răspunsul NU se notează.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { titlu, materie, profil } = await req.json();
    const t = typeof titlu === "string" && titlu.trim() ? titlu : "sesiunea ta";
    const result = await aiRecall(
      t,
      typeof materie === "string" ? materie : undefined,
      typeof profil === "string" ? profil : undefined
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { intrebare: "Într-o frază, ce ai reținut din sesiunea asta?", reluare_zile: 3 },
      { status: 200 }
    );
  }
}
