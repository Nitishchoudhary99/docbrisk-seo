/* ==========================================================================
   DocBrisk — SEO Worker (PATCHED — unique body content per tool)

   WHAT CHANGED FROM THE ORIGINAL:
   The original Worker rewrote only <head> tags (title/description/canonical/
   og/twitter). The visible <body> was the same SPA shell for every /tool/*
   URL, so Google saw 38 pages with identical text — a duplicate-content
   problem that suppresses indexing even with correct meta tags and a clean
   sitemap.

   THE FIX:
   injectBodyContent() inserts a real, unique <section> right after the
   opening <body> tag for every tool page: an <h1> matching the tool, and a
   paragraph using the same description already in the TOOLS table. This is
   NOT cloaking — every visitor (bot or human) receives this exact HTML; if
   your SPA mounts and wants to visually replace/hide it later that's fine,
   but the raw HTML response itself is identical for everyone.

   NEXT STEP FOR AN EVEN STRONGER FIX (optional, higher effort):
   Expand each TOOLS entry with a longer 2nd paragraph (3-5 sentences) so
   each page carries more unique text relative to the shared tool-list/FAQ
   content further down the page. The injected content below already helps
   a lot on its own — this is just the next increment if you want more.
   ========================================================================== */

const ORIGIN_HTML =
  'https://raw.githubusercontent.com/Nitishchoudhary99/My-website/main/index.html';

const SITE = 'https://docbrisk.com';
const DEFAULT_TITLE = 'DocBrisk — Free PDF Editor, Resume Builder & Watermark Remover';

