"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ZoomMode = "fit-width" | "fit-height" | "fit-screen" | "original";

interface PreferencesState {
  nsfwEnabled: boolean;
  readerMode: "paginated" | "vertical" | "double";
  readerTheme: "cream" | "dark" | "sepia";
  readerFontSize: number;
  language: string;
  // New in #4 — reader bandwidth saver. When true we request data-saver page
  // images from sources that support it.
  dataSaver: boolean;
  // New in #8 — per-title zoom & fit preference.
  zoomByTitle: Record<string, ZoomMode>;
  defaultZoom: ZoomMode;

  toggleNsfw: () => void;
  setReaderMode: (m: "paginated" | "vertical" | "double") => void;
  setReaderTheme: (t: "cream" | "dark" | "sepia") => void;
  setReaderFontSize: (n: number) => void;
  setLanguage: (l: string) => void;
  toggleDataSaver: () => void;
  setZoomForTitle: (mediaId: string, mode: ZoomMode) => void;
  setDefaultZoom: (mode: ZoomMode) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      nsfwEnabled: false,
      readerMode: "paginated",
      readerTheme: "cream",
      readerFontSize: 18,
      language: "en",
      dataSaver: false,
      zoomByTitle: {},
      defaultZoom: "fit-screen",
      toggleNsfw: () => set((s) => ({ nsfwEnabled: !s.nsfwEnabled })),
      setReaderMode: (readerMode) => set({ readerMode }),
      setReaderTheme: (readerTheme) => set({ readerTheme }),
      setReaderFontSize: (readerFontSize) => set({ readerFontSize }),
      setLanguage: (language) => set({ language }),
      toggleDataSaver: () => set((s) => ({ dataSaver: !s.dataSaver })),
      setZoomForTitle: (mediaId, mode) =>
        set((s) => ({ zoomByTitle: { ...s.zoomByTitle, [mediaId]: mode } })),
      setDefaultZoom: (defaultZoom) => set({ defaultZoom }),
    }),
    { name: "mangaverse:preferences:v1" }
  )
);
