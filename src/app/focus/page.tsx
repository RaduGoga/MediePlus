"use client";

import { Suspense } from "react";
import { FocusSession } from "@/components/FocusSession";

export default function FocusPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-pulse rounded-xl2 bg-slate-100" />}>
      <FocusSession />
    </Suspense>
  );
}
