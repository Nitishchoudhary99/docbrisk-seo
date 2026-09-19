/* ==========================================================================
   DocBrisk — SEO Worker v3

   WHY THIS VERSION EXISTS
   Google was indexing only the homepage. Reading the code showed why:

   1. Every /tool/* page returned the SAME ~2,500-word hidden block
      (#noscript-seo) that describes the whole site. Only the <title> and two
      sentences differed, so Google clustered 38 near-identical pages and kept
      the homepage as the canonical one.
   2. Every internal link was a #/ fragment. Google ignores fragments, so the
      homepage passed no links to any tool page.
   3. The four info pages (/about /pricing /privacy /terms) were in the
      sitemap but not routed to this Worker, and the SPA then reset their
      canonical to the homepage after rendering.
   4. Every tool page still declared hreflang="x-default" pointing at "/".

   WHAT THIS WORKER NOW DOES
   - Removes the shared hidden block from tool pages and puts a real, visible,
     tool-specific "About this tool" section below the app: description, steps,
     usage note, tool-specific FAQs, related tools and an all-tools link list,
     all as real <a href="/tool/..."> links.
   - Puts an <h1> + intro inside #view. The app replaces it on load; crawlers
     and no-JS visitors see it. (Same HTML for every visitor: not cloaking.)
   - Adds SoftwareApplication, BreadcrumbList and (where FAQs exist) FAQPage
     structured data.
   - Strips the hreflang tags from the pages it serves.
   - Returns a real 404 for unknown paths and a 503 (not a redirect to "/")
     if GitHub cannot be reached, so Google never learns "tool page = home".
   - Sitemap uses a fixed LASTMOD instead of "today". Bump LASTMOD when you
     change content.
   ========================================================================== */

const ORIGIN_HTML =
  'https://raw.githubusercontent.com/Nitishchoudhary99/My-website/main/index.html';

const SITE = 'https://docbrisk.com';
const LASTMOD = '2026-09-18';

