import type { SurveyDraft, Answer, HouseholdType } from "./types";

const DRAFT_KEY = "sal_quiz_draft";

export function saveDraft(draft: SurveyDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, lastSavedAt: new Date().toISOString() }));
  } catch {
    // localStorage might not be available in SSR or private mode
  }
}

export function loadDraft(): SurveyDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SurveyDraft;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function createDraft(
  householdType: HouseholdType,
  cityName: string | null
): SurveyDraft {
  return {
    householdType,
    cityName,
    answers: {},
    startedAt: new Date().toISOString(),
    lastSavedAt: new Date().toISOString(),
  };
}

export function updateDraftAnswer(
  draft: SurveyDraft,
  productId: number,
  answer: Answer
): SurveyDraft {
  return {
    ...draft,
    answers: { ...draft.answers, [productId]: answer },
    lastSavedAt: new Date().toISOString(),
  };
}

export function getDraftCompletionCount(draft: SurveyDraft, total: number): number {
  return Math.min(Object.keys(draft.answers).length, total);
}
