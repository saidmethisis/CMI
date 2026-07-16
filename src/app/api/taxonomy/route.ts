import { NextResponse } from "next/server";
import { withHandler } from "@/lib/api";
import { getCategories, getStories } from "@/lib/store";

// Public taxonomy feed consumed by the client TaxonomyProvider.
export const GET = withHandler(async () => {
  const [categories, stories] = await Promise.all([getCategories(), getStories()]);
  return NextResponse.json({ categories, stories });
});
