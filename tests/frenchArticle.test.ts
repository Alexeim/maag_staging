import { expect, test } from "vitest";
import type { ArticleResponse, FrenchArticleResponse } from "../src/lib/api/api";
import { overlayFrenchArticle } from "../src/lib/utils/frenchArticle";

test("French text and publication state replace the source while keeping its identity", () => {
  const source = {
    id: "source", title: "Русский текст", published: true,
    publishedAt: "2026-10-22", imageUrl: "image.jpg", category: "culture",
  } as ArticleResponse;
  const french = {
    id: "translation", sourceId: "source", title: "Texte français",
    published: false, publishedAt: null, content: [],
  } as unknown as FrenchArticleResponse;
  expect(overlayFrenchArticle(source, french)).toMatchObject({
    id: "source", title: "Texte français", imageUrl: "image.jpg",
    published: false, publishedAt: undefined, category: "culture",
  });
  expect(overlayFrenchArticle(source, { ...french, published: true, publishedAt: "2026-10-27" }))
    .toMatchObject({ published: true, publishedAt: "2026-10-27" });
});
