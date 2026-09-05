const ALLOWED_TAGS = new Set([
  'div', 'span', 'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'small',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'table', 'thead', 'tbody',
  'tr', 'td', 'th', 'sup', 'sub', 'mark', 'code', 'pre',
]);

const ALLOWED_STYLES = new Set([
  'color', 'background', 'background-color', 'font-size', 'font-weight',
  'font-family', 'text-align', 'padding', 'margin', 'border', 'border-radius',
  'display', 'flex-direction', 'align-items', 'justify-content', 'gap',
  'width', 'height', 'max-width', 'min-height', 'line-height', 'letter-spacing',
  'text-decoration', 'opacity', 'box-shadow', 'grid-template-columns',
]);

const stripDangerous = (value) =>
  String(value || '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/expression\s*\(/gi, '');

export function sanitizeVisualHtml(dirty) {
  if (!dirty || typeof document === 'undefined') {
    return typeof dirty === 'string' ? dirty.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') : '';
  }

  const template = document.createElement('template');
  template.innerHTML = String(dirty);

  const walk = (node) => {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;

      const tag = child.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag) || tag === 'script' || tag === 'iframe' || tag === 'object' || tag === 'embed') {
        child.replaceWith(document.createTextNode(child.textContent || ''));
        continue;
      }

      Array.from(child.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on') || name === 'src' || name === 'href' || name === 'srcset' || name === 'xlink:href') {
          child.removeAttribute(attr.name);
          return;
        }
        if (name === 'style') {
          const safe = attr.value
            .split(';')
            .map((rule) => rule.trim())
            .filter(Boolean)
            .map((rule) => {
              const [prop, ...rest] = rule.split(':');
              const key = String(prop || '').trim().toLowerCase();
              const val = stripDangerous(rest.join(':'));
              if (!ALLOWED_STYLES.has(key) || !val) return '';
              return `${key}: ${val}`;
            })
            .filter(Boolean)
            .join('; ');
          if (safe) child.setAttribute('style', safe);
          else child.removeAttribute('style');
        }
      });

      walk(child);
    }
  };

  walk(template.content);
  return template.innerHTML;
}
