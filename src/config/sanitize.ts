import { IOptions } from 'sanitize-html';

// Built from the tags/attributes actually present in the exports.
// Dropped deliberately:
//   style  - inline colours from Wahapedia's light theme, unreadable on ours
//   img    - hotlinks back to Wahapedia
//   data-tooltip-*, border, cellpadding, cellspacing, bordercolor, width
//            - presentation for Wahapedia's own stylesheet
// hrefs are kept relative (they already carry the edition); the client
// prefixes the origin at render time.
export const SANITIZE: IOptions = {
  allowedTags: [
    'b',
    'i',
    'em',
    'strong',
    'span',
    'br',
    'p',
    'div',
    'ul',
    'ol',
    'li',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'sup',
    'a',
  ],
  // `class` carries the meaning: kwb marks every game keyword. Classes are
  // not filtered further -- unknown ones are inert without Wahapedia's CSS.
  allowedAttributes: { '*': ['class'], a: ['class', 'href'] },
  allowedSchemesByTag: { a: ['https'] },
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
};

const LOOKS_LIKE_HTML = /<[a-z/][\s\S]*>/i;

/**
 * Only touch values that actually contain markup: sanitize-html escapes
 * entities, which would turn a plain name like `T'au & Co` into `T'au &amp; Co`.
 */
export const isHtml = (value: string): boolean =>
  LOOKS_LIKE_HTML.test(value);
