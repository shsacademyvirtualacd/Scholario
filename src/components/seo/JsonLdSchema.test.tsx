import React from 'react';
import ReactDOMServer from 'react-dom/server';
import JsonLdSchema, { safeJsonLdStringify } from './JsonLdSchema';

declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (actual: unknown) => any;

describe('JsonLdSchema Security & Serialization', () => {
  it('escapes HTML-sensitive characters to prevent script injection', () => {
    const maliciousPayload = {
      name: '</script><script>alert("xss")</script>',
      description: 'Test <tag> & "quotes"',
      specialChars: '\u2028 \u2029',
    };

    const result = safeJsonLdStringify(maliciousPayload);

    // Ensure no unescaped < or > characters remain
    expect(result).not.toContain('</script>');
    expect(result).not.toContain('<script>');
    expect(result).toContain('\\u003c');
    expect(result).toContain('\\u003e');

    // Ensure parsing the escaped string returns original object
    const parsed = JSON.parse(result);
    expect(parsed).toEqual(maliciousPayload);
  });

  it('renders script elements without dangerouslySetInnerHTML', () => {
    const html = ReactDOMServer.renderToString(
      React.createElement(JsonLdSchema, {
        siteUrl: 'https://example.com',
        organizationName: 'Test Org </script>',
      })
    );

    // Verify script tags are present
    expect(html).toContain('type="application/ld+json"');

    // Verify no dangerouslySetInnerHTML unescaped breaking script tags exist
    expect(html).not.toContain('</script><script>alert');
    expect(html).toContain('Test Org \\u003c/script\\u003e');

    // Count script tags rendered
    const scriptMatches = html.match(/<script type="application\/ld\+json">/g);
    expect(scriptMatches).not.toBeNull();
    // Default includes org, product, website, 4 courses, 1 faq = 8 scripts
    expect(scriptMatches?.length).toBe(8);
  });
});
