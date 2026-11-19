import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export type LinkMetadata = {
  title: string;
  description: string;
  imageUrl: string;
  fetchedAt: string;
};

const maximumHtmlBytes = 1_500_000;
const maximumRedirects = 4;

function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^::ffff:/, "");
  if (normalized === "::1" || normalized === "0:0:0:0:0:0:0:1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:")) return true;

  const parts = normalized.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part))) return false;
  return parts[0] === 10
    || parts[0] === 127
    || parts[0] === 0
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

async function isSafePublicUrl(url: URL) {
  if (!["http:", "https:"].includes(url.protocol)) return false;
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local")) return false;
  if (isIP(hostname)) return !isPrivateAddress(hostname);

  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    return addresses.length > 0 && addresses.every(({ address }) => !isPrivateAddress(address));
  } catch {
    return false;
  }
}

function decodeEntities(value: string) {
  const named: Record<string, string> = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"', nbsp: " " };
  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
    if (token[0] === "#") {
      const hexadecimal = token[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(token.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    return named[token.toLowerCase()] ?? entity;
  }).replace(/\s+/g, " ").trim();
}

function metaAttributes(tag: string) {
  const attributes: Record<string, string> = {};
  const pattern = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return attributes;
}

function parseHtmlMetadata(html: string, pageUrl: URL): Omit<LinkMetadata, "fetchedAt"> {
  const metadata = new Map<string, string>();
  for (const tag of html.match(/<meta\s+[^>]*>/gi) ?? []) {
    const attributes = metaAttributes(tag);
    const key = (attributes.property || attributes.name || attributes.itemprop || "").toLowerCase();
    if (key && attributes.content && !metadata.has(key)) metadata.set(key, decodeEntities(attributes.content));
  }

  const documentTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const imageCandidate = metadata.get("og:image:secure_url") || metadata.get("og:image") || metadata.get("twitter:image") || metadata.get("twitter:image:src") || "";
  let imageUrl = "";
  if (imageCandidate) {
    try {
      const resolved = new URL(imageCandidate, pageUrl);
      if (["http:", "https:"].includes(resolved.protocol)) imageUrl = resolved.toString();
    } catch { /* A missing preview image should not block a save. */ }
  }

  return {
    title: (metadata.get("og:title") || metadata.get("twitter:title") || decodeEntities(documentTitle)).slice(0, 240),
    description: (metadata.get("og:description") || metadata.get("twitter:description") || metadata.get("description") || "").slice(0, 1_000),
    imageUrl,
  };
}

async function readLimitedText(response: Response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let html = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maximumHtmlBytes) {
      await reader.cancel();
      return "";
    }
    html += decoder.decode(value, { stream: true });
  }
  return html + decoder.decode();
}

export async function fetchLinkMetadata(input: URL): Promise<LinkMetadata | null> {
  let current = new URL(input);

  try {
    for (let redirectCount = 0; redirectCount <= maximumRedirects; redirectCount += 1) {
      if (!(await isSafePublicUrl(current))) return null;

      const response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(6_000),
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "InOrbitMetadata/1.0 (+private bookmark preview)",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirectCount === maximumRedirects) return null;
        current = new URL(location, current);
        continue;
      }

      if (!response.ok) return null;
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) return null;
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > maximumHtmlBytes) return null;

      const html = await readLimitedText(response);
      if (!html) return null;
      return { ...parseHtmlMetadata(html, current), fetchedAt: new Date().toISOString() };
    }
  } catch {
    return null;
  }

  return null;
}
