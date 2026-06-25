import { describe, expect, test } from "vitest";
import { sanitizeTrustedHtml } from "./sanitizeHtml";

describe("sanitizeTrustedHtml", () => {
  test("removes executable elements, event handlers, and dangerous urls", () => {
    const html = sanitizeTrustedHtml(`
      <article>
        <script>alert("x")</script>
        <img src="javascript:alert(1)" onerror="alert(2)">
        <a href=" JaVaScRiPt:alert(3)" onclick="alert(4)">bad</a>
        <iframe srcdoc="<script>alert(5)</script>"></iframe>
      </article>
    `);

    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("onclick");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<iframe");
    expect(html).not.toContain("srcdoc");
  });

  test("preserves safe HTML and SVG needed by export preview and Mermaid", () => {
    const html = sanitizeTrustedHtml(`
      <section class="message assistant">
        <a href="https://example.com">safe</a>
        <svg viewBox="0 0 10 10" role="img"><path d="M0 0L10 10"></path></svg>
      </section>
    `);

    expect(html).toContain('class="message assistant"');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain("<svg");
    expect(html).toContain('viewBox="0 0 10 10"');
    expect(html).toContain("<path");
  });
});