const TOOLS = {
 "photo-studio": {
  "t": "Passport Photo Maker & Background Remover",
  "d": "Remove or replace the background, crop to official passport, visa and ID specs for 14 countries, enhance, and lay out a ready-to-print sheet.",
  "l": "Remove or replace a photo background, crop to official passport, visa and ID specifications for 14 countries, enhance the image, and lay out a ready-to-print sheet.",
  "steps": [
   "Upload a portrait photo.",
   "Remove or replace the background, then choose the passport, visa or ID size for your country.",
   "Adjust the enhancement, set a KB cap if your portal needs one, and download a single photo or a ready-to-print sheet."
  ],
  "use": "Handy for passport, visa, exam-form and government-portal photos that need an exact size and file limit.",
  "faq": [
   [
    "Can I make a passport photo without Photoshop?",
    "Yes. The Photo Studio removes the background, crops to official specifications for 14 countries including India, the US, the UK, Schengen, Canada, Australia, China and Japan, and shows crown and chin compliance guides. It then lays out a print sheet so you can get physical copies at any photo counter."
   ],
   [
    "How does background removal work without an AI model download?",
    "It runs a border-seeded flood fill in perceptual colour space: every edge pixel becomes a seed, and connected regions within your tolerance are treated as backdrop. That is the right model for ID photos, where the subject never touches all four edges but the backdrop always does. A keep/erase brush handles anything the automatic pass misses."
   ],
   [
    "How do I make a passport photo under 100 KB?",
    "In the Photo Studio's Export tab, set a KB cap. The tool reduces JPEG quality step by step until the file fits the limit, which is what most government and university portals require."
   ]
  ]
 },
 "doc-scanner": {
  "t": "Scan Documents with Perspective Correction",
  "d": "Photograph a page at any angle and a perspective transform flattens it into a straight-on scan, then cleans it into a crisp document.",
  "l": "Photograph a page from any angle and a perspective transform flattens it into a straight-on scan, then adaptive thresholding cleans it into a crisp black-and-white document.",
  "steps": [
   "Take a photo of the page, or upload one.",
   "Mark the four corners of the document.",
   "Let the perspective correction flatten the page, clean it up and save the scan."
  ],
  "use": "Turns phone photos of contracts, receipts and forms into straight, readable scans.",
  "faq": [
   [
    "What does the document scanner's perspective correction actually do?",
    "It solves an eight-parameter projective homography between the four corners you mark and a flat rectangle, then inverse-maps every output pixel with bilinear sampling. A page photographed at an angle comes out looking like it was laid flat on a scanner bed."
   ]
  ]
 },
 "cv-studio": {
  "t": "AI Resume & CV Builder — 25 ATS Templates",
  "d": "Build an ATS-friendly resume from 25 professional templates with live preview, deep customisation and a built-in ATS score check.",
  "l": "Build an applicant-tracking-friendly resume from 25 professional templates across ATS, executive, technical, academic, creative and Indian corporate categories, with live preview, full colour and typography control, section reordering and a built-in ATS readiness score.",
  "steps": [
   "Pick one of the 25 templates.",
   "Fill in your details, or import an existing PDF, DOCX or text résumé.",
   "Check the built-in ATS score, then export your CV."
  ],
  "use": "Built for job applications where an applicant tracking system reads your CV before a person does.",
  "faq": [
   [
    "Is the resume builder really free?",
    "Five ATS-focused templates are free forever with unlimited exports and no watermark. The remaining twenty templates, the Batch Processor and Smart Redaction are part of DocBrisk Pro at ₹99 a month."
   ],
   [
    "Will my resume pass an ATS?",
    "The builder exports real selectable text rather than an image, which is the single biggest factor in whether an applicant tracking system can read your CV. A built-in ATS check scores your draft and flags common problems such as missing contact details, unquantified bullets or a two-column layout that legacy parsers may read out of order."
   ],
   [
    "Can I upload my existing CV and restyle it?",
    "Yes. The Import CV tab in the Resume Builder reads a PDF, DOCX or text résumé, extracts your name, contact details, roles with dates and bullets, education, skills, projects and certifications, then loads them into the editor so you can render them in any of the 25 templates. It reports a confidence score and flags anything it was unsure about."
   ],
   [
    "What are the AI features and do they need an API key?",
    "None of them need a key, and nothing is uploaded. The Smart Review analyses every bullet for weak openers, passive voice, missing numbers and filler phrases, suggests stronger action verbs, matches your CV against a pasted job description to show which of its keywords you are missing, and drafts a summary from facts already in your CV. These are linguistic and statistical checks that run instantly on your device — not a language model."
   ]
  ]
 },
 "id-card": {
  "t": "Aadhaar & ID Card Print Sheet Maker",
  "d": "Place the front and back of an Aadhaar, PAN, voter ID or licence on one sheet — stacked or side by side, at exact card size with cut guides.",
  "l": "Place the front and back of an Aadhaar, PAN, voter ID, driving licence or health card on a single sheet, stacked vertically or side by side, at exact 85.6 x 54 mm card size with cut guides.",
  "steps": [
   "Add the front and back images of your card.",
   "Choose stacked or side-by-side layout and your paper size.",
   "Print at exact card size with cut guides."
  ],
  "use": "Useful when a form or office asks for a single printed copy showing both sides of an ID.",
  "faq": [
   [
    "Can I print my Aadhaar card front and back on one page?",
    "Yes. The ID Card tool places the front and back either stacked vertically or side by side at exact 85.6 x 54 mm card size, with cut guides, on A4, A5, US Letter or 4x6 paper. Print at 100% scale rather than fit-to-page so the card comes out true size."
   ]
  ]
 },
 "pdf-editor": {
  "t": "Free Online PDF Editor",
  "d": "Add and edit text, highlights, shapes, images and freehand notes on any PDF, with undo/redo, zoom and layers.",
  "l": "Add and edit text, highlights, shapes, images and freehand notes on any PDF, with undo/redo, zoom, layer ordering and keyboard shortcuts.",
  "steps": [
   "Open the PDF you want to edit.",
   "Add text, highlights, shapes, images or freehand notes, and arrange the layers.",
   "Undo or redo as needed, then export the edited PDF."
  ],
  "use": "Good for filling in forms, annotating drafts and marking up documents without installing software.",
  "faq": [
   [
    "Does the PDF editor let me change text already in the document?",
    "You can cover existing text with a filled shape and type replacement text on top, which is how most editors handle scanned or flattened documents. Directly re-flowing original embedded text is not possible for arbitrary PDFs in a browser, because fonts and layout are embedded rather than editable markup."
   ]
  ]
 },
 "compare-pdf": {
  "t": "Compare Two PDF Versions",
  "d": "Pixel-accurate visual diff between two revisions, highlighting exactly what changed on every page.",
  "l": "Pixel-accurate visual diff between two document revisions, highlighting exactly what changed on every page.",
  "steps": [
   "Add the two versions of the document.",
   "Both revisions are rendered at the same scale and compared pixel by pixel.",
   "Review the tinted changes and the percentage changed on each page."
  ],
  "use": "Useful for contracts, policies and reports where you need to see exactly what changed between revisions.",
  "faq": [
   [
    "Can I check what changed between two versions of a contract?",
    "Yes. Compare PDFs renders both revisions at identical scale and performs a pixel-level diff, tinting changed regions red and reporting the percentage changed per page, so you can see edits that a text diff would miss such as moved figures or altered signatures."
   ]
  ]
 },
 "pdf-to-word": {
  "t": "Convert PDF to Word (DOCX)",
  "d": "Turn a PDF into an editable Word document that keeps the original design, or into clean reflowed text with real headings, lists and tables.",
  "l": "Turn a PDF into an editable Word document that keeps the original design, or into clean reflowed text with real headings, lists and tables.",
  "steps": [
   "Add the PDF.",
   "Choose Exact look to keep the page design with editable text on top, or Reflowed to rebuild headings, lists, columns and tables.",
   "Download the Word (DOCX) file."
  ],
  "use": "Use it when you need to edit a document that only exists as a PDF.",
  "faq": [
   [
    "How good is your PDF to Word conversion?",
    "It has two modes. Exact look keeps the page design: colours, shapes, lines, logos and photos stay where they were as the page background, and every line of text is placed back on top as real, editable Word text at its original position, size and colour. Reflowed mode runs a full layout analysis instead, rebuilding headings, lists, columns and tables as flowing Word structure that is easier to edit at length."
   ]
  ]
 },
 "organize-pdf": {
  "t": "Organize, Rotate & Split PDF Pages",
  "d": "Reorder, rotate, delete, extract and split pages visually, then export a rebuilt PDF or a ZIP of single pages.",
  "l": "Reorder, rotate, delete, extract and split pages visually, then export a rebuilt PDF or a ZIP of single pages.",
  "steps": [
   "Open a PDF to see all its pages.",
   "Reorder, rotate, delete, extract or split pages visually.",
   "Export the rebuilt PDF, or a ZIP of single pages."
  ],
  "use": "Use it to fix page order, remove blank or unwanted pages, or pull single pages out of a long file.",
  "faq": []
 },
 "redact-pdf": {
  "t": "Redact a PDF Permanently",
  "d": "Destroy sensitive text and images by flattening the marked pages — the hidden content cannot be copied back out.",
  "l": "Destroy sensitive text and images by flattening the marked pages — the hidden content cannot be copied back out.",
  "steps": [
   "Open the PDF and mark the text or images to remove.",
   "Marked pages are flattened so the underlying content is destroyed rather than just covered.",
   "Download the redacted PDF."
  ],
  "use": "Use it before sharing a document that contains names, numbers or images that must not be recoverable.",
  "faq": [
   [
    "How is your redaction different from drawing a black box?",
    "Pages containing redactions are rasterised to an image with the boxes permanently burned in, then re-embedded. The original text objects are discarded entirely, so nothing can be selected, searched, copied or recovered."
   ]
  ]
 },
 "clean-metadata": {
  "t": "Remove Hidden PDF Metadata",
  "d": "Inspect and strip the author names, software fingerprints and timestamps hidden inside every document.",
  "l": "Inspect and strip the author names, software fingerprints and creation timestamps hidden inside every PDF before you share it.",
  "steps": [
   "Add the PDF.",
   "Inspect the hidden author names, software fingerprints and timestamps.",
   "Strip them and download the clean file."
  ],
  "use": "Use it before sending a document externally, since PDFs often carry the author's name and the software used.",
  "faq": [
   [
    "Why should I strip metadata before sharing a document?",
    "PDFs carry hidden fields recording the author's name, the software and version used, and exact creation and modification timestamps. These survive email, printing to PDF and re-saving. The Metadata Cleaner shows you everything embedded and blanks it in one click."
   ]
  ]
 },
 "number-pdf": {
  "t": "Add Page Numbers or Bates Numbering",
  "d": "Apply page numbers, legal Bates numbering and headers with full control over format and placement.",
  "l": "Apply page numbers, legal Bates numbering and headers with full control over format, start value and placement.",
  "steps": [
   "Add the PDF.",
   "Choose page numbers, legal Bates numbering or headers, and set the format, start value and placement.",
   "Download the numbered PDF."
  ],
  "use": "Useful for legal bundles, submissions and printed packs that need reliable page references.",
  "faq": []
 },
 "impose-pdf": {
  "t": "N-up Printing & Booklet Imposition",
  "d": "Fit multiple pages per sheet, or reorder pages into saddle-stitch booklet order for folding and stapling.",
  "l": "Fit multiple pages onto each sheet, or reorder pages into saddle-stitch booklet order for folding and stapling.",
  "steps": [
   "Add the PDF.",
   "Choose N-up (several pages per sheet) or booklet order.",
   "Download the result, then print, fold and staple."
  ],
  "use": "Useful for printing handouts, booklets and zines with fewer sheets of paper.",
  "faq": []
 },
 "merge-pdf": {
  "t": "Merge PDF Files",
  "d": "Combine any number of PDFs into one document, losslessly and with zero quality reduction.",
  "l": "Combine any number of PDFs into one document, losslessly and with zero quality reduction.",
  "steps": [
   "Add the PDFs you want to combine.",
   "Put them in the order you need.",
   "Merge and download a single PDF, with no quality reduction."
  ],
  "use": "Use it to combine scans, forms and attachments into one file for email or upload.",
  "faq": []
 },
 "compress-pdf": {
  "t": "Compress PDF to a Target Size",
  "d": "Shrink a PDF to hit an exact KB or MB limit for upload portals, forms and email attachments.",
  "l": "Shrink a PDF to hit an exact KB or MB limit for upload portals, forms and email attachments.",
  "steps": [
   "Add the PDF.",
   "Set a target size in KB or MB, or choose a quality preset.",
   "Download the compressed file."
  ],
  "use": "Use it when a portal, form or email rejects a file for being too large.",
  "faq": [
   [
    "Why does compression make my text non-selectable?",
    "Aggressive size reduction renders each page to an image at reduced quality, which removes the text layer. Use a gentler target or the High quality preset to keep files sharper."
   ]
  ]
 },
 "watermark-pdf": {
  "t": "Add a Watermark to a PDF",
  "d": "Stamp text across every page with control over opacity, angle, size, colour and tiling.",
  "l": "Stamp text across every page with control over opacity, angle, size, colour and tiling.",
  "steps": [
   "Add the PDF.",
   "Enter the watermark text and set opacity, angle, size, colour and tiling.",
   "Apply it to every page and download."
  ],
  "use": "Use it to mark drafts, confidential documents or branded copies.",
  "faq": []
 },
 "translate-pdf": {
  "t": "Translate a PDF Document",
  "d": "Translate a whole PDF into 35 languages and download the result as an editable Word file or plain text.",
  "l": "Translate a whole PDF into 35 languages and download the result as an editable Word file or plain text.",
  "steps": [
   "Add the PDF.",
   "Choose one of the 35 supported languages.",
   "Download the translation as an editable Word file or plain text."
  ],
  "use": "Use it to understand a document in another language or produce an editable translation.",
  "faq": [
   [
    "Which languages does the translator support?",
    "Thirty-five languages including Spanish, French, German, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Urdu, Arabic, Hebrew, Chinese, Japanese, Korean, Russian and Swahili. Right-to-left scripts are handled correctly in the Word output."
   ]
  ]
 },
 "ocr-pdf": {
  "t": "OCR: Extract Text from Scans & Images",
  "d": "Pull selectable text out of scanned documents, photos and image-only PDFs in 15 languages.",
  "l": "Pull selectable text out of scanned documents, photos and image-only PDFs in 15 languages.",
  "steps": [
   "Add a scanned PDF, photo or image.",
   "Choose the language (15 are supported).",
   "Copy or download the selectable text."
  ],
  "use": "Use it when a scan or photo has text you need to search, copy or reuse.",
  "faq": [
   [
    "Do you support scanned PDFs?",
    "Use the OCR Scanner for image-only or scanned documents. It recognises text in 15 languages and outputs selectable, copyable text."
   ]
  ]
 },
 "sign-pdf": {
  "t": "Sign a PDF Online",
  "d": "Draw or type a signature, place it anywhere on the page, then download the signed document.",
  "l": "Draw or type a signature, place it anywhere on the page, then download the signed document.",
  "steps": [
   "Open the PDF.",
   "Draw or type your signature.",
   "Place it anywhere on the page and download the signed document."
  ],
  "use": "Use it to sign forms, agreements and letters without printing them.",
  "faq": []
 },
 "unlock-pdf": {
  "t": "Remove a PDF Password",
  "d": "Strip passwords and permission restrictions from PDFs you own, with no quality loss.",
  "l": "Strip passwords and permission restrictions from PDFs you own, with no quality loss.",
  "steps": [
   "Add a PDF that you own.",
   "Remove its password and permission restrictions.",
   "Download the unlocked copy."
  ],
  "use": "Use it when you own a PDF but a password or restriction is stopping you from printing, copying or editing it.",
  "faq": []
 },
 "pdf-to-image": {
  "t": "Convert PDF to PNG or JPG",
  "d": "Export every page as a high-resolution image at 96, 150 or 300 DPI, individually or as a ZIP.",
  "l": "Export every page as a high-resolution image at 96, 150 or 300 DPI, individually or as a ZIP.",
  "steps": [
   "Add the PDF.",
   "Choose PNG or JPG and a resolution of 96, 150 or 300 DPI.",
   "Download each page individually or as a ZIP."
  ],
  "use": "Use it to share pages as pictures or drop them into slides and documents.",
  "faq": []
 },
 "image-to-pdf": {
  "t": "Convert Images to PDF",
  "d": "Turn JPG, PNG and WebP images into one clean multi-page PDF with page-size and margin control.",
  "l": "Turn JPG, PNG and WebP images into one clean multi-page PDF with page-size and margin control.",
  "steps": [
   "Add your JPG, PNG or WebP images.",
   "Set the page size and margins.",
   "Download one clean multi-page PDF."
  ],
  "use": "Use it to bundle photos or scans into a single document for email or upload.",
  "faq": []
 },
 "extract-tables": {
  "t": "Extract Tables from a PDF to Excel or CSV",
  "d": "Finds tables by column alignment — no ruling lines needed — and exports them as a real spreadsheet or CSV files.",
  "l": "Detects tables by column alignment rather than ruling lines, so it works on documents where the table has no visible borders, and exports each one as a worksheet or CSV file.",
  "steps": [
   "Add a PDF that contains tables.",
   "Tables are found by column alignment, so ruling lines are not needed.",
   "Export them as a spreadsheet or CSV files."
  ],
  "use": "Use it to pull tables out of reports and statements without retyping them.",
  "faq": []
 },
 "pdf-to-excel": {
  "t": "Convert PDF to Excel (XLSX)",
  "d": "Detect tabular rows in a PDF and export them as a real spreadsheet, one worksheet per page.",
  "l": "Detect tabular rows in a PDF and export them as a real spreadsheet, one worksheet per page.",
  "steps": [
   "Add the PDF.",
   "Tabular rows are detected on each page.",
   "Download an XLSX with one worksheet per page."
  ],
  "use": "Use it to move tabular data from a PDF into a spreadsheet you can sort and calculate with.",
  "faq": []
 },
 "remove-watermark": {
  "t": "Remove a Watermark from a PDF",
  "d": "Three engines: delete repeating text without rasterising, strip logos that repeat across pages, or lift a watermark out by colour.",
  "l": "Three removal engines: delete repeating text directly from the page content stream without rasterising, strip logos that repeat across pages using cross-page consensus, or lift a watermark out by colour with an eyedropper.",
  "steps": [
   "Add the PDF.",
   "Choose an engine: repeating text, repeating logo, or colour.",
   "Run it and download the cleaned PDF."
  ],
  "use": "Results depend on how the watermark was added, so try each engine if the first does not clear it.",
  "faq": [
   [
    "Can you really remove a watermark from a PDF?",
    "Often, but not always, and no tool can promise otherwise — a watermark is ordinary page content, not a separate layer. The Text engine deletes repeating text straight from the page content stream and keeps your document vector and selectable, which handles most DRAFT, CONFIDENTIAL and trial-software stamps. The Logo engine removes graphics that repeat across pages, and the Colour engine lifts a watermark out by shade; both of those rasterise the output. Only remove watermarks from documents you have the right to modify."
   ],
   [
    "Will removing a watermark ruin my text?",
    "Not with the Text engine — it edits only the show-text operators that match, leaving every other object untouched. The Logo and Colour engines render pages to images, so text stops being selectable; run OCR afterwards if you need it back."
   ]
  ]
 },
 "extract-images": {
  "t": "Extract Embedded Images from a PDF",
  "d": "Pull every picture out of a PDF at its original resolution and save them individually or as a ZIP.",
  "l": "Pull every picture out of a PDF at its original embedded resolution and save them individually or as a ZIP archive.",
  "steps": [
   "Add the PDF.",
   "Every embedded picture is found at its original resolution.",
   "Save the images individually or as a ZIP."
  ],
  "use": "Use it to recover the original pictures from a brochure, report or presentation exported to PDF.",
  "faq": []
 },
 "clean-scan": {
  "t": "Deskew and Clean a Scanned PDF",
  "d": "Straighten crooked pages, drop blank sheets and sharpen faded scans into a clean, smaller document.",
  "l": "Automatically straighten crooked scanned pages, drop blank sheets left by duplex scanners, and sharpen faded documents into a clean smaller file.",
  "steps": [
   "Add a scanned PDF.",
   "Crooked pages are straightened, blank sheets dropped and faded pages sharpened.",
   "Download the cleaner, smaller document."
  ],
  "use": "Use it to tidy up scans from a phone or duplex scanner before you share or archive them.",
  "faq": []
 },
 "resize-pdf": {
  "t": "Resize & Normalise PDF Page Sizes",
  "d": "Force every page to A4, Letter or any standard size without rasterising — fixes documents a printer or portal rejects.",
  "l": "Force every page to A4, A3, Letter or Legal without rasterising, fixing documents that a printer or e-filing portal rejects for mixed page sizes.",
  "steps": [
   "Add a PDF with mixed or wrong page sizes.",
   "Choose A4, Letter or another standard size.",
   "Download the normalised PDF. Pages are resized, not rasterised."
  ],
  "use": "Use it when a printer or e-filing portal rejects a document for mixed page sizes.",
  "faq": []
 },
 "qr-stamp": {
  "t": "Add a QR Code to a PDF",
  "d": "Generate a QR code offline and stamp it onto any page for verification links, payment details or document tracking.",
  "l": "Generate a QR code entirely offline and stamp it onto any page for verification links, UPI payment details or document tracking.",
  "steps": [
   "Add the PDF.",
   "Enter the link, payment detail or text to encode. The QR code is generated offline.",
   "Place it on a page and download."
  ],
  "use": "Use it for verification links, payment details or document tracking on a printed page.",
  "faq": []
 },
 "doc-integrity": {
  "t": "Check a PDF for Tampering",
  "d": "Find out whether a PDF was edited after it was issued — incremental saves, mismatched fonts, re-encoded pages, and metadata that contradicts itself.",
  "l": "Examine whether a PDF was altered after it was issued. The check reads the file's own structure — appended save revisions, a producer that contradicts the creator, modification dates earlier than creation dates, individual pages re-encoded as flat images, typefaces that appear on only one page, and leftover editor annotations. Useful before accepting a salary slip, bank statement, invoice or certificate at face value. Runs entirely in your browser.",
  "steps": [
   "Add the PDF you want to check.",
   "Its structure is examined for incremental saves, mismatched fonts, re-encoded pages and contradictory metadata.",
   "Review the findings."
  ],
  "use": "A clean result is not proof that a document is genuine, and a flagged result is not proof of fraud. Treat it as a signal to look closer.",
  "faq": []
 },
 "pdf-to-ppt": {
  "t": "Convert PDF to PowerPoint",
  "d": "Turn each page into an editable slide — either as a crisp page image or as real, editable text and headings.",
  "l": "Turn every page of a PDF into a PowerPoint slide — either as a sharp page image that matches the original exactly, or as real editable text with headings and bullets you can retype. Slide size, image quality and speaker notes are all configurable, and the .pptx opens in PowerPoint, Keynote and Google Slides.",
  "steps": [
   "Add the PDF.",
   "Choose crisp page images or real, editable text and headings.",
   "Download the PowerPoint file."
  ],
  "use": "Use it to turn a report or handout into slides you can present.",
  "faq": []
 },
 "qr-maker": {
  "t": "Free QR Code Generator",
  "d": "Make QR codes for links, Wi-Fi, contacts, UPI payments or plain text. Generated offline and downloadable as PNG or SVG.",
  "l": "Create QR codes for website links, plain text, Wi-Fi networks, contact cards, UPI payments, email, phone numbers and SMS. Choose colours and error-correction level, then download as PNG for screens or SVG for print. The code is generated by the page itself, so nothing you encode is ever sent anywhere.",
  "steps": [
   "Choose the type: link, Wi-Fi, contact, UPI payment, text, email, phone or SMS.",
   "Enter the details and pick colours and error-correction level.",
   "Download the code as PNG or SVG."
  ],
  "use": "Use it for menus, Wi-Fi sharing, contact cards, UPI payments and links on posters and printouts.",
  "faq": []
 },
 "invoice-maker": {
  "t": "Free GST Invoice Generator",
  "d": "Build a professional invoice with GST or flat tax, line items, HSN codes and a scannable UPI QR for instant payment.",
  "l": "Build a professional invoice with GST (CGST/SGST or IGST) or flat tax, line items with HSN and SAC codes, and a scannable UPI QR code carrying the exact total so clients can pay instantly.",
  "steps": [
   "Enter your business and client details.",
   "Add line items with HSN or SAC codes and choose GST (CGST/SGST or IGST) or flat tax.",
   "Download the invoice with a UPI QR code for the exact total."
  ],
  "use": "Built for Indian freelancers and small businesses that need GST-ready invoices with a UPI payment QR.",
  "faq": []
 },
 "mail-merge": {
  "t": "Bulk Certificate & Letter Generator",
  "d": "Combine one PDF template with a spreadsheet to produce hundreds of personalised certificates, offer letters or cards at once.",
  "l": "Combine one PDF template with a CSV or Excel sheet to produce hundreds of personalised certificates, offer letters, ID cards or award slips in a single run.",
  "steps": [
   "Add a PDF template.",
   "Add a CSV or Excel sheet with one row per recipient.",
   "Generate hundreds of personalised certificates, letters or cards in one run."
  ],
  "use": "Use it for certificates, offer letters, ID cards and award slips that follow one template.",
  "faq": []
 },
 "split-by-size": {
  "t": "Split a PDF by File Size or Page Count",
  "d": "Break a large PDF into parts that each stay under an upload limit, or into fixed page counts and equal sections.",
  "l": "Break a large PDF into parts that each stay under a portal's upload limit, or into fixed page counts and equal sections.",
  "steps": [
   "Add the large PDF.",
   "Choose a maximum file size, a fixed page count or equal sections.",
   "Download the parts."
  ],
  "use": "Use it when an upload portal caps the size of each file.",
  "faq": []
 },
 "sheet-to-pdf": {
  "t": "Convert Excel or CSV to a PDF Table",
  "d": "Turn a spreadsheet into a clean paginated PDF table with repeating headers and auto-fitted columns.",
  "l": "Turn a spreadsheet into a clean paginated PDF table with repeating header rows, auto-fitted column widths and alternate row shading.",
  "steps": [
   "Add an Excel or CSV file.",
   "Header rows repeat on every page and columns are auto-fitted.",
   "Download the paginated PDF table."
  ],
  "use": "Use it to share a spreadsheet as a tidy, print-ready PDF.",
  "faq": []
 },
 "batch-process": {
  "t": "Batch Process Hundreds of PDFs",
  "d": "Apply compression, watermarks, numbering, metadata stripping or conversion across an entire folder at once, delivered as a ZIP.",
  "l": "Apply compression, watermarks, page numbering, metadata stripping or format conversion across an entire folder of documents in one run, delivered as a single ZIP.",
  "steps": [
   "Add a batch of PDFs.",
   "Choose compression, watermarks, numbering, metadata stripping or conversion.",
   "Download everything as a single ZIP."
  ],
  "use": "Use it when the same operation has to be applied to a whole folder of PDFs. It is part of DocBrisk Pro.",
  "faq": [],
  "pro": 1
 },
 "smart-redact": {
  "t": "Automatically Detect & Redact Sensitive Data",
  "d": "Scan a document for Aadhaar, PAN, card numbers, emails, phone numbers and dates of birth, then destroy every match in one pass.",
  "l": "Scan a document for Aadhaar numbers, PAN numbers, card numbers, IFSC codes, email addresses, phone numbers and dates of birth, then permanently destroy every match.",
  "steps": [
   "Add a PDF.",
   "The text layer is scanned for Aadhaar, PAN, card numbers, IFSC codes, emails, phone numbers, US SSNs and dates of birth, plus any custom words you add.",
   "Destroy every match in one pass and download."
  ],
  "use": "Use it when a document contains many identifiers that must be removed before it is shared. It is part of DocBrisk Pro. Pattern matching is not perfect, so check the result.",
  "faq": [
   [
    "How is your redaction different from drawing a black box?",
    "Pages containing redactions are rasterised to an image with the boxes permanently burned in, then re-embedded. The original text objects are discarded entirely, so nothing can be selected, searched, copied or recovered."
   ],
   [
    "What does Smart Redaction detect?",
    "It scans the text layer for Aadhaar numbers, PAN numbers, card numbers, IFSC codes, email addresses, phone numbers, US SSNs and dates of birth, plus any custom words you add. Pattern matching is reliable for structured data but cannot recognise names or addresses, so always verify the output before sharing."
   ]
  ],
  "pro": 1
 },
 "word-to-pdf": {
  "t": "Convert Word to PDF",
  "d": "Convert .docx documents into clean, shareable PDF files with preserved paragraph flow.",
  "l": "Convert .docx documents into clean, shareable PDF files with preserved paragraph flow.",
  "steps": [
   "Add a .docx file.",
   "Paragraph flow is preserved during conversion.",
   "Download the PDF."
  ],
  "use": "Use it to send a Word document in a format that looks the same everywhere.",
  "faq": []
 }
};
const GROUPS = [["photo-studio", "doc-scanner", "id-card", "cv-studio", "ocr-pdf", "image-to-pdf"], ["pdf-editor", "sign-pdf", "redact-pdf", "smart-redact", "clean-metadata", "unlock-pdf", "watermark-pdf", "remove-watermark", "number-pdf", "doc-integrity"], ["merge-pdf", "split-by-size", "organize-pdf", "compress-pdf", "resize-pdf", "impose-pdf", "clean-scan", "batch-process", "compare-pdf"], ["pdf-to-word", "word-to-pdf", "pdf-to-excel", "extract-tables", "sheet-to-pdf", "pdf-to-image", "image-to-pdf", "pdf-to-ppt", "extract-images", "translate-pdf", "ocr-pdf"], ["qr-maker", "qr-stamp", "invoice-maker", "mail-merge", "sheet-to-pdf"]];

