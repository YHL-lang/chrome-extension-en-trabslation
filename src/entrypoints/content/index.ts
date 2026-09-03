import { extractArticle } from '@/lib/extractor';
import type { ArticleData, ExtractRequestMessage } from '@/lib/types';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if ((message as ExtractRequestMessage).type === 'EXTRACT_ARTICLE') {
        const result: ArticleData | null = extractArticle(document, location.href);
        sendResponse(result);
      }
    });
  },
});
