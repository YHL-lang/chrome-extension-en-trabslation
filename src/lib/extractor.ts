import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import type { ArticleData } from './types';

export function extractArticle(doc: Document, url: string): ArticleData | null {
  const documentClone = doc.cloneNode(true) as Document;
  const article = new Readability(documentClone).parse();

  if (!article?.content) {
    return null;
  }

  // 用 ATX 标题、围栏代码块等结构化配置，避免 Setext 标题（---）与水平线混淆，利于翻译时保留结构
  const turndown = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
  });
  const markdown = turndown.turndown(article.content);

  return {
    title: article.title ?? doc.title ?? '',
    author: article.byline ?? '',
    url,
    markdown,
  };
}