const STATIC_PAGES = {
  'privacy': ['Privacy Policy | DocBrisk', 'How DocBrisk handles your documents: everything is processed in your browser and nothing is uploaded.', 'Privacy Policy'],
  'about':   ['About DocBrisk', 'Why DocBrisk processes documents entirely in the browser, and who builds it.', 'About DocBrisk'],
  'terms':   ['Terms of Use | DocBrisk', 'The terms that apply when you use the free document tools on DocBrisk.', 'Terms of Use'],
  'pricing': ['Pricing — Free Tools and DocBrisk Pro', 'Every core tool is free and unlimited. DocBrisk Pro unlocks the remaining templates and advanced tools for ₹99 a month.', 'Pricing']
};

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function titleFor(base) {
  return base.length > 34 ? base + ' | DocBrisk' : base + ' — Free & Private | DocBrisk';
}

/* Always use a replacer FUNCTION with String.replace: a plain string
   replacement treats "$&" and "$1" specially and would corrupt content. */
function setTag(html, pattern, value) {
  return html.replace(pattern, (m) =>
    m.replace(/(content|href)="[^"]*"/, (a, attr) => attr + '="' + esc(value) + '"'));
}

function rewriteHead(html, { title, desc, url }) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => '<title>' + esc(title) + '</title>');
  html = setTag(html, /<meta name="description"[^>]*>/, desc);
  html = setTag(html, /<link rel="canonical"[^>]*>/, url);
  html = setTag(html, /<meta property="og:title"[^>]*>/, title);
  html = setTag(html, /<meta property="og:description"[^>]*>/, desc);
  html = setTag(html, /<meta property="og:url"[^>]*>/, url);
  html = setTag(html, /<meta name="twitter:title"[^>]*>/, title);
  html = setTag(html, /<meta name="twitter:description"[^>]*>/, desc);
  // The site is single-language; a hreflang pointing every page at "/" only adds noise.
  html = html.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\s*/g, () => '');
  return html;
}

