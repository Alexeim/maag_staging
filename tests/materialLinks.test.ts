import { expect, test, vi } from "vitest";

const api = vi.hoisted(() => ({
  list: vi.fn(async () => []),
  firstPersonList: vi.fn(async (): Promise<Record<string, unknown>[]> => []),
}));
vi.mock("../src/lib/api/api", () => ({
  articlesApi: { list: api.list },
  eventsApi: { list: api.list },
  flippersApi: { list: api.list },
  guidesApi: { list: api.list },
  interviewsApi: { list: api.list },
  newsApi: { list: api.list },
  photosOfTheDayApi: { list: api.list },
  visualStoriesApi: { list: api.list },
  firstPersonApi: { list: api.firstPersonList },
}));

import { fetchRelatedContentLists, MATERIAL_LINK_TYPE_OPTIONS } from "../src/lib/utils/relatedContent";
import { getLinkedContentTypeLabel } from "../src/lib/utils/contentBlockPreview";

test("link picker splits first-person variants from one request, including legacy documents", async () => {
  api.firstPersonList.mockResolvedValue([
    { id: "legacy" },
    { id: "first", variant: "first-person" },
    { id: "opinion", variant: "opinion" },
  ]);
  const lists = await fetchRelatedContentLists();
  expect(api.firstPersonList).toHaveBeenCalledTimes(1);
  expect(lists["first-person"].map((item) => item.id)).toEqual(["legacy", "first"]);
  expect(lists.opinion.map((item) => item.id)).toEqual(["opinion"]);
  expect(MATERIAL_LINK_TYPE_OPTIONS).toEqual(expect.arrayContaining([
    { value: "first-person", label: "От первого лица" },
    { value: "opinion", label: "Мнение" },
  ]));
  expect(getLinkedContentTypeLabel("first-person")).toBe("От первого лица");
  expect(getLinkedContentTypeLabel("opinion")).toBe("Мнение");
});
