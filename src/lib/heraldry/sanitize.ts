const DANGEROUS = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const FOREIGN = /<foreignObject\b[^>]*>[\s\S]*?<\/foreignObject>/gi;
const EVENTS = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JS_URL = /(href|xlink:href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi;

export function sanitizeSvg(markup: string): string {
  let next = markup.replace(DANGEROUS, "").replace(FOREIGN, "").replace(EVENTS, "").replace(JS_URL, "");
  if (!next.includes("<svg")) {
    next = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${next}</svg>`;
  }
  return next;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}
