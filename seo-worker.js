/* ==========================================================================
   DocBrisk — SEO Worker

   The site is a single-page app behind hash routes (#/tool/merge-pdf).
   Google does not treat a hash fragment as a separate page, so all 37 tools
   were competing as one URL: docbrisk.com/

   This Worker puts real, crawlable URLs in front of the same app:

       https://docbrisk.com/tool/merge-pdf

   It reads index.html straight from the GitHub repo, rewrites the title,
   description, canonical and social tags at the edge, and returns it — so a
   crawler sees the right metadata without running any JavaScript.

   IMPORTANT — this Worker is deliberately scoped to a few paths only.
   The existing site Worker keeps serving the homepage and every asset.
   Add ONLY these routes to this Worker:

       docbrisk.com/tool/*
       docbrisk.com/sitemap.xml
       docbrisk.com/robots.txt

   Do not route docbrisk.com/* here, or it would take over the whole site
   from the Worker that already serves it.
   ========================================================================== */

/* index.html is read from the repo rather than from docbrisk.com, because a
   Worker fetching its own hostname would call itself in a loop. Change the
   branch here if the repo's default branch is not "main". */
const ORIGIN_HTML =
  'https://raw.githubusercontent.com/Nitishchoudhary99/My-website/main/index.html';

const SITE = 'https://docbrisk.com';
const DEFAULT_TITLE = 'DocBrisk — Free PDF Editor, Resume Builder & Watermark Remover';

/* slug -> [page title, meta description]. Generated from the TOOLS table in
   index.html, so the two stay in step. */
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

/** Build the title the same way the browser-side code does, so a tool never
    shows one title in search results and a different one in the tab. */
function titleFor(base) {
  return base.length > 34 ? base + ' | DocBrisk' : base + ' — Free & Private | DocBrisk';
}

/** Replace the content of a meta/link tag without touching the rest of it. */
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

    /* Generated from the tool table, so it can never drift out of date. */
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
      /* If GitHub is unreachable, send the visitor to the working homepage
         rather than showing them an error page. */
      if (!html) return Response.redirect(SITE + '/#/tool/' + toolMatch[1], 302);
      return htmlResponse(rewriteHead(html, {
        title: titleFor(base), desc, url: SITE + '/tool/' + toolMatch[1]
      }));
    }

    const staticSlug = path.replace(/^\//, '');
    if (STATIC_PAGES[staticSlug]) {
      const [title, desc] = STATIC_PAGES[staticSlug];
      const html = await baseHtml();
      if (!html) return Response.redirect(SITE + '/#/' + staticSlug, 302);
      return htmlResponse(rewriteHead(html, { title, desc, url: SITE + '/' + staticSlug }));
    }

    /* An unknown /tool/... path must not return 200 with the homepage —
       that would create duplicate content across made-up URLs. */
    if (path.startsWith('/tool/')) return Response.redirect(SITE + '/', 302);

    /* Anything else reaching this Worker was not meant for it. */
    return Response.redirect(SITE + '/', 302);
  }
};
