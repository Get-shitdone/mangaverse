// MangaDex adapter — wraps existing lib/api/mangadex.ts behind the unified
// ChapterSourceAdapter contract.

import {
  findFirstMangaForTitle,
  getChapters as mdGetChapters,
  getChapterPages,
  coverUrl,
} from "@/lib/api/mangadex";
import type { ChapterSourceAdapter } from "./types";

export const mangadexAdapter: ChapterSourceAdapter = {
  id: "mangadex",
  name: "MangaDex",
  priority: 10, // primary
  available: () => true,

  async resolve(title) {
    try {
      const md = await findFirstMangaForTitle(title);
      if (!md) return null;
      return {
        sourceId: md.id,
        title: md.title,
        coverUrl: md.coverFileName ? coverUrl(md.id, md.coverFileName, 512) : null,
      };
    } catch {
      return null;
    }
  },

  async getChapters(sourceId) {
    try {
      const list = await mdGetChapters(sourceId, "en", 200, 0, { hostableOnly: true });
      return list.chapters;
    } catch {
      return [];
    }
  },

  async getPages(_sourceId, chapterId) {
    try {
      const pages = await getChapterPages(chapterId);
      return {
        pages: pages.pageUrls,
        pagesDataSaver: pages.dataSaver?.map(
          (file) =>
            `/api/proxy-image?url=${encodeURIComponent(`${pages.baseUrl}/data-saver/${pages.hash}/${file}`)}`
        ),
      };
    } catch {
      return { pages: [] };
    }
  },
};
