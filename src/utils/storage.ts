import { AnalysisResult } from '../types';

const STORAGE_KEY = 'do_this_saved_analyses_v1';

export function getSavedAnalyses(): AnalysisResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading saved analyses from localStorage:', err);
    return [];
  }
}

export function saveAnalysis(analysis: AnalysisResult): boolean {
  try {
    const items = getSavedAnalyses();
    // Avoid duplicate IDs
    const filtered = items.filter((item) => item.id !== analysis.id);
    const updated = [analysis, ...filtered];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Error saving analysis to localStorage:', err);
    return false;
  }
}

export function deleteAnalysis(id: string): boolean {
  try {
    const items = getSavedAnalyses();
    const updated = items.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Error deleting analysis:', err);
    return false;
  }
}

export function clearAllAnalyses(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('Error clearing analyses:', err);
    return false;
  }
}

export function isAnalysisSaved(id: string): boolean {
  const items = getSavedAnalyses();
  return items.some((item) => item.id === id);
}
