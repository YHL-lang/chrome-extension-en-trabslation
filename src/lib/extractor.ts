import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import type { ArticleData } from './types';

export function extractArticle(doc: Document, url: string): ArticleData | null {
  const documentClone = doc.cloneNode(true) as Document;
  const article = new Readability(documentClone).parse();

  if (!article?.content) {
    return null;
  }

  const markdown = new TurndownService().turndown(article.content);

  return {
    title: article.title ?? doc.title ?? '',
    author: article.byline ?? '',
    url,
    markdown,
  };
}
