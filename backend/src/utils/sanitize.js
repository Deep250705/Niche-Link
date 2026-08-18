/**
 * Simple, light-weight HTML sanitizer to prevent cross-site scripting (XSS).
 * Strips dangerous tags like script, iframe, object, embed, style and onload/onerror attributes.
 */
export const sanitizeHTML = (htmlString) => {
  if (!htmlString || typeof htmlString !== 'string') return '';

  // Remove script tags and their content
  let clean = htmlString.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');

  // Remove iframe/embed/object tags
  clean = clean.replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, '');
  clean = clean.replace(/<object[^>]*>([\s\S]*?)<\/object>/gi, '');
  clean = clean.replace(/<embed[^>]*>/gi, '');

  // Remove inline event handlers (e.g. onload, onclick, onerror, etc.)
  clean = clean.replace(/on\w+\s*=\s*(['"][^'"]*['"]|[^>\s]+)/gi, '');

  // Remove javascript: pseudo-protocol in links/attributes
  clean = clean.replace(/href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'href="#"');

  return clean;
};
