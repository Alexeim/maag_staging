import type { ArticleResponse, FrenchArticleResponse } from "@/lib/api/api";

// French versions own their text and publication state. Source identity,
// images and editorial flags stay shared; machine review status is separate.
export const overlayFrenchArticle = (
  original: ArticleResponse,
  french: FrenchArticleResponse,
): ArticleResponse => {
  return {
    ...original,
    title: french.title,
    lead: french.lead,
    leadHtml: french.leadHtml,
    subtitle: french.subtitle,
    subtitleHtml: french.subtitleHtml,
    intro: french.intro,
    introHtml: french.introHtml,
    cardTitle: french.cardTitle,
    cardLead: french.cardLead,
    imageCaption: french.imageCaption,
    secondImageCaption: french.secondImageCaption,
    content: french.content,
    published: french.published,
    publishedAt: french.publishedAt ?? undefined,
  };
};
