"use client";

import { useSettings } from "@/hooks/useData";
import { profileShort, reopenOnboarding } from "@/lib/settings";

// Rezumatul profilului din quiz + buton de refăcut. „Schimbă" redeschide
// quiz-ul (overlay-ul de onboarding) cu răspunsurile pre-completate.
export function ProfileCard() {
  const settings = useSettings();
  if (!settings) return null;

  return (
    <div className="card flex items-center justify-between gap-3">
      <div className="min-w-0">
        <span className="label">Profilul tău</span>
        <p className="mt-1 truncate text-sm text-slate">{profileShort(settings)}</p>
      </div>
      <button
        className="btn-ghost shrink-0 text-sm"
        onClick={() => reopenOnboarding()}
      >
        Schimbă
      </button>
    </div>
  );
}