const TOOLS = {
  'photo-studio': ['Passport Photo Maker & Background Remover', 'Remove or replace the background, crop to official passport, visa and ID specs for 14 countries, enhance, and lay out a ready-to-print sheet.'],
  'doc-scanner': ['Scan Documents with Perspective Correction', 'Photograph a page at any angle and a perspective transform flattens it into a straight-on scan, then cleans it into a crisp document.'],
  'cv-studio': ['AI Resume & CV Builder — 25 ATS Templates', 'Build an ATS-friendly resume from 25 professional templates with live preview, deep customisation and a built-in ATS score check.'],
  'id-card': ['Aadhaar & ID Card Print Sheet Maker', 'Place the front and back of an Aadhaar, PAN, voter ID or licence on one sheet — stacked or side by side, at exact card size with cut guides.'],
  'pdf-editor': ['Free Online PDF Editor', 'Add and edit text, highlights, shapes, images and freehand notes on any PDF, with undo/redo, zoom and layers.'],
  'compare-pdf': ['Compare Two PDF Versions', 'Pixel-accurate visual diff between two revisions, highlighting exactly what changed on every page.'],
  'pdf-to-word': ['Convert PDF to Word (DOCX)', 'Turn a PDF into a fully editable Word document, preserving headings, paragraph flow and page structure.'],
  'organize-pdf': ['Organize, Rotate & Split PDF Pages', 'Reorder, rotate, delete, extract and split pages visually, then export a rebuilt PDF or a ZIP of single pages.'],
  'redact-pdf': ['Redact a PDF Permanently', 'Destroy sensitive text and images by flattening the marked pages — the hidden content cannot be copied back out.'],
  'clean-metadata': ['Remove Hidden PDF Metadata', 'Inspect and strip the author names, software fingerprints and timestamps hidden inside every document.'],
  'number-pdf': ['Add Page Numbers or Bates Numbering', 'Apply page numbers, legal Bates numbering and headers with full control over format and placement.'],
  'impose-pdf': ['N-up Printing & Booklet Imposition', 'Fit multiple pages per sheet, or reorder pages into saddle-stitch booklet order for folding and stapling.'],
  'merge-pdf': ['Merge PDF Files', 'Combine any number of PDFs into one document, losslessly and with zero quality reduction.'],
  'compress-pdf': ['Compress PDF to a Target Size', 'Shrink a PDF to hit an exact KB or MB limit for upload portals, forms and email attachments.'],
  'watermark-pdf': ['Add a Watermark to a PDF', 'Stamp text across every page with control over opacity, angle, size, colour and tiling.'],
  'translate-pdf': ['Translate a PDF Document', 'Translate a whole PDF into 35 languages and download the result as an editable Word file or plain text.'],
  'ocr-pdf': ['OCR: Extract Text from Scans & Images', 'Pull selectable text out of scanned documents, photos and image-only PDFs in 15 languages.'],
  'sign-pdf': ['Sign a PDF Online', 'Draw or type a signature, place it anywhere on the page, then download the signed document.'],
  'unlock-pdf': ['Remove a PDF Password', 'Strip passwords and permission restrictions from PDFs you own, with no quality loss.'],
  'pdf-to-image': ['Convert PDF to PNG or JPG', 'Export every page as a high-resolution image at 96, 150 or 300 DPI, individually or as a ZIP.'],
  'image-to-pdf': ['Convert Images to PDF', 'Turn JPG, PNG and WebP images into one clean multi-page PDF with page-size and margin control.'],
  'extract-tables': ['Extract Tables from a PDF to Excel or CSV', 'Finds tables by column alignment — no ruling lines needed — and exports them as a real spreadsheet or CSV files.'],
  'pdf-to-excel': ['Convert PDF to Excel (XLSX)', 'Detect tabular rows in a PDF and export them as a real spreadsheet, one worksheet per page.'],
  'remove-watermark': ['Remove a Watermark from a PDF', 'Three engines: delete repeating text without rasterising, strip logos that repeat across pages, or lift a watermark out by colour.'],
  'extract-images': ['Extract Embedded Images from a PDF', 'Pull every picture out of a PDF at its original resolution and save them individually or as a ZIP.'],
  'clean-scan': ['Deskew and Clean a Scanned PDF', 'Straighten crooked pages, drop blank sheets and sharpen faded scans into a clean, smaller document.'],
  'resize-pdf': ['Resize & Normalise PDF Page Sizes', 'Force every page to A4, Letter or any standard size without rasterising — fixes documents a printer or portal rejects.'],
  'qr-stamp': ['Add a QR Code to a PDF', 'Generate a QR code offline and stamp it onto any page for verification links, payment details or document tracking.'],
  'doc-integrity': ['Check a PDF for Tampering', 'Find out whether a PDF was edited after it was issued — incremental saves, mismatched fonts, re-encoded pages, and metadata that contradicts itself.'],
  'pdf-to-ppt': ['Convert PDF to PowerPoint', 'Turn each page into an editable slide — either as a crisp page image or as real, editable text and headings.'],
  'qr-maker': ['Free QR Code Generator', 'Make QR codes for links, Wi-Fi, contacts, UPI payments or plain text. Generated offline and downloadable as PNG or SVG.'],
  'invoice-maker': ['Free GST Invoice Generator', 'Build a professional invoice with GST or flat tax, line items, HSN codes and a scannable UPI QR for instant payment.'],
  'mail-merge': ['Bulk Certificate & Letter Generator', 'Combine one PDF template with a spreadsheet to produce hundreds of personalised certificates, offer letters or cards at once.'],
  'split-by-size': ['Split a PDF by File Size or Page Count', 'Break a large PDF into parts that each stay under an upload limit, or into fixed page counts and equal sections.'],
  'sheet-to-pdf': ['Convert Excel or CSV to a PDF Table', 'Turn a spreadsheet into a clean paginated PDF table with repeating headers and auto-fitted columns.'],
  'batch-process': ['Batch Process Hundreds of PDFs', 'Apply compression, watermarks, numbering, metadata stripping or conversion across an entire folder at once, delivered as a ZIP.'],
  'smart-redact': ['Automatically Detect & Redact Sensitive Data', 'Scan a document for Aadhaar, PAN, card numbers, emails, phone numbers and dates of birth, then destroy every match in one pass.'],
  'word-to-pdf': ['Convert Word to PDF', 'Convert .docx documents into clean, shareable PDF files with preserved paragraph flow.']
};

const STATIC_PAGES = {
  'privacy': ['Privacy Policy | DocBrisk', 'How DocBrisk handles your documents: everything is processed in your browser and nothing is uploaded.'],
  'about':   ['About DocBrisk', 'Why DocBrisk processes documents entirely in the browser, and who builds it.'],
  'terms':   ['Terms of Use | DocBrisk', 'The terms that apply when you use the free document tools on DocBrisk.'],
  'pricing': ['Pricing — Free Tools and DocBrisk Pro', 'Every core tool is free and unlimited. DocBrisk Pro unlocks the remaining templates and advanced tools for ₹99 a month.']
};

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function titleFor(base) {
  return base.length > 34 ? base + ' | DocBrisk' : base + ' — Free & Private | DocBrisk';
}

