"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PreferencesState {
  nsfwEnabled: boolean;
  readerMode: "paginated" | "vertical" | "double";
  readerTheme: "cream" | "dark" | "sepia";
  readerFontSize: number;
  language: string;
  toggleNsfw: () => void;
  setReaderMode: (m: "paginated" | "vertical" | "double") => void;
  setReaderTheme: (t: "cream" | "dark" | "sepia") => void;
  setReaderFontSize: (n: number) => void;
  setLanguage: (l: string) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      nsfwEnabled: false,
      readerMode: "paginated",
      readerTheme: "cream",
      readerFontSize: 18,
      language: "en",
      toggleNsfw: () => set((s) => ({ nsfwEnabled: !s.nsfwEnabled })),
      setReaderMode: (readerMode) => set({ readerMode }),
      setReaderTheme: (readerTheme) => set({ readerTheme }),
      setReaderFontSize: (readerFontSize) => set({ readerFontSize }),
      setLanguage: (language) => set({ language }),
    }),
    { name: "mangaverse:preferences:v1" }
  )
);