/* ---------- content builders ---------- */

function relatedSlugs(slug, n) {
  const out = [];
  GROUPS.forEach((g) => {
    if (g.indexOf(slug) === -1) return;
    const i = g.indexOf(slug);
    // start after the tool itself and wrap, so different tools get different neighbours
    for (let k = 1; k < g.length; k++) {
      const s = g[(i + k) % g.length];
      if (s !== slug && out.indexOf(s) === -1) out.push(s);
    }
  });
  return out.slice(0, n);
}

function toolLink(slug) {
  return '<a href="/tool/' + slug + '">' + esc(TOOLS[slug].t) + '</a>';
}

function allToolsNav() {
  return '<section class="prose" id="all-tools" style="margin-top:32px">' +
    '<h2>All DocBrisk tools</h2>' +
    '<ul style="columns:2;column-gap:28px;padding-left:18px">' +
    Object.keys(TOOLS).map((s) => '<li>' + toolLink(s) + '</li>').join('') +
    '</ul></section>';
}

function faqFor(slug) {
  const t = TOOLS[slug];
  const list = t.faq.slice();
  if (t.pro) {
    list.push(['Is ' + t.t + ' free?', 'It is part of DocBrisk Pro at ₹99 a month. Most other DocBrisk tools are free to use with no signup.']);
  }
  if (slug === 'translate-pdf') {
    list.push(['Are my documents uploaded to a server?', 'The PDF itself never leaves your device. Only the extracted text is sent to a public translation service so it can be translated.']);
  } else {
    list.push(['Are my files uploaded to a server?', 'No. ' + t.t + ' runs as JavaScript inside your own browser tab. Your file is read from your device into browser memory and the result is saved back as a download, so nothing is transmitted.']);
  }
  return list;
}

