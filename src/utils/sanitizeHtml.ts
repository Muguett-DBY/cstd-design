const BLOCKED_ELEMENTS = [
  "script",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "base",
  "form",
  "input",
  "button",
  "textarea",
  "select",
];

const URL_ATTRIBUTES = new Set(["href", "src", "xlink:href", "formaction", "action"]);

function normaliseUrl(value: string) {
  let normalised = "";
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (code <= 31 || code === 127 || /\s/.test(char)) continue;
    normalised += char;
  }
  return normalised.toLowerCase();
}

function isDangerousUrl(value: string) {
  const normalised = normaliseUrl(value);
  return normalised.startsWith("javascript:")
    || normalised.startsWith("vbscript:")
    || normalised.startsWith("data:text/html")
    || normalised.startsWith("data:image/svg+xml");
}

function fallbackSanitize(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son[\w:-]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s(?:href|src|xlink:href|formaction|action)\s*=\s*("[^"]*javascript:[^"]*"|'[^']*javascript:[^']*'|[^\s>]*javascript:[^\s>]*)/gi, "");
}

export function sanitizeTrustedHtml(html: string): string {
  if (typeof document === "undefined") return fallbackSanitize(html);

  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll(BLOCKED_ELEMENTS.join(",")).forEach((element) => element.remove());

  template.content.querySelectorAll("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name.startsWith("on") || name === "srcdoc") {
        element.removeAttribute(attribute.name);
        continue;
      }
      if (URL_ATTRIBUTES.has(name) && isDangerousUrl(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    }
  });

  return template.innerHTML;
}