function setTag(html, pattern, value) {
  return html.replace(pattern, (m) =>
    m.replace(/(content|href)="[^"]*"/, (a, attr) => attr + '="' + esc(value) + '"'));
}

function rewriteHead(html, { title, desc, url }) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(title) + '</title>');
  html = setTag(html, /<meta name="description"[^>]*>/, desc);
  html = setTag(html, /<link rel="canonical"[^>]*>/, url);
  html = setTag(html, /<meta property="og:title"[^>]*>/, title);
  html = setTag(html, /<meta property="og:description"[^>]*>/, desc);
  html = setTag(html, /<meta property="og:url"[^>]*>/, url);
  html = setTag(html, /<meta name="twitter:title"[^>]*>/, title);
  html = setTag(html, /<meta name="twitter:description"[^>]*>/, desc);
  return html;
}

/* NEW — this is the actual fix. Inserts unique, real content right after
   <body ...> opens, before the SPA's own markup. Also adds SoftwareApplication
   schema so Google can show rich results (free price, ratings if you add
   them later). */
function injectBodyContent(html, { base, desc, slug, title }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': base,
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Any (runs in browser)',
    'description': desc,
    'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'INR' },
    'url': SITE + '/tool/' + slug
  };

  const block =
    '<section id="docbrisk-seo-intro" style="max-width:760px;margin:0 auto;padding:24px 16px 8px;font-family:system-ui,sans-serif;">' +
    '<h1 style="font-size:26px;font-weight:700;margin:0 0 10px;">' + esc(base) + '</h1>' +
    '<p style="font-size:16px;line-height:1.6;color:#333;margin:0 0 6px;">' + esc(desc) + '</p>' +
    '<p style="font-size:13px;color:#666;margin:0;">Free, unlimited and processed entirely in your browser — nothing is uploaded to a server. Part of <a href="/" style="color:#0f6cbd;">DocBrisk\'s 38 free document tools</a>.</p>' +
    '</section>' +
    '<script type="application/ld+json">' + JSON.stringify(schema) + '</script>';

  return html.replace(/<body([^>]*)>/, (m) => m + block);
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [{ loc: SITE + '/', pri: '1.0' }]
    .concat(Object.keys(TOOLS).map(s => ({ loc: SITE + '/tool/' + s, pri: '0.8' })))
    .concat(Object.keys(STATIC_PAGES).map(s => ({ loc: SITE + '/' + s, pri: '0.4' })));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => '  <url><loc>' + u.loc + '</loc><lastmod>' + today +
      '</lastmod><changefreq>weekly</changefreq><priority>' + u.pri + '</priority></url>').join('\n') +
    '\n</urlset>';
}

async function baseHtml() {
  const res = await fetch(ORIGIN_HTML, {
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!res.ok) return null;
  return await res.text();
}

const htmlResponse = (body) => new Response(body, {
  headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=300',
    'X-Robots-Tag': 'index, follow'
  }
});

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (path === '/sitemap.xml') {
      return new Response(sitemap(), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8',
                   'Cache-Control': 'public, max-age=3600' }
      });
    }

    if (path === '/robots.txt') {
      return new Response(
        'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n',
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    const toolMatch = path.match(/^\/tool\/([a-z0-9-]+)$/);
    if (toolMatch && TOOLS[toolMatch[1]]) {
      const [base, desc] = TOOLS[toolMatch[1]];
      const html = await baseHtml();
      if (!html) return Response.redirect(SITE + '/#/tool/' + toolMatch[1], 302);

      let out = rewriteHead(html, {
        title: titleFor(base), desc, url: SITE + '/tool/' + toolMatch[1]
      });
      out = injectBodyContent(out, { base, desc, slug: toolMatch[1], title: titleFor(base) });

      return htmlResponse(out);
    }

    const staticSlug = path.replace(/^\//, '');
    if (STATIC_PAGES[staticSlug]) {
      const [title, desc] = STATIC_PAGES[staticSlug];
      const html = await baseHtml();
      if (!html) return Response.redirect(SITE + '/#/' + staticSlug, 302);
      return htmlResponse(rewriteHead(html, { title, desc, url: SITE + '/' + staticSlug }));
    }

    if (path.startsWith('/tool/')) return Response.redirect(SITE + '/', 302);

    return Response.redirect(SITE + '/', 302);
  }
};
