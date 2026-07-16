"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Category, Story } from "./types";
import { categories as seedCats } from "./seed";
import { useI18n, type Lang } from "./i18n";

type Ctx = {
  categories: Category[];
  stories: Story[];
  refresh: () => Promise<void>;
};
// Categories fall back to the reference taxonomy (also what the DB is seeded with);
// stories start empty — only real, admin/author-added stories ever appear.
const TaxonomyContext = createContext<Ctx>({ categories: seedCats, stories: [], refresh: async () => {} });

export function TaxonomyProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(seedCats);
  const [stories, setStories] = useState<Story[]>([]);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/taxonomy", { cache: "no-store" });
      const j = await r.json();
      if (j.categories) setCategories(j.categories);
      if (j.stories) setStories(j.stories);
    } catch {
      /* keep seed */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <TaxonomyContext.Provider value={{ categories, stories, refresh }}>{children}</TaxonomyContext.Provider>;
}

export const useTaxonomy = () => useContext(TaxonomyContext);

export function localizedName(c: Category, lang: Lang): string {
  if (lang === "uz" && c.nameUz) return c.nameUz;
  if (lang === "en" && c.nameEn) return c.nameEn;
  return c.name;
}

/** hook returning a (category) => localized name function */
export function useCatName() {
  const { lang } = useI18n();
  return (c: Category) => localizedName(c, lang);
}
