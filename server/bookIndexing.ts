import { getAvailableDigitalBookByHandle, listAvailableDigitalBooks } from "./db";

export const CANONICAL_ORIGIN = (process.env.CANONICAL_ORIGIN || "https://arabicshop-p2xmxzpy.manus.space").replace(/\/$/, "");
const SITE_NAME = "سوقك العربي";
const DEFAULT_DESCRIPTION = "مكتبة رقمية عربية لاكتشاف الكتب وشرائها وقراءتها من حسابك، مع وسائل دفع مرنة ودعم مباشر عبر واتساب.";

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const plainText = (value: unknown, limit: number) => {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length > limit ? `${normalized.slice(0, limit - 1).trim()}…` : normalized;
};

const absoluteUrl = (value: string | null | undefined) => {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${CANONICAL_ORIGIN}${value.startsWith("/") ? "" : "/"}${value}`;
};

export type BookIndexingPage = {
  status: 200 | 404;
  head: string;
  body: string;
};

export function renderDefaultSeoHead() {
  return `<title>${SITE_NAME} | مكتبة رقمية عربية</title>
<meta name="description" content="${DEFAULT_DESCRIPTION}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta property="og:locale" content="ar_AR" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${SITE_NAME} | مكتبة رقمية عربية" />
<meta property="og:description" content="اكتشف الكتب الرقمية العربية واقرأها من مكتبتك الخاصة." />
<meta property="og:url" content="${CANONICAL_ORIGIN}/" />
<meta name="twitter:card" content="summary" />
<link rel="canonical" href="${CANONICAL_ORIGIN}/" />`;
}

export async function renderPublishedBookForIndexing(pathname: string): Promise<BookIndexingPage | null> {
  const pathWithoutQuery = pathname.split("?")[0] || "/";
  let decodedPath = pathWithoutQuery;
  try { decodedPath = decodeURI(pathWithoutQuery); } catch { /* malformed paths stay generic */ }
  const match = decodedPath.match(/^\/كتب-رقمية\/([^/]+)$/);
  if (!match) return null;

  const book = await getAvailableDigitalBookByHandle(match[1]);
  if (!book) {
    return {
      status: 404,
      head: `<title>الكتاب غير متاح | ${SITE_NAME}</title><meta name="robots" content="noindex,follow" />`,
      body: `<main dir="rtl" lang="ar"><h1>الكتاب غير متاح</h1><p>لم يتم العثور على الكتاب المطلوب.</p></main>`,
    };
  }

  const canonicalPath = `/كتب-رقمية/${encodeURIComponent(book.productHandle)}`;
  const canonicalUrl = `${CANONICAL_ORIGIN}${canonicalPath}`;
  const title = `${book.title} PDF | ${SITE_NAME}`;
  const description = plainText(book.shortDescription || book.description || `كتاب رقمي بعنوان ${book.title} متاح للقراءة والشراء من ${SITE_NAME}.`, 190);
  const image = absoluteUrl(book.coverUrl);
  const price = Number(book.price);
  const productJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: book.title,
    description,
    image,
    author: { "@type": "Person", name: book.author || "الناشر" },
    inLanguage: book.language || "ar",
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: book.currencyCode,
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
    },
  }).replace(/</g, "\\u003c");
  const imageTags = image ? `<meta property="og:image" content="${escapeHtml(image)}" />\n<meta name="twitter:image" content="${escapeHtml(image)}" />` : "";
  const author = book.author || "الناشر";
  const pageInfo = [book.pageCount ? `${book.pageCount} صفحة` : "كتاب رقمي", book.language || "العربية", book.category || "كتب رقمية"].join(" · ");
  const priceText = price === 0 ? "مجاني" : `${price.toLocaleString("ar-EG")} ${book.currencyCode}`;

  return {
    status: 200,
    head: `<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="robots" content="index,follow,max-image-preview:large" />
<meta property="og:locale" content="ar_AR" />
<meta property="og:site_name" content="${SITE_NAME}" />
<meta property="og:type" content="product" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
${imageTags}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
<script type="application/ld+json">${productJson}</script>`,
    body: `<main dir="rtl" lang="ar" aria-label="صفحة الكتاب"><article><p>${escapeHtml(book.category || "كتب رقمية")}</p><h1>${escapeHtml(book.title)}</h1><p>${escapeHtml(pageInfo)}</p><p>${escapeHtml(description)}</p><p><strong>المؤلف:</strong> ${escapeHtml(author)}</p><p><strong>السعر:</strong> ${escapeHtml(priceText)}</p><h2>عن هذا الكتاب</h2><p>${escapeHtml(book.description || description).replace(/\n/g, "<br />")}</p><a href="${escapeHtml(canonicalPath)}">عرض تفاصيل الكتاب وشراؤه من ${SITE_NAME}</a></article></main>`,
  };
}

export async function renderDynamicSitemap() {
  const books = await listAvailableDigitalBooks();
  const staticPaths = ["/", "/كتب-رقمية", "/من-نحن", "/سياسة-المنتجات-الرقمية", "/شروط-الاستخدام"];
  const entries = [
    ...staticPaths.map(path => ({ path, lastModified: undefined as Date | undefined })),
    ...books.map(book => ({ path: `/كتب-رقمية/${book.productHandle}`, lastModified: book.updatedAt })),
  ];
  const urls = entries.map(entry => {
    const lastmod = entry.lastModified ? `<lastmod>${new Date(entry.lastModified).toISOString().slice(0, 10)}</lastmod>` : "";
    return `<url><loc>${escapeHtml(encodeURI(`${CANONICAL_ORIGIN}${entry.path}`))}</loc>${lastmod}</url>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function injectIndexablePage(template: string, page: BookIndexingPage | null) {
  const head = page?.head || renderDefaultSeoHead();
  if (!page) return template.replace("<!--seo-head-->", () => head);
  return template
    .replace("<!--seo-head-->", () => head)
    .replace("<div id=" + '"root"' + "></div>", () => `<div id="root" data-indexable-book="true">${page.body}</div>`);
}