function toolAboutHtml(slug) {
  const t = TOOLS[slug];
  const steps = t.steps.map((s) => '<li>' + esc(s) + '</li>').join('');
  const rel = relatedSlugs(slug, 5).map((s) =>
    '<li>' + toolLink(s) + ' — ' + esc(TOOLS[s].d) + '</li>').join('');
  const faq = faqFor(slug).map((f) =>
    '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>').join('');

  return '<div id="seo-about" class="wrap">' +
    '<section class="prose" id="tool-about" style="margin-top:56px">' +
      '<h2>About ' + esc(t.t) + '</h2>' +
      '<p>' + esc(t.l) + '</p>' +
      '<h3>How it works</h3><ol>' + steps + '</ol>' +
      '<p>' + esc(t.use) + '</p>' +
    '</section>' +
    '<section class="faq" aria-labelledby="toolFaqHeading">' +
      '<h2 id="toolFaqHeading" style="text-align:center">Questions about ' + esc(t.t) + '</h2>' + faq +
    '</section>' +
    '<section class="prose" id="related-tools" style="margin-top:32px">' +
      '<h2>Related tools</h2><ul>' + rel + '</ul>' +
    '</section>' +
    allToolsNav() +
  '</div>';
}

function toolSchema(slug) {
  const t = TOOLS[slug];
  const url = SITE + '/tool/' + slug;
  const app = {
    '@type': 'SoftwareApplication',
    'name': t.t,
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Any (runs in browser)',
    'description': t.d,
    'url': url
  };
  if (!t.pro) app.offers = { '@type': 'Offer', 'price': '0', 'priceCurrency': 'INR' };

  const graph = [
    app,
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'DocBrisk', 'item': SITE + '/' },
        { '@type': 'ListItem', 'position': 2, 'name': t.t, 'item': url }
      ]
    }
  ];
  const faqs = faqFor(slug);
  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      'mainEntity': faqs.map((f) => ({
        '@type': 'Question', 'name': f[0],
        'acceptedAnswer': { '@type': 'Answer', 'text': f[1] }
      }))
    });
  }
  // "<" is escaped so a stray "</script>" in content can never break out of the tag
  return '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') +
    '</script>';
}

