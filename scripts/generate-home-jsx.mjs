/**
 * Converts an exported Elementor HTML page into JSX so it is rendered by React
 * instead of dangerouslySetInnerHTML. Class names, data attributes and text
 * nodes are kept verbatim to preserve the original design.
 *
 * Usage: node scripts/generate-home-jsx.mjs [file.html] [MarkupComponent]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const htmlFile = process.argv[2] || '80785.html';
const componentName = process.argv[3] || 'HomeMarkup';
const SOURCE = new URL(`../src/content/pages/${htmlFile}`, import.meta.url);
const TARGET = new URL(`../src/pages/${componentName}.tsx`, import.meta.url);

const NAMED_ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0',
};

function decode(value) {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X';
      const code = Number.parseInt(hex ? body.slice(2) : body.slice(1), hex ? 16 : 10);
      if (Number.isFinite(code) && code >= 0 && code <= 0x10ffff) return String.fromCodePoint(code);
      return match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

const ATTR_NAMES = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  itemscope: 'itemScope',
  itemtype: 'itemType',
  itemprop: 'itemProp',
  contenteditable: 'contentEditable',
  srcset: 'srcSet',
  autocomplete: 'autoComplete',
  maxlength: 'maxLength',
  readonly: 'readOnly',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing',
  frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen',
  autoplay: 'autoPlay',
  playsinline: 'playsInline',
};

const NUMERIC_ATTRS = new Set(['size', 'maxlength', 'minlength', 'min', 'max', 'step', 'cols', 'rows']);

const BOOLEAN_ATTRS = new Set([
  'checked', 'disabled', 'hidden', 'itemscope', 'multiple', 'muted', 'loop',
  'readonly', 'required', 'selected', 'allowfullscreen', 'autoplay',
  'playsinline', 'novalidate', 'open', 'reversed',
]);

// React 18 types only accept `fetchPriority`, but React DOM warns about it;
// this single image hint is not part of the visual design.
const SKIP_ATTRS = new Set(['fetchpriority']);

const VOID_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
  'param', 'source', 'track', 'wbr',
]);

const CAMEL_CASE = /-([a-z])/g;

function styleObject(value) {
  const entries = value
    .split(';')
    .map((declaration) => declaration.trim())
    .filter(Boolean)
    .map((declaration) => {
      const colon = declaration.indexOf(':');
      if (colon < 0) return null;
      const rawKey = declaration.slice(0, colon).trim();
      const rawValue = declaration.slice(colon + 1).trim();
      const key = rawKey.startsWith('--') ? rawKey : rawKey.replace(CAMEL_CASE, (_, letter) => letter.toUpperCase());
      return `${JSON.stringify(key)}: ${JSON.stringify(rawValue)}`;
    })
    .filter(Boolean);
  return `{{ ${entries.join(', ')} } as unknown as CSSProperties}`;
}

function stringValue(value) {
  // Always use a JS expression literal: Elementor data attributes contain JSON
  // with quotes/braces that cannot be written inside a JSX string attribute.
  if (/(\/wp-|\/site-css\/|(?:bydreamy|dreamyinvitation|attarivitation)\.com)/i.test(value)) {
    return `{rewrite(${JSON.stringify(value)})}`;
  }
  return `{${JSON.stringify(value)}}`;
}

function serializeAttributes(text) {
  const attributes = [];
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let match;
  while ((match = pattern.exec(text))) {
    const name = match[1];
    if (SKIP_ATTRS.has(name)) continue;
    const rawValue = match[2] ?? match[3] ?? match[4];
    const jsName = ATTR_NAMES[name] || name;
    if (rawValue == null) {
      attributes.push(BOOLEAN_ATTRS.has(name) ? `${jsName}={true}` : jsName);
      continue;
    }
    const value = decode(rawValue);
    if (BOOLEAN_ATTRS.has(name)) {
      attributes.push(`${jsName}={true}`);
    } else if (name === 'style') {
      attributes.push(`style=${styleObject(value)}`);
    } else if (name === 'tabindex' || NUMERIC_ATTRS.has(name)) {
      attributes.push(`${jsName}={Number(${JSON.stringify(value)})}`);
    } else {
      attributes.push(`${jsName}=${stringValue(value)}`);
    }
  }
  return attributes.length ? ` ${attributes.join(' ')}` : '';
}

function convert(html) {
  const lines = [];
  const stack = [];
  let cursor = 0;

  const closeThrough = (name) => {
    const index = stack.lastIndexOf(name);
    if (index < 0) return false;
    while (stack.length > index) lines.push(`</${stack.pop()}>`);
    return true;
  };

  while (cursor < html.length) {
    if (html[cursor] !== '<') {
      let end = html.indexOf('<', cursor);
      if (end < 0) end = html.length;
      const text = html.slice(cursor, end);
      if (text) lines.push(`{${JSON.stringify(decode(text))}}`);
      cursor = end;
      continue;
    }
    if (html.startsWith('<!--', cursor)) {
      const end = html.indexOf('-->', cursor + 4);
      cursor = end < 0 ? html.length : end + 3;
      continue;
    }

    let end = cursor + 1;
    let quote = null;
    while (end < html.length) {
      const char = html[end];
      if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === '>') {
        break;
      }
      end += 1;
    }

    const raw = html.slice(cursor + 1, end);
    cursor = end + 1;

    const closing = /^\s*\//.test(raw);
    const tagMatch = raw.match(/^\s*\/?\s*([a-zA-Z][\w:-]*)/);
    if (!tagMatch) continue;
    const tag = tagMatch[1];

    if (closing) {
      // The WordPress export contains stray closing tags (e.g. </a> without an
      // opening <a>). Browsers ignore them; JSX must do the same.
      closeThrough(tag);
      continue;
    }

    if (tag === 'style' || tag === 'script') {
      const closeTag = `</${tag}>`;
      const contentEnd = html.indexOf(closeTag, cursor);
      if (contentEnd >= 0) {
        lines.push(`<${tag}>{${JSON.stringify(html.slice(cursor, contentEnd))}}</${tag}>`);
        cursor = contentEnd + closeTag.length;
        continue;
      }
    }

    const attributes = serializeAttributes(raw.slice(tagMatch[0].length));
    if (VOID_TAGS.has(tag)) {
      lines.push(`<${tag}${attributes} />`);
    } else {
      lines.push(`<${tag}${attributes}>`);
      stack.push(tag);
    }
  }

  while (stack.length) lines.push(`</${stack.pop()}>`);
  return lines;
}

const html = readFileSync(SOURCE, 'utf8');
const lines = convert(html);

const output = `/**
 * GENERATED FILE — run \`node scripts/generate-home-jsx.mjs\` after changing
 * src/content/pages/${htmlFile}. Do not edit by hand.
 */
import type { CSSProperties } from 'react';

export function ${componentName}({ rewrite }: { rewrite: (value: string) => string }) {
  return (
    <>
${lines.map((line) => `      ${line}`).join('\n')}
    </>
  );
}
`;

writeFileSync(TARGET, output, 'utf8');
console.log(`Wrote ${TARGET.pathname} with ${lines.length} JSX nodes.`);