/* ---------- HTML surgery ---------- */

const VIEW_RE = /(<div class="wrap" id="view">)[\s\S]*?(<\/div>)/;
const SEO_BLOCK_RE = /<div id="noscript-seo">[\s\S]*?\n<\/div>/;

function shell(h1, intro) {
  return '<div class="tool-shell"><div class="tool-head"><h1>' + esc(h1) + '</h1><p>' + esc(intro) + '</p></div></div>';
}

function build(html, { title, desc, url, h1, aboutHtml, extraHead }) {
  html = rewriteHead(html, { title, desc, url });
  // Placeholder inside #view: the app overwrites it on load, crawlers read it.
  html = html.replace(/<h1>JavaScript is required<\/h1>/, () => '<p><strong>JavaScript is required</strong></p>');
  html = html.replace(VIEW_RE, (m, open, close) => open + shell(h1, desc) + close);
  // Replace the shared, site-wide hidden block with page-specific visible content.
  html = html.replace(SEO_BLOCK_RE, () => aboutHtml);
  if (extraHead) html = html.replace('</head>', () => extraHead + '</head>');
  return html;
}

async function baseHtml() {
  try {
    const res = await fetch(ORIGIN_HTML, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

const htmlHeaders = {
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'public, max-age=300',
  'X-Robots-Tag': 'index, follow'
};

const unavailable = () => new Response('Temporarily unavailable. Please retry shortly.', {
  status: 503,
  headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '300', 'Cache-Control': 'no-store' }
});

const notFound = () => new Response(
  '<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex">' +
  '<title>Page not found | DocBrisk</title><h1>Page not found</h1>' +
  '<p><a href="/">Browse all DocBrisk tools</a></p>',
  { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });

function sitemap() {
  const urls = [SITE + '/']
    .concat(Object.keys(TOOLS).map((s) => SITE + '/tool/' + s))
    .concat(Object.keys(STATIC_PAGES).map((s) => SITE + '/' + s));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => '  <url><loc>' + u + '</loc><lastmod>' + LASTMOD + '</lastmod></url>').join('\n') +
    '\n</urlset>\n';
}

export default {
  async fetch(request) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (path === '/sitemap.xml') {
      return new Response(sitemap(), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
    }

    if (path === '/robots.txt') {
      return new Response('User-agent: *\nAllow: /\n\nSitemap: ' + SITE + '/sitemap.xml\n',
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    }

    const toolMatch = path.match(/^\/tool\/([a-z0-9-]+)$/);
    if (toolMatch && TOOLS[toolMatch[1]]) {
      const slug = toolMatch[1];
      const t = TOOLS[slug];
      const html = await baseHtml();
      if (!html) return unavailable();
      const out = build(html, {
        title: titleFor(t.t), desc: t.d, url: SITE + '/tool/' + slug, h1: t.t,
        aboutHtml: toolAboutHtml(slug), extraHead: toolSchema(slug)
      });
      return new Response(out, { headers: htmlHeaders });
    }

    const staticSlug = path.replace(/^\//, '');
    if (STATIC_PAGES[staticSlug]) {
      const [title, desc, h1] = STATIC_PAGES[staticSlug];
      const html = await baseHtml();
      if (!html) return unavailable();
      const out = build(html, {
        title, desc, url: SITE + '/' + staticSlug, h1,
        aboutHtml: '<div id="seo-about" class="wrap">' + allToolsNav() + '</div>'
      });
      return new Response(out, { headers: htmlHeaders });
    }

    return notFound();
  }
};
