/* ==========================================================================
   DocBrisk — SEO Worker v4

   v4.1 (2026-09-20): compression and PDF editor pages describe the new
   text-preserving compressor and in-place text editing.
   v4.2 (2026-09-22): long-form English guides plus a Hindi section on the six
   highest-intent tool pages (compress-pdf, pdf-to-word, id-card,
   photo-studio, invoice-maker, unlock-pdf). See GUIDES.
   v4.3 (2026-09-24): new tool /tool/exam-photo (Exam Photo & Signature
   Resizer), eight exam landing pages at /exam/<slug> (SSC, Railway RRB,
   IBPS & SBI, UPSC, NEET UG, JEE Main, CAT, India Post GDS) with their own
   sizes, Hindi summary and FAQ, and a KW map of target searches for every
   tool (visible "Also searched as" line, meta keywords, schema keywords).

   WHAT CHANGED FROM v3
   - Pro flags now match the app. v3 marked only 2 of the 8 Pro tools as Pro,
     so 6 paid tools told Google they cost ₹0.
   - Tool pages no longer carry the homepage's structured data. v3 left the
     homepage JSON-LD (with its own FAQPage) in place and added a second
     FAQPage, so every tool page had two FAQ blocks.
   - Search-tuned <title>s for the high-volume tools ("Compress PDF to 100KB…",
     "Aadhaar Card Print Front and Back…"). The page <h1> stays the tool name.
   - A <meta name="db-ssr"> tag tells the app not to overwrite this head on
     first load (the v3 setup lost the tuned titles as soon as JS ran).
   - Handles "/" too: a visible, crawlable <h1> and tool list for anything that
     reads the page without running JavaScript.
   - 301s: www → apex, trailing slash → none, /index.html → /.
   - Serves /manifest.webmanifest and /sw.js (installable app + offline), and
     passes static files (og-image.png, icons, /.well-known/, verification
     files) through to the GitHub repo, so this Worker can front the whole
     domain.
   - Built pages are cached at the edge and sent with an ETag, so repeat
     requests are a 304 instead of 800 KB.

   v4.4 (2026-09-27): three new tools (Marriage Biodata Maker, Letter &
   Application Maker, GSTIN Validator); 31 search landing pages at clean
   top-level URLs such as /compress-pdf-to-100kb, each with its own title,
   description, visible guide, FAQ and schema, listed in the sitemap and
   linked from their tool pages and the tool index. Tool titles that competed
   with a landing page for the same search now target the broader phrase, and
   a landing page's searches are no longer claimed by its tool (see LANDINGS).
   /jpg-to-pdf, /pdf-to-jpg and /passport-size-photo-maker 301 to their tools.
   Word to PDF describes the new layout-preserving engine. The manifest adds
   "Share to DocBrisk" (share_target); the service worker receives the shared
   files and hands them to the home page.

   ROUTES: point  docbrisk.com/*  and  www.docbrisk.com/*  at this Worker
   (Workers → docbrisk-seo → Settings → Domains & Routes). Nothing else needs
   to serve the domain. See the note at SW_ENABLED if offline mode ever
   misbehaves.
   ========================================================================== */

const REPO_RAW = 'https://raw.githubusercontent.com/Nitishchoudhary99/My-website/main';
const ORIGIN_HTML = REPO_RAW + '/index.html';

const SITE = 'https://docbrisk.com';
const LASTMOD = '2026-10-01';          // bump when page content changes
const BUILD = '2026-10-01a';              // bump on every deploy of this Worker
const SW_ENABLED = true;                // false = ship a service worker that removes itself
const PRO_PRICE = 99;

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
  ],
  "st": "Passport Size Photo Maker & Background Remover"
 },
 "exam-photo": {
  "t": "Exam Photo & Signature Resizer",
  "d": "Resize your photo and signature to the exact pixels and KB range for SSC, Railway, IBPS, SBI, UPSC, NEET, JEE, CAT and India Post forms. Free, no upload.",
  "l": "Pick your exam and DocBrisk sets the exact pixel size and KB window its portal accepts. It crops your photo to the frame, turns a phone picture of your signature into clean ink on white paper, and saves each file as a JPG that lands inside the allowed range, including the minimum size that many portals also enforce.",
  "steps": [
   "Choose your exam, or enter the size printed in your notification.",
   "Add your photo and a picture of your signature on plain white paper.",
   "Adjust the crop, check the green ticks for pixels and KB, and download each file."
  ],
  "use": "Built for recruitment and entrance-exam forms that reject any file outside a fixed pixel size and KB range.",
  "faq": [
   [
    "How do I resize my photo to 20 KB to 50 KB?",
    "Choose your exam, or type 20 and 50 as the minimum and maximum KB. DocBrisk finds the highest JPEG quality that stays under the maximum. If the file is still below the minimum, it adds a small comment block inside the JPEG so the file reaches the size the portal expects, without changing the picture."
   ],
   [
    "How do I make my signature 10 KB to 20 KB?",
    "Sign on plain white paper with a black or blue pen, take a picture in daylight and add it. Keep \"Clean the paper\" and \"Trim to the ink\" switched on. The signature is placed on a white background at the exact pixel size and saved between 10 and 20 KB."
   ],
   [
    "Why does the portal say my file is too small?",
    "Many exam portals set a minimum size as well as a maximum, for example 20 KB to 50 KB. A small photo saved at normal quality can come out at 8 or 9 KB and get rejected. DocBrisk checks both limits and brings the file inside the range."
   ],
   [
    "Do SSC and Railway forms still need a photo upload?",
    "For most 2026 notices, no. SSC and several RRB recruitments capture your photograph live inside the application form. You still upload a scanned signature, which this tool prepares."
   ],
   [
    "Are the exam sizes always up to date?",
    "The presets follow the 2026 notifications and were last checked in September 2026. Commissions sometimes change sizes between cycles, so compare them with your own notification. Every value can be edited."
   ]
  ],
  "st": "Exam Photo & Signature Resizer (SSC, RRB, IBPS)"
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
  ],
  "st": "Scan Documents with Your Phone Camera — Free"
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
  ],
  "st": "Free Resume Builder — 25 ATS CV Templates"
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
  ],
  "st": "ID Card Print on A4: Aadhaar, PAN, Voter ID"
 },
 "pdf-editor": {
  "t": "Free Online PDF Editor",
  "d": "Change the existing text in a PDF, or add text, signatures, highlights, shapes and images. Free, in your browser, no upload.",
  "l": "Click any line of existing text and type to change it: DocBrisk matches the size, colour and font style, removes the original words from the page and checks the result pixel by pixel. You can also add text, highlights, shapes, images, sticky notes and freehand drawing, with undo and redo, zoom and layers.",
  "steps": [
   "Open the PDF you want to edit.",
   "Choose Edit text and click any line to change it, or add text, highlights, shapes and images.",
   "Export the edited PDF."
  ],
  "use": "Good for correcting a name, date or amount, filling in forms and marking up documents without installing software.",
  "faq": [
   [
    "Can I edit the existing text in a PDF?",
    "Yes. Choose Edit text, click any line and type. DocBrisk matches the size, colour and font style, removes the original words from the page itself and checks the result before saving. On scanned pages, where the text is part of a picture, the old line is covered with a matching background colour instead, and the export tells you."
   ],
   [
    "Will the edited text use the same font?",
    "It uses the closest standard font (Helvetica, Times or Courier) in the same size, weight and colour, including the ₹ sign. Fonts embedded in the original PDF are usually partial copies, so they cannot type new letters."
   ]
  ],
  "st": "Free PDF Editor — Edit Existing Text Online"
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
  ],
  "st": "Compare Two PDF Files — See Every Change"
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
  ],
  "st": "PDF to Word Converter — Free, Editable DOCX"
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
  "faq": [],
  "st": "Rotate, Delete & Reorder PDF Pages — Free"
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
  ],
  "st": "Redact PDF Online — Permanently Black Out Text"
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
  ],
  "st": "Remove PDF Metadata — Author, Dates, Software"
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
  "faq": [],
  "st": "Add Page Numbers to PDF — Free, with Bates"
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
  "faq": [],
  "st": "Merge PDF Files Online Free — No Upload"
 },
 "compress-pdf": {
  "t": "Compress PDF to a Target Size",
  "d": "Shrink a PDF to 100 KB, 200 KB or any size for exam and government portals, while keeping its text selectable.",
  "l": "Shrink a PDF to an exact KB or MB limit for upload portals, forms and email attachments. DocBrisk recompresses only the photos and scans inside the file and cleans up its structure, so text, links, bookmarks and form fields stay intact. Pages are flattened into images only if you allow it and there is no other way to reach the limit.",
  "steps": [
   "Add the PDF. DocBrisk shows what is taking up the space.",
   "Pick a size limit such as 100 KB or 200 KB, or choose a quality level. Tick Black and white for the smallest scans.",
   "Download the compressed file. The result tells you whether the text was kept."
  ],
  "use": "Use it when an exam, job or government portal, or an email, rejects a file for being too large.",
  "faq": [
   [
    "Does compressing a PDF keep the text selectable?",
    "Yes. Only the photos and scans inside the PDF are recompressed, so text, links, bookmarks and form fields stay exactly as they were. Pages are turned into images only if you ask for a size the file cannot otherwise reach and leave \"Flatten pages if needed\" ticked, and the result says when that happened."
   ],
   [
    "How do I compress a PDF to 100 KB?",
    "Add the PDF, tap the 100 KB button and press Compress PDF. DocBrisk tries the highest image quality that fits under 100 KB. If a scanned file still will not fit, tick Black and white, which usually halves the size again."
   ],
   [
    "Why can a text-only PDF not get much smaller?",
    "Most of its size is fonts and text, which are already compact. Big savings come from photos and scans. DocBrisk shows the breakdown before you compress, so you know what to expect."
   ]
  ],
  "st": "Compress PDF Online: Reduce PDF Size, Free"
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
  "faq": [],
  "st": "Add Watermark to PDF Online — Free"
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
  ],
  "st": "Translate PDF Online into 35 Languages"
 },
 "ocr-pdf": {
  "t": "OCR: Turn Scans into Searchable PDF or Editable Word",
  "d": "Turn scanned documents and photos into a searchable PDF that looks identical, or an editable Word file with the same layout. 3 free uses.",
  "l": "Recognise the text in scans, photos and image-only PDFs. Get a searchable PDF that looks exactly like the original, with text you can select, search and copy; or an editable Word file where logos, photos and layout stay in place and every line becomes real Word text. Plain text works in 15 languages.",
  "steps": [
   "Add a scanned PDF or a photo of a document.",
   "Choose Searchable PDF, Editable Word or Plain text, and the language.",
   "Download the result."
  ],
  "use": "Use it to edit an old letter you only have on paper, search a scanned contract, or copy numbers out of a photographed bill.",
  "faq": [
   [
    "Will the searchable PDF look different?",
    "No. Each page keeps its original image, and the recognised words are added as an invisible layer exactly over the words you see."
   ],
   [
    "Does the Word file keep the design?",
    "Yes. Logos, photos, coloured bands and positions stay where they were, and the text is rebuilt as editable Word text in the same size and colour."
   ],
   [
    "Which languages are supported?",
    "Plain text works in 15 languages including Hindi, Bengali, Tamil, Telugu and Arabic. Searchable PDF and Word output support English and other Latin-alphabet languages."
   ]
  ],
  "st": "OCR PDF to Editable Word & Searchable PDF",
  "pro": 1
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
  "faq": [],
  "st": "Sign PDF Online Free — Draw or Type a Signature"
 },
 "unlock-pdf": {
  "t": "Remove a PDF Password",
  "d": "Open a password-protected PDF such as an e-Aadhaar or bank statement and save a copy without the password. Works offline, nothing uploaded.",
  "l": "Remove the password from a PDF you are allowed to open: e-Aadhaar, bank and credit card statements, salary slips, tax forms. DocBrisk supports every standard PDF lock (RC4 40 and 128-bit, AES-128 and AES-256), including files that only block printing or copying. The password is checked on your device and never sent anywhere.",
  "steps": [
   "Add the locked PDF. DocBrisk shows how it is locked.",
   "Type the password you use to open it (not needed for print or copy locks).",
   "Download the unlocked copy."
  ],
  "use": "Use it when you need to upload, print or merge a statement or e-Aadhaar that keeps asking for its password.",
  "faq": [
   [
    "What is the password for an e-Aadhaar PDF?",
    "The first four letters of your name as printed on the Aadhaar, in capital letters, followed by your year of birth. For example, SURESH KUMAR born in 1990 uses SURE1990."
   ],
   [
    "Can DocBrisk unlock a PDF without the password?",
    "Only when the file opens without a password and just blocks printing, copying or editing. A file that asks for a password to open is encrypted, and it cannot be opened without that password."
   ],
   [
    "Which encryption types are supported?",
    "All standard PDF passwords: RC4 40-bit and 128-bit, AES-128 and AES-256, from Adobe Acrobat, banks, government portals and office software."
   ]
  ],
  "st": "Unlock PDF: Remove a PDF Password Online, Free"
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
  "faq": [],
  "st": "PDF to JPG or PNG Converter — High Quality, Free"
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
  "faq": [],
  "st": "JPG to PDF Converter — Combine Images Free"
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
  "faq": [],
  "st": "Extract Tables from PDF to Excel or CSV"
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
  "faq": [],
  "st": "PDF to Excel Converter — Free XLSX Download"
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
  ],
  "pro": 1,
  "st": "Remove Watermark from PDF Online"
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
  "faq": [],
  "pro": 1
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
  "faq": [],
  "pro": 1
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
  "faq": [],
  "pro": 1
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
  "faq": [],
  "pro": 1
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
  "faq": [],
  "st": "Check if a PDF Was Edited — Tamper Check"
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
  "faq": [],
  "st": "PDF to PowerPoint Converter — Free PPTX"
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
  "faq": [],
  "st": "Free QR Code Generator — Link, Wi-Fi, vCard"
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
  "faq": [],
  "st": "Free GST Invoice Generator with UPI QR Code"
 },
 "mail-merge": {
  "t": "Bulk Certificate & Letter Generator",
  "d": "Turn a Word or PDF template and a spreadsheet into hundreds of personalised certificates and letters, as editable Word files or PDFs.",
  "l": "Design a certificate, offer letter or invitation in Word, type fields like {{Name}}, and add a CSV or Excel file. DocBrisk creates one editable Word file per row with your exact fonts, logos, tables, headers and footers. You can also place fields on a PDF template.",
  "steps": [
   "Add a Word template with fields like {{Name}}, or a PDF template.",
   "Add a CSV or Excel file with one row per document.",
   "Download every document in a ZIP."
  ],
  "use": "Use it for certificates, offer letters, ID cards and award slips that follow one template.",
  "faq": [
   [
    "How do I write fields in the Word template?",
    "Type the column name in double curly braces where the value should go, for example {{Name}} or {{Course}}. Word's «Name» merge fields also work."
   ],
   [
    "Will the merged files keep my design?",
    "Yes. Only the fields change. Fonts, colours, logos, tables, borders, headers and footers stay exactly as in your template, and every file stays editable."
   ]
  ],
  "pro": 1,
  "st": "Mail Merge: Bulk Certificates from Word or Excel"
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
  "faq": [],
  "st": "Split PDF by Size or Page Count — Free"
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
  "d": "Convert Word (DOCX) to PDF with fonts, tables, images, headers, page numbers and links preserved, in Hindi or any language. Free, nothing uploaded.",
  "l": "Convert a Word (.docx) document into a PDF that looks like the original: headings, bold and colours, bullet and numbered lists, tables with merged and shaded cells, images, text boxes, headers and footers with page numbers, clickable links and a table of contents. Pages break the way Word breaks them, keeping headings with their text. Hindi, Marathi, Tamil, Korean, Arabic and other scripts are shaped correctly and stay searchable. The file is converted inside your browser and never uploaded.",
  "steps": [
   "Upload the .docx file",
   "Choose the page size and bookmark options",
   "Download the PDF"
  ],
  "use": "Use it to send CVs, reports, letters and forms as a PDF that looks the same on every phone and computer, including documents written in Hindi.",
  "faq": [
   [
    "Does it work with Hindi Word files?",
    "Yes. Hindi, Korean, Arabic and other scripts convert correctly and stay searchable in the PDF."
   ],
   [
    "Can I convert old .doc files?",
    "Save the file as .docx in Word or LibreOffice first, then convert it here."
   ],
   [
    "Are bookmarks created from my headings?",
    "Yes. Word headings become PDF bookmarks, so long documents are easy to navigate, and internal links such as a table of contents stay clickable."
   ]
  ],
  "st": "Word to PDF Converter — Free DOCX to PDF"
 },
 "protect-pdf": {
  "t": "Password Protect a PDF",
  "d": "Lock a PDF with a password using AES-256 encryption and choose whether it can be printed, copied or edited. Free, nothing uploaded.",
  "l": "Add a password to a PDF before you email or share it. DocBrisk encrypts it with AES-256, the strongest protection the PDF format supports, and lets you decide whether people who open it can print, copy text or edit it. The file is encrypted on your device.",
  "steps": [
   "Add the PDF you want to protect.",
   "Type a password, and choose what people can do after opening it.",
   "Download the protected copy."
  ],
  "use": "Use it for payslips, contracts, medical reports and statements you need to send by email or WhatsApp.",
  "faq": [
   [
    "Will the protected PDF open on phones and in Adobe Reader?",
    "Yes. AES-256 PDF encryption is supported by Adobe Reader, Chrome, Edge, macOS Preview and Android and iPhone PDF apps."
   ],
   [
    "What happens if I forget the password?",
    "The file cannot be opened. Nobody, including DocBrisk, can recover a lost PDF password, so keep it somewhere safe."
   ],
   [
    "Can I stop people from copying or printing?",
    "Yes. Untick Print or Copy text. Well-behaved PDF apps respect these limits, though they are weaker than the open password itself."
   ]
  ],
  "st": "Password Protect PDF: AES-256 Encryption, Free"
 },
 "biodata-maker": {
  "t": "Marriage Biodata Maker",
  "d": "Make a marriage biodata in Hindi or English with photo, in traditional and modern designs. Download a print-ready PDF or share on WhatsApp.",
  "l": "Make a one-page marriage biodata in Hindi or English: personal details, education and work, family details and contact, with an optional photo and a traditional invocation line. Choose Classic (maroon and gold), Royal (navy and gold) or Minimal, and empty fields are left out automatically. The details are saved only on your device.",
  "steps": [
   "Choose Hindi or English and a design",
   "Fill in personal, family and contact details and add a photo",
   "Download the PDF or share it on WhatsApp"
  ],
  "use": "Made for families who share a biodata on WhatsApp or print it for relatives.",
  "faq": [
   [
    "What should a marriage biodata include?",
    "Personal details (name, date and place of birth, height, education, occupation), family details, and contact details. Optional fields such as gotra, rashi and manglik can be added or left blank."
   ],
   [
    "Can I make a biodata in Hindi?",
    "Yes. Switch to हिन्दी and every heading and label changes to Hindi. You can type values in Hindi or English."
   ]
  ],
  "st": "Marriage Biodata Maker in Hindi & English, Free"
 },
 "letter-maker": {
  "t": "Letter & Application Maker",
  "d": "Write a leave application in Hindi or English, a resignation letter, experience certificate, NOC or 11-month rent agreement. Free PDF.",
  "l": "Write common letters in the right format: a leave application in English or Hindi, a resignation letter, an experience certificate, a No Objection Certificate and an 11-month rent agreement with rent and deposit written in words. Fill in a few details, tap the letter to change any wording, and download a PDF.",
  "steps": [
   "Choose the letter type",
   "Fill in the details, then edit any line on the page",
   "Download the PDF"
  ],
  "use": "Useful for students, employees, HR teams and landlords who need a correctly formatted letter quickly.",
  "faq": [
   [
    "How do I write a leave application in Hindi?",
    "Choose \"छुट्टी के लिए आवेदन (Hindi)\", enter your name, dates and reason, and the letter is written in proper Hindi format."
   ],
   [
    "Is the rent agreement legally valid?",
    "It is a standard format. Print it on stamp paper as required in your state, and have it signed by both parties and witnesses, and notarised or registered where required."
   ]
  ],
  "st": "Letter & Application Maker: Leave, NOC, Rent"
 },
 "gstin-validator": {
  "t": "GSTIN Validator & Decoder",
  "d": "Validate one or thousands of GSTINs: format, state code, PAN and check digit, with the holder type decoded. Offline, export to Excel.",
  "l": "Check one GST number or a whole list at once. Each GSTIN is checked for length, allowed characters, the state code, the embedded PAN and the check digit, and decoded into the state, PAN and type of holder. Typos are caught with the correct check digit shown. Results export to CSV for Excel, and everything runs offline.",
  "steps": [
   "Paste one or many GSTINs, or load a CSV or Excel file",
   "See each result instantly with the state, PAN and holder type",
   "Download the results as a CSV for Excel"
  ],
  "use": "Handy for accounts and purchase teams cleaning vendor masters and checking invoices before filing GST returns.",
  "faq": [
   [
    "How is a GSTIN structured?",
    "Two digits for the state code, the 10-character PAN, one character for the registration number, the letter Z by default, and a final check digit."
   ],
   [
    "Does this confirm the GSTIN is active?",
    "It confirms the number is correctly formed. To see whether it is active today, search it on the official GST portal."
   ]
  ],
  "st": "GSTIN Validator: Check GST Number Format Online"
 }
};

/* ---------- target searches (v4.3) ----------
   The phrases people type for each tool. Used in three places: a short
   visible "Also searched as" line on the tool page, <meta name="keywords">,
   and the WebApplication "keywords" property. Keep them real queries, and
   keep the visible list short: stuffing a page with keywords hurts rankings. */
const KW = {
  "photo-studio": ["passport size photo maker", "passport photo online free", "remove background from photo", "white background photo maker", "visa photo maker"],
  "exam-photo": ["exam photo resizer", "photo and signature resize for exam", "resize photo to 20kb", "resize signature to 20kb", "ssc photo resize", "railway photo signature resize", "ibps photo signature resize", "neet photo resize"],
  "doc-scanner": ["document scanner online", "scan document with phone", "camscanner alternative", "photo to scanned pdf"],
  "cv-studio": ["resume builder free", "ats resume maker", "cv maker online free", "resume format for freshers", "ats friendly resume template"],
  "id-card": ["aadhaar card print front and back", "aadhaar card print on one page", "pan card print size", "id card print on a4"],
  "pdf-editor": ["pdf editor online free", "edit pdf text", "edit pdf online", "add text to pdf"],
  "compare-pdf": ["compare two pdf files", "pdf difference checker", "compare pdf online"],
  "pdf-to-word": ["pdf to word converter", "pdf to word free", "convert pdf to editable word", "pdf to docx"],
  "organize-pdf": ["rearrange pdf pages", "delete pages from pdf", "rotate pdf pages", "organize pdf online"],
  "redact-pdf": ["redact pdf online", "black out text in pdf", "hide text in pdf"],
  "clean-metadata": ["remove pdf metadata", "pdf metadata remover", "remove author name from pdf"],
  "number-pdf": ["add page numbers to pdf", "pdf page numbering online", "bates numbering pdf"],
  "impose-pdf": ["booklet pdf maker", "print pdf as booklet", "2 pages per sheet pdf"],
  "merge-pdf": ["merge pdf", "combine pdf files", "join pdf online free", "merge pdf on mobile"],
  "compress-pdf": ["compress pdf", "compress pdf to 100kb", "compress pdf to 200kb", "reduce pdf size", "compress pdf to 1mb"],
  "watermark-pdf": ["add watermark to pdf", "watermark pdf online free", "add logo to pdf"],
  "translate-pdf": ["translate pdf", "translate pdf to hindi", "pdf translator online", "translate english pdf to hindi"],
  "ocr-pdf": ["ocr pdf", "image to text converter", "scanned pdf to text", "hindi ocr online"],
  "sign-pdf": ["sign pdf online", "add signature to pdf", "electronic signature pdf free", "put signature on pdf"],
  "unlock-pdf": ["unlock pdf", "remove password from pdf", "aadhaar pdf password remove", "bank statement pdf password remove"],
  "pdf-to-image": ["pdf to jpg", "pdf to image converter", "pdf to png", "convert pdf to jpg high quality"],
  "image-to-pdf": ["jpg to pdf", "image to pdf converter", "photo to pdf", "png to pdf", "multiple images to one pdf"],
  "extract-tables": ["extract table from pdf", "pdf table to excel", "pdf table to csv"],
  "pdf-to-excel": ["pdf to excel converter", "pdf to excel free", "bank statement pdf to excel", "pdf to xlsx"],
  "remove-watermark": ["remove watermark from pdf", "pdf watermark remover", "delete watermark from pdf"],
  "extract-images": ["extract images from pdf", "save images from pdf", "pdf image extractor"],
  "clean-scan": ["deskew pdf", "clean scanned pdf", "straighten scanned pdf", "remove blank pages from pdf"],
  "resize-pdf": ["resize pdf pages", "change pdf page size", "convert pdf to a4 size"],
  "qr-stamp": ["add qr code to pdf", "qr code on pdf", "stamp qr code on pdf"],
  "doc-integrity": ["check if pdf is edited", "pdf tamper check", "detect fake pdf", "verify pdf authenticity"],
  "pdf-to-ppt": ["pdf to ppt", "pdf to powerpoint converter", "convert pdf to pptx"],
  "qr-maker": ["qr code generator", "upi qr code generator", "wifi qr code generator", "qr code maker free"],
  "invoice-maker": ["gst invoice generator", "invoice maker online free", "gst bill format", "invoice with upi qr code"],
  "mail-merge": ["bulk certificate generator", "mail merge online", "certificate maker from excel", "bulk letter generator"],
  "split-by-size": ["split pdf", "split pdf by size", "split pdf into multiple files", "split pdf under 2mb"],
  "sheet-to-pdf": ["excel to pdf", "excel to pdf converter", "csv to pdf", "xlsx to pdf"],
  "batch-process": ["batch compress pdf", "bulk pdf processing", "compress multiple pdf at once"],
  "smart-redact": ["mask aadhaar number in pdf", "redact aadhaar in pdf", "auto redact pdf", "hide pan number in pdf"],
  "word-to-pdf": ["word to pdf", "docx to pdf", "word to pdf converter free", "convert doc to pdf"],
  "protect-pdf": ["password protect pdf", "lock pdf with password", "encrypt pdf", "add password to pdf"]
};

/* ---------- exam landing pages (v4.3) ----------
   /exam/<slug>: one page per exam, each with that exam's own sizes, steps,
   Hindi summary and FAQ. The app opens the resizer with the matching preset
   above this content. Keep the sizes in step with EXAM_PRESETS in index.html. */
KW['biodata-maker'] = ['biodata maker', 'marriage biodata maker online', 'biodata maker free', 'shaadi biodata maker'];
KW['letter-maker'] = ['application letter maker', 'letter format generator', 'formal letter maker online', 'application format'];
KW['gstin-validator'] = ['gstin validator', 'gst number check', 'gstin verification', 'gst number format', 'check gst number validity'];

/* ---------- search landing pages (v4.4) ----------
   One page per exact search, each opening the real tool already set up for it
   (the app reads the same slugs from its own LANDINGS table). */
const LANDINGS = {
 "compress-pdf-to-20kb": {
  "tool": "compress-pdf",
  "h1": "Compress PDF to 20 KB",
  "t": "Compress PDF to 20 KB Online Free (No Upload) | DocBrisk",
  "d": "Reduce a PDF to under 20 KB for strict upload limits on scholarship, exam and government portals. Free, instant and your file never leaves your phone.",
  "lead": "Set to 20 KB already. Choose your PDF and download a file that fits the limit.",
  "body": [
   "A 20 KB limit is one of the tightest you will meet, usually on forms that expect a single scanned page such as a caste certificate, an ID proof or a signature sheet.",
   "The tool lowers image quality step by step until the file fits, and keeps any real text sharp. One page almost always fits; several photo-heavy pages may need to be split first."
  ],
  "f": [
   [
    "Can a multi-page PDF fit in 20 KB?",
    "A page or two of text or a light scan usually fits. For several scanned pages, split the PDF and upload each page separately, or rescan in black and white."
   ],
   [
    "Will the document still be readable?",
    "Text stays readable. Photos inside the PDF lose some detail at this size, so check the preview before uploading."
   ],
   [
    "What if 20 KB is not reachable?",
    "The tool tells you the smallest size it could reach. Scanning in black and white or at a lower resolution usually closes the gap."
   ]
  ],
  "kw": [
   "compress pdf to 20kb",
   "reduce pdf size to 20kb",
   "pdf size 20kb",
   "compress pdf below 20kb",
   "pdf 20kb converter",
   "pdf ko 20kb kaise kare"
  ],
  "rel": [
   "compress-pdf-to-50kb",
   "compress-pdf-to-100kb"
  ]
 },
 "compress-pdf-to-50kb": {
  "tool": "compress-pdf",
  "h1": "Compress PDF to 50 KB",
  "t": "Compress PDF to 50 KB Online Free | DocBrisk",
  "d": "Reduce PDF size to under 50 KB for certificates, marksheets and ID proofs on job and exam portals. Free, fast and private: nothing is uploaded.",
  "lead": "Set to 50 KB already. Choose your PDF and download it inside the limit.",
  "body": [
   "50 KB is a common cap for single certificates, marksheets and ID proofs on recruitment and admission portals.",
   "Compression works on the images inside your PDF and keeps text as real text, so names and numbers stay crisp even at this size."
  ],
  "f": [
   [
    "How do I reduce a PDF from 1 MB to 50 KB?",
    "Choose the file here and download. The tool compresses images step by step until the file is under 50 KB, and shows the final size."
   ],
   [
    "Is it safe for Aadhaar and marksheets?",
    "Yes. The file is processed inside your browser and never uploaded, which is the safest way to handle ID documents."
   ],
   [
    "Can I do this on my phone?",
    "Yes. It works in the phone browser with no app to install."
   ]
  ],
  "kw": [
   "compress pdf to 50kb",
   "reduce pdf size to 50kb",
   "pdf size reduce 50kb",
   "pdf compressor 50kb",
   "compress pdf below 50kb online",
   "pdf ko 50kb me kaise kare"
  ],
  "rel": [
   "compress-pdf-to-20kb",
   "compress-pdf-to-100kb",
   "compress-pdf-to-200kb"
  ]
 },
 "compress-pdf-to-100kb": {
  "tool": "compress-pdf",
  "h1": "Compress PDF to 100 KB",
  "t": "Compress PDF to 100 KB Online Free, No Upload | DocBrisk",
  "d": "Reduce PDF size to under 100 KB for government forms, exam applications and job portals. Text stays sharp. Free on phone and PC, nothing uploaded.",
  "lead": "Set to 100 KB already. Choose your PDF and download a file that fits.",
  "body": [
   "100 KB is the most common upload limit on Indian government, exam and job application portals, which is why this is the size people search for most.",
   "The tool compresses only what needs compressing: images shrink, text stays selectable, and you see the final size before you download."
  ],
  "f": [
   [
    "How do I compress a PDF to 100 KB without losing quality?",
    "Use the smallest reduction that reaches the limit, which is what this tool does. Text is never blurred; only images are compressed, and only as much as needed."
   ],
   [
    "My PDF is 5 MB. Can it reach 100 KB?",
    "Usually yes for a few pages. For long scanned documents, split the PDF into parts and compress each part."
   ],
   [
    "Does it work for scanned documents?",
    "Yes. Scans are images, so they compress well. Black-and-white scans shrink the most."
   ]
  ],
  "kw": [
   "compress pdf to 100kb",
   "reduce pdf size to 100kb",
   "pdf size reducer 100kb",
   "compress pdf under 100kb",
   "pdf 100kb converter",
   "pdf ko 100kb me kaise kare",
   "reduce pdf size for online form"
  ],
  "rel": [
   "compress-pdf-to-200kb",
   "compress-pdf-to-50kb"
  ]
 },
 "compress-pdf-to-200kb": {
  "tool": "compress-pdf",
  "h1": "Compress PDF to 200 KB",
  "t": "Compress PDF to 200 KB Online Free | DocBrisk",
  "d": "Reduce a PDF to under 200 KB for multi-page documents like marksheets, experience letters and bank statements. Free, private and instant.",
  "lead": "Set to 200 KB already. Choose your PDF and download it within the limit.",
  "body": [
   "200 KB is typical for multi-page uploads: all semester marksheets in one file, experience letters or a few pages of bank statements.",
   "At this size most documents keep clear photos and signatures, so it is a good balance between quality and upload limits."
  ],
  "f": [
   [
    "How many pages fit in 200 KB?",
    "Usually several pages of text, or 2–4 scanned pages. The tool shows the final size so you can check before uploading."
   ],
   [
    "Can I merge documents first and then compress?",
    "Yes. Merge them into one PDF with Merge PDF, then compress the combined file here."
   ],
   [
    "Is there any watermark?",
    "No. The compressed PDF has no watermark and no DocBrisk branding."
   ]
  ],
  "kw": [
   "compress pdf to 200kb",
   "reduce pdf size to 200kb",
   "pdf size 200kb",
   "compress pdf below 200kb",
   "pdf compressor 200kb online free"
  ],
  "rel": [
   "compress-pdf-to-100kb",
   "compress-pdf-to-500kb",
   "merge-pdf-on-mobile"
  ]
 },
 "compress-pdf-to-500kb": {
  "tool": "compress-pdf",
  "h1": "Compress PDF to 500 KB",
  "t": "Compress PDF to 500 KB Online Free | DocBrisk",
  "d": "Shrink a PDF to under 500 KB for HR portals, college admissions and email attachments, keeping photos and text clear. Free, nothing uploaded.",
  "lead": "Set to 500 KB already. Choose your PDF and download the smaller file.",
  "body": [
   "500 KB limits appear on HR onboarding portals, college admission forms and some visa and loan applications.",
   "Because the limit is generous, the result usually looks almost identical to the original while being many times smaller."
  ],
  "f": [
   [
    "Will photos in my PDF stay clear at 500 KB?",
    "Yes, for most documents. The tool applies only as much compression as needed to reach the limit."
   ],
   [
    "How do I make a PDF smaller for email?",
    "Choose a limit such as 500 KB or 1 MB. Smaller attachments send faster and avoid mailbox limits."
   ],
   [
    "Does it work on iPhone and Android?",
    "Yes. It runs in any modern mobile browser."
   ]
  ],
  "kw": [
   "compress pdf to 500kb",
   "reduce pdf size to 500kb",
   "pdf size 500kb",
   "compress pdf for email",
   "reduce pdf file size online"
  ],
  "rel": [
   "compress-pdf-to-1mb",
   "compress-pdf-to-200kb",
   "merge-pdf-on-mobile"
  ]
 },
 "compress-pdf-to-1mb": {
  "tool": "compress-pdf",
  "h1": "Compress PDF to 1 MB",
  "t": "Compress PDF to 1 MB Online Free | DocBrisk",
  "d": "Reduce a large PDF to under 1 MB for portals, email and WhatsApp while keeping it sharp. Works on long scanned documents. Free and private.",
  "lead": "Set to 1 MB already. Choose your PDF and download it under the limit.",
  "body": [
   "Scanned documents straight from a phone or photocopier are often 5–20 MB. A 1 MB target keeps them readable while meeting most upload limits.",
   "Long documents compress page by page inside your browser, so even large files never have to be uploaded anywhere."
  ],
  "f": [
   [
    "How do I reduce a 10 MB PDF to 1 MB?",
    "Choose the file here. The tool reduces image quality gradually until the whole document fits in 1 MB, then shows the result."
   ],
   [
    "What if the portal needs smaller parts?",
    "Use Split by Size to break the PDF into parts under the portal limit."
   ],
   [
    "Is it really free?",
    "Yes. Compress PDF is free with no page limits and no watermark."
   ]
  ],
  "kw": [
   "compress pdf to 1mb",
   "reduce pdf size to 1mb",
   "pdf size less than 1mb",
   "compress pdf under 1mb",
   "reduce pdf size for whatsapp"
  ],
  "rel": [
   "compress-pdf-to-500kb",
   "compress-pdf-to-200kb",
   "merge-pdf-on-mobile"
  ]
 },
 "hindi-word-to-pdf": {
  "tool": "word-to-pdf",
  "h1": "Hindi Word to PDF Converter",
  "t": "Hindi Word to PDF Converter, Font Stays Correct | DocBrisk",
  "d": "Convert Hindi Word (DOCX) files to PDF with the Devanagari text shaped correctly, matras and conjuncts intact, and still searchable. Free, no upload.",
  "lead": "Choose your Hindi .docx file. Tables, images and page numbers are kept too.",
  "body": [
   "Many converters break Hindi: matras move, conjuncts split, or the text turns into boxes. This converter shapes Devanagari with your device's own text engine, so it reads exactly as typed.",
   "The Hindi text also stays searchable and copyable in the PDF, and it works the same for Marathi, Gujarati, Bengali, Tamil and other Indian scripts."
  ],
  "f": [
   [
    "Why does Hindi text break in some PDF converters?",
    "Devanagari needs \"shaping\" to join letters and place matras. Converters that skip it produce broken words; this one shapes every word correctly."
   ],
   [
    "Can I search and copy the Hindi text in the PDF?",
    "Yes. An invisible text layer keeps the Hindi searchable and copyable."
   ],
   [
    "Does it work for Kruti Dev files?",
    "It works for Unicode Hindi (Mangal, Nirmala UI and similar). Kruti Dev is an older font system and needs converting to Unicode first."
   ]
  ],
  "kw": [
   "hindi word to pdf",
   "convert hindi word file to pdf",
   "hindi docx to pdf",
   "word to pdf hindi font problem",
   "mangal font word to pdf",
   "marathi word to pdf"
  ],
  "rel": [
   "translate-pdf-english-to-hindi",
   "leave-application-in-hindi",
   "marriage-biodata-format-in-hindi"
  ]
 },
 "translate-pdf-english-to-hindi": {
  "tool": "translate-pdf",
  "h1": "Translate PDF from English to Hindi",
  "t": "Translate PDF English to Hindi Online | DocBrisk",
  "d": "Translate a whole English PDF into Hindi and download it as an editable Word file or text. Also supports 34 other languages.",
  "lead": "Hindi is selected as the target language. Choose your PDF to start.",
  "body": [
   "Translate circulars, notices, study material or letters from English into Hindi in one step, then edit the result in Word.",
   "You can also translate into Marathi, Bengali, Tamil, Telugu, Gujarati and other languages by changing the target language."
  ],
  "f": [
   [
    "Can I edit the Hindi translation?",
    "Yes. Download it as a Word file and correct any wording before sharing."
   ],
   [
    "Can it translate a scanned PDF?",
    "Scanned pages are images. Run the OCR Scanner first to turn them into text, then translate."
   ],
   [
    "Which other Indian languages are supported?",
    "Change the target language to translate into other supported languages such as Marathi, Bengali, Tamil, Telugu or Gujarati."
   ]
  ],
  "kw": [
   "translate pdf english to hindi",
   "pdf translate in hindi",
   "english to hindi pdf translator",
   "translate pdf to hindi online free"
  ],
  "rel": [
   "hindi-word-to-pdf",
   "leave-application-in-hindi"
  ]
 },
 "aadhaar-card-print-front-and-back": {
  "tool": "id-card",
  "h1": "Aadhaar Card Print: Front and Back on One Page",
  "t": "Aadhaar Card Print Front and Back on One Page | DocBrisk",
  "d": "Print both sides of your Aadhaar card on one A4 page at exact card size, with cut guides. Works with e-Aadhaar PDF or photos. Free, nothing uploaded.",
  "lead": "Add the front and back of your Aadhaar and download a print-ready A4 page.",
  "body": [
   "Offices, banks and schools often ask for an Aadhaar copy with both sides on a single page. This places the front and back at real card size, side by side or stacked.",
   "Print at 100% scale (\"actual size\") so the copy comes out exactly card-sized, then cut along the guides if you need a wallet copy."
  ],
  "f": [
   [
    "How do I print Aadhaar front and back on one page?",
    "Upload the front and back (or your e-Aadhaar PDF), choose side-by-side or stacked, and print the A4 page at 100% scale."
   ],
   [
    "Why is my printed Aadhaar the wrong size?",
    "The printer was set to \"fit to page\". Choose \"actual size\" or 100% in the print settings."
   ],
   [
    "Can I use my e-Aadhaar PDF?",
    "Yes. If it is password protected, remove the password first with Unlock PDF (the password is usually the first four letters of your name in capitals plus your birth year)."
   ]
  ],
  "kw": [
   "aadhaar card print front and back",
   "aadhar card front and back on one page",
   "aadhaar card print size",
   "e aadhaar print both sides",
   "aadhar card photocopy one page"
  ],
  "rel": [
   "aadhaar-pdf-password",
   "pan-card-print-front-and-back",
   "mask-aadhaar-number"
  ]
 },
 "pan-card-print-front-and-back": {
  "tool": "id-card",
  "h1": "PAN Card Print: Front and Back on One Page",
  "t": "PAN Card Print Front and Back on One Page | DocBrisk",
  "d": "Put both sides of your PAN card on one A4 page at exact card size for KYC and office copies. Also works for voter ID and driving licence. Free.",
  "lead": "Add both sides of the card and download one print-ready page.",
  "body": [
   "KYC forms and HR teams often want a single-page copy of your PAN card. This places both sides at true card size with cut guides.",
   "The same tool works for voter ID, driving licence and any other card-sized document."
  ],
  "f": [
   [
    "What is the actual size of a PAN card?",
    "PAN, Aadhaar PVC and most ID cards use the standard card size of 85.6 × 54 mm, which is what this tool uses."
   ],
   [
    "Can I put Aadhaar and PAN on the same page?",
    "Yes. Add the cards you need and they are arranged on one A4 sheet."
   ],
   [
    "How do I print it correctly?",
    "Print at 100% or \"actual size\", not \"fit to page\"."
   ]
  ],
  "kw": [
   "pan card print front and back",
   "pan card print size",
   "pan card photocopy one page",
   "voter id print front and back",
   "driving licence print both sides"
  ],
  "rel": [
   "aadhaar-card-print-front-and-back",
   "aadhaar-pdf-password"
  ]
 },
 "aadhaar-pdf-password": {
  "tool": "unlock-pdf",
  "h1": "e-Aadhaar PDF Password: Open and Remove It",
  "t": "e-Aadhaar PDF Password: Format & Remove It | DocBrisk",
  "d": "The e-Aadhaar PDF password is the first 4 letters of your name in capitals plus your birth year. Open it and save a copy without the password.",
  "lead": "Choose your e-Aadhaar PDF and enter its password once to save an unlocked copy.",
  "body": [
   "The downloaded e-Aadhaar PDF is protected. Its password is the first four letters of your name in CAPITAL letters followed by your year of birth, for example RAHU1995 for Rahul born in 1995.",
   "Enter it once here and download a copy that opens without a password, handy for printing, merging or uploading to portals that cannot open protected files."
  ],
  "f": [
   [
    "What if my name has fewer than four letters?",
    "Use the whole name in capitals followed by the birth year, for example RAM1990."
   ],
   [
    "What if my name has a space or initial?",
    "Use the first four characters of the name as printed on the Aadhaar, ignoring spaces, in capitals, plus the birth year."
   ],
   [
    "Is it safe to unlock Aadhaar here?",
    "Yes. The file and password stay in your browser; nothing is uploaded."
   ]
  ],
  "kw": [
   "aadhaar pdf password",
   "e aadhaar password",
   "aadhar card pdf password kya hota hai",
   "remove password from aadhaar pdf",
   "e aadhaar password format",
   "aadhaar pdf open password"
  ],
  "rel": [
   "aadhaar-card-print-front-and-back",
   "remove-password-from-bank-statement-pdf",
   "mask-aadhaar-number"
  ]
 },
 "remove-password-from-bank-statement-pdf": {
  "tool": "unlock-pdf",
  "h1": "Remove Password from Bank Statement PDF",
  "t": "Remove Password from Bank Statement PDF | DocBrisk",
  "d": "Unlock a password-protected bank statement PDF you can open and save a copy without the password, ready for loan, visa or ITR uploads. Free, private.",
  "lead": "Choose the statement PDF and enter its password once.",
  "body": [
   "Banks send statements as password-protected PDFs. Many loan, visa and tax portals cannot accept protected files, so you need an unlocked copy.",
   "The password is usually a combination such as part of your name, date of birth, customer ID or account number; the exact format is given in the bank's email."
  ],
  "f": [
   [
    "What is the password for my bank statement PDF?",
    "It depends on the bank and is usually explained in the email that carried the statement, often a mix of your name, date of birth or customer ID."
   ],
   [
    "Is it safe to upload my bank statement?",
    "Nothing is uploaded here. The file is unlocked inside your browser."
   ],
   [
    "Can I convert the statement to Excel?",
    "After unlocking, use PDF to Excel or the Table Extractor for text-based statements."
   ]
  ],
  "kw": [
   "remove password from bank statement pdf",
   "bank statement pdf password",
   "unlock bank statement pdf",
   "sbi statement pdf password",
   "pdf password remover online free"
  ],
  "rel": [
   "aadhaar-pdf-password",
   "compress-pdf-to-500kb",
   "merge-pdf-on-mobile"
  ]
 },
 "mask-aadhaar-number": {
  "tool": "smart-redact",
  "h1": "Mask Aadhaar Number in a PDF",
  "t": "Mask Aadhaar Number in PDF (Hide Digits) | DocBrisk",
  "d": "Hide your Aadhaar number, PAN and phone number in a PDF before sharing it with hotels, landlords or employers. Permanently removed, not just covered.",
  "lead": "Choose the PDF; Aadhaar numbers and other personal details are found for you.",
  "body": [
   "Hotels, rental agents and offices often only need to see that you have an Aadhaar, not the full number. Masking it protects you from misuse.",
   "Detected numbers are destroyed in the output PDF, so they cannot be copied back out from under a black box."
  ],
  "f": [
   [
    "What is a masked Aadhaar?",
    "A copy where the first eight digits of the Aadhaar number are hidden and only the last four are visible."
   ],
   [
    "Can the hidden digits be recovered?",
    "No. The matched text is removed from the file, not just covered."
   ],
   [
    "What else can it hide?",
    "PAN, card numbers, email addresses, phone numbers and dates of birth."
   ]
  ],
  "kw": [
   "mask aadhaar number",
   "masked aadhaar",
   "hide aadhaar number in pdf",
   "aadhaar redact",
   "blur aadhaar number"
  ],
  "rel": [
   "aadhaar-card-print-front-and-back",
   "aadhaar-pdf-password",
   "remove-password-from-bank-statement-pdf"
  ]
 },
 "marriage-biodata-format-in-hindi": {
  "tool": "biodata-maker",
  "h1": "Marriage Biodata Format in Hindi",
  "t": "Marriage Biodata in Hindi (शादी बायोडाटा) | DocBrisk",
  "d": "हिंदी में शादी का बायोडाटा बनाएं: फोटो, पारिवारिक विवरण और सुंदर डिज़ाइन के साथ। Download a print-ready PDF or share it on WhatsApp. Free.",
  "lead": "हिंदी चुनी गई है। अपना विवरण भरें और PDF डाउनलोड करें।",
  "body": [
   "A Hindi biodata usually opens with \"॥ श्री गणेशाय नमः ॥\" and lists व्यक्तिगत विवरण, पारिवारिक विवरण and संपर्क विवरण. All headings here are already in Hindi.",
   "You can type details in Hindi or English, add a photo, and choose a traditional or modern design. Empty fields are left out automatically."
  ],
  "f": [
   [
    "शादी के बायोडाटा में क्या लिखें?",
    "नाम, जन्म तिथि, जन्म समय और स्थान, कद, शिक्षा, व्यवसाय, परिवार का विवरण और संपर्क। गोत्र, राशि और मांगलिक वैकल्पिक हैं।"
   ],
   [
    "Can I type in Hinglish or English?",
    "Yes. Headings stay in Hindi and you can type values in Hindi or English."
   ],
   [
    "How do I send the biodata on WhatsApp?",
    "After downloading, tap Share and choose WhatsApp."
   ]
  ],
  "kw": [
   "marriage biodata format in hindi",
   "shadi biodata format hindi",
   "शादी बायोडाटा",
   "hindi biodata for marriage pdf",
   "vivah biodata format",
   "biodata in hindi for marriage"
  ],
  "rel": [
   "marriage-biodata-format",
   "marriage-biodata-for-girl",
   "marriage-biodata-for-boy"
  ]
 },
 "marriage-biodata-format": {
  "tool": "biodata-maker",
  "h1": "Marriage Biodata Format (Free PDF Maker)",
  "t": "Marriage Biodata Format with Photo, Free PDF | DocBrisk",
  "d": "Make a marriage biodata with photo in minutes. Traditional and modern designs, English or Hindi, print-ready PDF and WhatsApp sharing. Free.",
  "lead": "Fill in your details, add a photo and download the PDF.",
  "body": [
   "A good marriage biodata fits on one page and covers personal details, education and work, family details and contact information.",
   "Choose Classic (maroon and gold), Royal (navy and gold) or Minimal, add your photo, and the layout adjusts on its own. Your details stay on your device."
  ],
  "f": [
   [
    "What should a marriage biodata include?",
    "Name, date, time and place of birth, height, education, occupation, family details and a contact number. Religious details such as gotra or rashi are optional."
   ],
   [
    "Should a biodata have a photo?",
    "Most families prefer one. Use a recent, clear photo with a plain background."
   ],
   [
    "Is my information stored online?",
    "No. It is saved only on your device so you can come back and edit it."
   ]
  ],
  "kw": [
   "marriage biodata format",
   "biodata for marriage",
   "marriage biodata maker",
   "biodata format for marriage pdf",
   "matrimonial biodata format",
   "biodata with photo"
  ],
  "rel": [
   "marriage-biodata-format-in-hindi",
   "marriage-biodata-for-girl",
   "marriage-biodata-for-boy"
  ]
 },
 "marriage-biodata-for-girl": {
  "tool": "biodata-maker",
  "h1": "Marriage Biodata for Girl",
  "t": "Marriage Biodata for Girl: Format with Photo | DocBrisk",
  "d": "Create a marriage biodata for a girl with photo, education, profession and family details in English or Hindi. Elegant designs, free PDF.",
  "lead": "A sample for a girl is filled in. Replace it with your details.",
  "body": [
   "A biodata for a girl typically highlights education, profession, hobbies and family background, with a recent photo.",
   "Start from the sample, change the details, pick a design and download a one-page PDF ready to share with family."
  ],
  "f": [
   [
    "What hobbies should I mention?",
    "Two or three genuine interests, such as music, reading, cooking or travel, add warmth without making the biodata long."
   ],
   [
    "Should income be included?",
    "It is optional. Leave the field empty and it will not appear."
   ],
   [
    "Can parents make the biodata?",
    "Yes. Add the contact person, such as the father or mother, in the contact section."
   ]
  ],
  "kw": [
   "marriage biodata for girl",
   "biodata format for marriage for girl",
   "girl biodata for marriage",
   "ladki ka biodata",
   "biodata for girl with photo"
  ],
  "rel": [
   "marriage-biodata-for-boy",
   "marriage-biodata-format-in-hindi",
   "marriage-biodata-format"
  ]
 },
 "marriage-biodata-for-boy": {
  "tool": "biodata-maker",
  "h1": "Marriage Biodata for Boy",
  "t": "Marriage Biodata for Boy: Format with Photo | DocBrisk",
  "d": "Create a marriage biodata for a boy with photo, education, job and family details in English or Hindi. Clean designs, free print-ready PDF.",
  "lead": "A sample for a boy is filled in. Replace it with your details.",
  "body": [
   "A biodata for a boy usually leads with education, job and city, followed by family details and a contact number.",
   "Start from the sample, edit the details, choose a design and download a PDF to print or send on WhatsApp."
  ],
  "f": [
   [
    "Should I mention salary?",
    "Many families include an annual income range. The field is optional; leave it empty to hide it."
   ],
   [
    "What photo works best?",
    "A recent, clear photo with a plain background, in formal or traditional wear."
   ],
   [
    "Can I make it in Hindi?",
    "Yes. Switch to हिन्दी at the top and all headings change to Hindi."
   ]
  ],
  "kw": [
   "marriage biodata for boy",
   "biodata format for marriage for boy",
   "boy biodata for marriage",
   "ladke ka biodata",
   "biodata for boy with photo"
  ],
  "rel": [
   "marriage-biodata-for-girl",
   "marriage-biodata-format-in-hindi",
   "marriage-biodata-format"
  ]
 },
 "leave-application-for-school": {
  "tool": "letter-maker",
  "h1": "Leave Application for School",
  "t": "Leave Application for School (Format & PDF) | DocBrisk",
  "d": "Write a leave application to the principal in the correct format. Fill in the name, class, dates and reason, edit any line, and download a PDF.",
  "lead": "The school format is ready. Change the name, class, dates and reason.",
  "body": [
   "A school leave application is addressed to the principal, gives the dates and a short reason, and is signed by the student (and often a parent).",
   "Days are counted automatically from the dates, and you can tap the letter to change any wording before downloading."
  ],
  "f": [
   [
    "How do I write a leave application for school?",
    "Address it to the principal, write the subject with the dates, give a short reason, request leave for that period, and sign with your name and class."
   ],
   [
    "Can I write it in Hindi?",
    "Yes. Choose the Hindi format: छुट्टी के लिए आवेदन."
   ],
   [
    "Should parents sign it?",
    "Many schools ask for a parent's signature. Print the PDF and sign below the student's name."
   ]
  ],
  "kw": [
   "leave application for school",
   "leave application to principal",
   "application for leave in school",
   "sick leave application for school",
   "leave application format for students"
  ],
  "rel": [
   "leave-application-in-hindi",
   "sick-leave-application",
   "leave-application-for-office"
  ]
 },
 "leave-application-in-hindi": {
  "tool": "letter-maker",
  "h1": "Leave Application in Hindi (छुट्टी के लिए आवेदन)",
  "t": "Leave Application in Hindi: छुट्टी के लिए आवेदन | DocBrisk",
  "d": "हिंदी में छुट्टी के लिए प्रार्थना-पत्र लिखें: स्कूल या ऑफिस के लिए। नाम, तारीख और कारण भरें, PDF डाउनलोड करें। Free.",
  "lead": "हिंदी प्रारूप तैयार है। नाम, तारीख और कारण बदलें।",
  "body": [
   "हिंदी प्रार्थना-पत्र \"सेवा में\" से शुरू होता है, फिर विषय, \"महोदय/महोदया\", निवेदन और अंत में \"आपका आज्ञाकारी\" या \"आपकी आज्ञाकारिणी\"।",
   "लिंग चुनने पर भाषा अपने-आप सही होती है (रह सकूँगा / रह सकूँगी), और आप पत्र पर टैप करके कोई भी पंक्ति बदल सकते हैं।"
  ],
  "f": [
   [
    "छुट्टी के लिए आवेदन पत्र कैसे लिखें?",
    "\"सेवा में\" के बाद प्रधानाचार्य या अधिकारी का पद, विषय में तारीखें, कारण के साथ निवेदन, और अंत में अपना नाम और कक्षा/पद लिखें।"
   ],
   [
    "Can I use it for office leave?",
    "Yes. Change \"प्रधानाचार्य महोदय\" to your manager's title and the school name to your office."
   ],
   [
    "Is there an English version?",
    "Yes. Choose \"Leave application (English)\" in the same tool."
   ]
  ],
  "kw": [
   "leave application in hindi",
   "chutti ke liye application",
   "छुट्टी के लिए आवेदन",
   "prarthna patra in hindi",
   "avkash hetu prarthna patra",
   "hindi application for leave"
  ],
  "rel": [
   "leave-application-for-school",
   "sick-leave-application",
   "marriage-biodata-format-in-hindi"
  ]
 },
 "sick-leave-application": {
  "tool": "letter-maker",
  "h1": "Sick Leave Application",
  "t": "Sick Leave Application Format for Office & School | DocBrisk",
  "d": "Write a sick leave application for office or school in the right format. Enter the dates and illness, edit any line and download a PDF. Free.",
  "lead": "The sick-leave format is ready. Enter your dates and details.",
  "body": [
   "A sick leave application states the illness briefly, the dates you will be away and whether a medical certificate is attached.",
   "Change the recipient to your manager or principal, and edit the letter directly if your organisation expects particular wording."
  ],
  "f": [
   [
    "Do I need a medical certificate?",
    "Many organisations ask for one for longer absences. Mention it in the letter if you are attaching it."
   ],
   [
    "How much detail about the illness should I give?",
    "A short description such as \"viral fever\" is enough."
   ],
   [
    "Can I send it by email?",
    "Yes. Download the PDF and attach it, or copy the text into your email."
   ]
  ],
  "kw": [
   "sick leave application",
   "sick leave application for office",
   "leave application for fever",
   "medical leave application",
   "sick leave letter format"
  ],
  "rel": [
   "leave-application-for-office",
   "leave-application-for-school",
   "leave-application-in-hindi"
  ]
 },
 "leave-application-for-office": {
  "tool": "letter-maker",
  "h1": "Leave Application for Office",
  "t": "Leave Application for Office (Format & PDF) | DocBrisk",
  "d": "Write a professional leave application for office to your manager or HR. Enter dates and reason, edit any line and download a PDF. Free.",
  "lead": "The office format is ready. Enter your dates and reason.",
  "body": [
   "An office leave application gives the dates, a short reason and how your work will be covered while you are away.",
   "The letter already mentions handing over pending work, which managers appreciate. Edit anything that does not fit your situation."
  ],
  "f": [
   [
    "How should I write a leave application to my manager?",
    "State the dates, the reason in one line, how your work will be handled, and request approval."
   ],
   [
    "What is a good reason for leave?",
    "Be brief and honest: a family function, a medical appointment, personal work or travel."
   ],
   [
    "Can I add a letterhead?",
    "Letterheads are for company-issued documents; for a personal leave request, leave it off."
   ]
  ],
  "kw": [
   "leave application for office",
   "leave application to manager",
   "leave letter for office",
   "casual leave application",
   "leave application for personal work"
  ],
  "rel": [
   "sick-leave-application",
   "resignation-letter-format",
   "leave-application-in-hindi"
  ]
 },
 "resignation-letter-format": {
  "tool": "letter-maker",
  "h1": "Resignation Letter Format",
  "t": "Resignation Letter Format (Simple & Professional) | DocBrisk",
  "d": "Write a simple, professional resignation letter with your notice period and last working day. Edit any line and download a PDF. Free.",
  "lead": "The resignation format is ready. Enter your role, notice period and last day.",
  "body": [
   "A good resignation letter is short and positive: the role you are resigning from, your last working day under the notice period, and thanks.",
   "It also asks for your relieving letter and full and final settlement, which you will need for your next job."
  ],
  "f": [
   [
    "How do I write a simple resignation letter?",
    "Say you are resigning from your role, give your last working day, thank the company and offer a smooth handover."
   ],
   [
    "Should I give a reason for resigning?",
    "It is not required. Keep the letter positive and discuss reasons in person if needed."
   ],
   [
    "What happens after resigning?",
    "Serve the notice period, hand over your work, then collect your relieving letter and experience certificate."
   ]
  ],
  "kw": [
   "resignation letter format",
   "simple resignation letter",
   "resignation letter sample",
   "resignation letter with notice period",
   "how to write resignation letter"
  ],
  "rel": [
   "experience-certificate-format",
   "noc-letter-for-passport",
   "leave-application-for-office"
  ]
 },
 "experience-certificate-format": {
  "tool": "letter-maker",
  "h1": "Experience Certificate Format",
  "t": "Experience Certificate Format (Letter & PDF) | DocBrisk",
  "d": "Create an experience certificate on company letterhead with employee name, designation and tenure. Edit any line and download a PDF. Free.",
  "lead": "The certificate format is ready, with a letterhead. Enter the company and employee details.",
  "body": [
   "An experience certificate confirms the employee's role and dates of employment, and is signed by HR or a manager.",
   "The letterhead fills in from the company name and address, and the pronoun setting keeps every sentence grammatically right."
  ],
  "f": [
   [
    "Who issues an experience certificate?",
    "The employer, usually HR, on company letterhead, signed by an authorised person."
   ],
   [
    "What should it contain?",
    "Employee name, designation, joining and leaving dates, a short note on conduct, and the signatory's name and designation."
   ],
   [
    "Is it the same as a relieving letter?",
    "No. A relieving letter confirms the resignation was accepted; the experience certificate confirms the work history."
   ]
  ],
  "kw": [
   "experience certificate format",
   "experience letter format",
   "work experience certificate",
   "experience certificate sample",
   "experience letter for employee"
  ],
  "rel": [
   "resignation-letter-format",
   "noc-letter-for-passport",
   "leave-application-for-office"
  ]
 },
 "noc-letter-for-passport": {
  "tool": "letter-maker",
  "h1": "NOC Letter from Employer for Passport",
  "t": "NOC Letter from Employer for Passport (Format) | DocBrisk",
  "d": "Create a No Objection Certificate from the employer for a passport, visa or higher studies, on letterhead. Edit any line and download a PDF.",
  "lead": "The NOC format for a passport is ready. Enter the company and employee details.",
  "body": [
   "Government and some private employees need a No Objection Certificate from their employer when applying for a passport or visa.",
   "Change the purpose to visa, higher studies or a loan, and the letter updates. It is issued on company letterhead and signed by HR."
  ],
  "f": [
   [
    "Who needs an NOC for a passport?",
    "Mainly government and PSU employees, who submit an NOC or Identity Certificate from their employer; check the current passport rules for your case."
   ],
   [
    "Can I use it for a visa?",
    "Yes. Change the purpose to visa or travel and the letter updates."
   ],
   [
    "Who signs the NOC?",
    "An authorised person at the employer, usually from HR, on company letterhead."
   ]
  ],
  "kw": [
   "noc letter for passport",
   "noc from employer",
   "no objection certificate format",
   "noc for visa from employer",
   "noc letter format"
  ],
  "rel": [
   "experience-certificate-format",
   "resignation-letter-format",
   "rent-agreement-format"
  ]
 },
 "rent-agreement-format": {
  "tool": "letter-maker",
  "h1": "Rent Agreement Format (11 Months)",
  "t": "Rent Agreement Format (11 Months), Free PDF | DocBrisk",
  "d": "Create an 11-month rent agreement with rent and deposit in words, notice period and standard clauses. Edit any line and download a PDF.",
  "lead": "The 11-month format is ready. Enter landlord, tenant, property and rent details.",
  "body": [
   "Most residential rentals in India use an 11-month agreement. It covers rent, security deposit, notice period, usage and maintenance.",
   "Amounts are written in words automatically (for example, Eighteen Thousand), and every clause can be edited on the page."
  ],
  "f": [
   [
    "Why are rent agreements for 11 months?",
    "Leases of 12 months or more generally must be registered, which adds cost; 11-month agreements usually avoid that. Rules vary by state."
   ],
   [
    "Does it need stamp paper?",
    "Yes. Print it on stamp paper of the value required in your state, and sign it with two witnesses; notarise or register where required."
   ],
   [
    "Can I add my own clauses?",
    "Yes. Tap the agreement to edit any clause or add new ones before downloading."
   ]
  ],
  "kw": [
   "rent agreement format",
   "11 month rent agreement format",
   "rental agreement format india",
   "house rent agreement pdf",
   "rent agreement format word"
  ],
  "rel": [
   "noc-letter-for-passport",
   "gst-invoice-format",
   "leave-application-for-office"
  ]
 },
 "gst-invoice-format": {
  "tool": "invoice-maker",
  "h1": "GST Invoice Format with UPI QR",
  "t": "GST Invoice Format: Free Invoice Generator | DocBrisk",
  "d": "Create a GST invoice with GSTIN, HSN codes, CGST/SGST or IGST and a UPI QR for payment. Download a professional PDF. Free, no sign-up.",
  "lead": "Enter your business, customer and items. Taxes are calculated for you.",
  "body": [
   "A GST invoice needs the supplier and buyer GSTIN, invoice number and date, HSN/SAC codes, taxable value and the tax split (CGST and SGST, or IGST).",
   "Add a UPI QR with the amount so customers can pay by scanning, which gets you paid faster."
  ],
  "f": [
   [
    "What must a GST invoice contain?",
    "Supplier details and GSTIN, invoice number and date, buyer details (and GSTIN if registered), item description, HSN/SAC, quantity, taxable value, tax rate and amount."
   ],
   [
    "When is IGST charged instead of CGST and SGST?",
    "IGST applies when the supplier and the place of supply are in different states; CGST and SGST apply within the same state."
   ],
   [
    "Can I check a customer's GSTIN?",
    "Yes. Use the GSTIN Validator to check the format and check digit."
   ]
  ],
  "kw": [
   "gst invoice format",
   "gst bill format",
   "gst invoice generator",
   "tax invoice format",
   "invoice format with gst",
   "gst invoice pdf"
  ],
  "rel": [
   "upi-qr-code-generator",
   "rent-agreement-format",
   "experience-certificate-format"
  ]
 },
 "upi-qr-code-generator": {
  "tool": "qr-maker",
  "h1": "UPI QR Code Generator",
  "t": "UPI QR Code Generator with Amount, Free | DocBrisk",
  "d": "Make a UPI payment QR code for your shop or invoice, with an optional fixed amount. Works with all UPI apps. Free, no watermark.",
  "lead": "Choose UPI, enter your UPI ID and name, and download the QR.",
  "body": [
   "A UPI QR code lets customers pay you from any UPI app by scanning. Print it at your counter or add it to invoices and bills.",
   "Add an amount to create a QR for one specific payment, or leave it empty so the customer types the amount."
  ],
  "f": [
   [
    "Is the QR code free to use?",
    "Yes. It is generated on your device and has no watermark or expiry."
   ],
   [
    "Will payments go directly to my account?",
    "Yes. The QR contains only your UPI ID; money goes straight to your linked bank account."
   ],
   [
    "Can I print it for my shop?",
    "Yes. Download the PNG or SVG and print it at any size."
   ]
  ],
  "kw": [
   "upi qr code generator",
   "upi qr code",
   "payment qr code generator",
   "upi qr code with amount",
   "shop qr code for payment"
  ],
  "rel": [
   "gst-invoice-format",
   "rent-agreement-format"
  ]
 },
 "change-photo-background-to-white": {
  "tool": "photo-studio",
  "h1": "Change Photo Background to White",
  "t": "Change Photo Background to White Online, Free | DocBrisk",
  "d": "Remove the background from a photo and make it white for forms, ID cards and passports. Works on mobile; your photo never leaves your phone.",
  "lead": "Upload a photo; the background is removed and you can set it to white.",
  "body": [
   "Forms and ID applications usually ask for a white or plain background. Removing it by hand is slow; here it happens automatically on your device.",
   "After changing the background, crop to the size you need, such as passport or exam photo dimensions."
  ],
  "f": [
   [
    "How do I make a photo background white?",
    "Upload the photo, let the background be removed, then choose white as the new background and download."
   ],
   [
    "Is my photo uploaded to a server?",
    "No. Background removal runs inside your browser."
   ],
   [
    "Can I make it blue or another colour?",
    "Yes. Choose any plain colour the form asks for."
   ]
  ],
  "kw": [
   "change photo background to white",
   "white background photo",
   "remove background from photo",
   "photo background change online free",
   "photo ka background white kaise kare"
  ],
  "rel": [
   "aadhaar-card-print-front-and-back"
  ]
 },
 "resume-for-freshers": {
  "tool": "cv-studio",
  "h1": "Resume Format for Freshers",
  "t": "Resume Format for Freshers: ATS-Friendly, Free | DocBrisk",
  "d": "Build a fresher resume that passes ATS checks: clean templates, live preview and an ATS score. Download a professional PDF. No sign-up needed.",
  "lead": "Pick a template and fill in your education, projects and skills.",
  "body": [
   "A fresher resume leads with education, projects, internships and skills, since work experience is limited. One page is ideal.",
   "The built-in ATS check flags missing sections and formatting that recruiters' software struggles to read."
  ],
  "f": [
   [
    "What should a fresher put in a resume?",
    "Contact details, a short objective, education, projects, internships, skills, certifications and achievements."
   ],
   [
    "Should a fresher resume be one page?",
    "Yes, in most cases. Keep only what supports the role you are applying for."
   ],
   [
    "What is an ATS score?",
    "An estimate of how well applicant tracking software can read your resume and match it to the job."
   ]
  ],
  "kw": [
   "resume format for freshers",
   "fresher resume",
   "resume for freshers pdf",
   "ats resume for freshers",
   "simple resume format for freshers"
  ],
  "rel": [
   "experience-certificate-format",
   "sign-pdf-on-mobile"
  ]
 },
 "sign-pdf-on-mobile": {
  "tool": "sign-pdf",
  "h1": "Sign a PDF on Mobile",
  "t": "Sign PDF on Mobile: Add Signature, Free | DocBrisk",
  "d": "Sign a PDF on your phone: draw your signature with a finger or type it, place it on the page and download. Free, and nothing is uploaded.",
  "lead": "Open the PDF, draw your signature and place it on the page.",
  "body": [
   "Offer letters, agreements and forms often need a signature before you send them back. You can sign them here without printing or scanning.",
   "This adds a visual signature image. For legally required digital signatures (DSC), use a certified signing service."
  ],
  "f": [
   [
    "How do I sign a PDF on my phone?",
    "Open the PDF, draw your signature with your finger, drag it into place and download the signed file."
   ],
   [
    "Is this a digital signature (DSC)?",
    "No. It is an electronic signature image. Some filings require a certificate-based DSC instead."
   ],
   [
    "Can I add the date too?",
    "Yes. Add text next to the signature for the date or your name."
   ]
  ],
  "kw": [
   "sign pdf on mobile",
   "add signature to pdf",
   "sign pdf online free",
   "e sign pdf",
   "pdf me signature kaise kare"
  ],
  "rel": [
   "merge-pdf-on-mobile",
   "resignation-letter-format"
  ]
 },
 "merge-pdf-on-mobile": {
  "tool": "merge-pdf",
  "h1": "Merge PDF Files on Mobile",
  "t": "Merge PDF on Mobile: Combine Documents Free | DocBrisk",
  "d": "Combine several PDFs into one file on your phone: marksheets, certificates, ID proofs. Put them in order and download. Free, no upload.",
  "lead": "Select your PDFs, arrange the order and download one file.",
  "body": [
   "Many applications want all documents in one PDF: marksheets, certificates, Aadhaar and photos together.",
   "Merge them here, then compress the combined file if the portal has a size limit."
  ],
  "f": [
   [
    "How do I combine PDFs into one on my phone?",
    "Select all the PDFs, arrange them in the right order and download the merged file."
   ],
   [
    "Can I add photos to the merged PDF?",
    "Convert photos with JPG to PDF first, then merge."
   ],
   [
    "The merged file is too big. What now?",
    "Compress it to the size you need, such as 200 KB or 1 MB."
   ]
  ],
  "kw": [
   "merge pdf on mobile",
   "combine pdf files",
   "merge pdf online free",
   "join pdf files",
   "pdf ko ek sath kaise jode"
  ],
  "rel": [
   "compress-pdf-to-200kb",
   "sign-pdf-on-mobile"
  ]
 }
};
// A search owned by a landing page is not claimed by its tool page as well.
for (const L of Object.values(LANDINGS)) {
  if (KW[L.tool]) KW[L.tool] = KW[L.tool].filter((q) => L.kw.indexOf(q) === -1);
}
// Short URLs that match a tool exactly go to the tool, so one page ranks.
const REDIRECTS = { '/jpg-to-pdf': '/tool/image-to-pdf', '/pdf-to-jpg': '/tool/pdf-to-image', '/passport-size-photo-maker': '/tool/photo-studio' };

const EXAM_CHECKED = 'September 2026';
const EXAMS = {
  'ssc-photo-signature-size': {
    short: 'SSC', full: 'SSC CGL, CHSL, MTS, GD Constable and Selection Post',
    items: [['Photograph', 'Captured live in the form', '', ''], ['Signature', '236 × 79 px (6.0 × 2.0 cm)', '10–20 KB', 'JPG']],
    intro: 'For SSC exams in 2026, including CGL, CHSL, MTS, GD Constable and Selection Post, the photograph is captured live through the application, so there is no photo file to upload. The signature is still uploaded. It must be a JPG between 10 KB and 20 KB, about 6.0 cm wide and 2.0 cm tall.',
    tips: ['Sign in running handwriting, not capital letters, with a black or blue pen on plain white paper.', 'For the live photo, sit in good light in front of a plain, light wall. Remove spectacles, caps and masks before the camera opens.', 'A blurred or very small signature is a common reason for rejection. Keep "Trim to the ink" on so the signature fills the box.'],
    hi: 'SSC 2026 में फोटो आवेदन के दौरान लाइव कैमरे से ली जाती है, इसलिए सिर्फ़ सिग्नेचर अपलोड करना होता है: JPG फ़ॉर्मेट, 10 से 20 KB, लगभग 6.0 × 2.0 सेमी। DocBrisk पर SSC चुनें, सफ़ेद कागज़ पर किए गए सिग्नेचर की फोटो डालें और तैयार फ़ाइल डाउनलोड करें। फ़ाइल आपके फ़ोन से बाहर नहीं जाती।',
    kw: ['ssc photo resize', 'ssc signature resize', 'ssc cgl signature size', 'ssc chsl photo size', 'ssc gd photo and signature size', 'ssc signature 10 to 20 kb']
  },
  'railway-rrb-photo-signature-size': {
    short: 'Railway RRB', full: 'RRB NTPC, Group D, ALP, JE and Technician',
    items: [['Photograph', 'Captured live in most 2026 forms', '', ''], ['Signature', '140 × 60 px (50 × 20 mm)', '30–50 KB', 'JPG']],
    intro: 'Most 2026 Railway Recruitment Board notices for NTPC, Group D, ALP, JE and Technician capture the photograph live in the application. The signature is still uploaded. Published guides for the 2026 notices give 140 × 60 pixels (about 50 × 20 mm) with a file size in the 30 to 50 KB range. Older notices used 10 to 40 KB, so check the CEN you are applying under.',
    tips: ['If your CEN asks for a photo upload instead of live capture, choose Custom in the resizer and enter the size it gives.', 'Sign in black ink in running handwriting. A signature in capital letters can be rejected.', 'The same signature is compared at the exam and at document verification, so sign the way you normally do.'],
    hi: 'रेलवे RRB 2026 के ज़्यादातर फ़ॉर्म (NTPC, Group D, ALP, JE, Technician) में फोटो लाइव कैमरे से ली जाती है। सिग्नेचर अपलोड करना होता है: 140 × 60 पिक्सल, लगभग 30 से 50 KB, JPG। अपने CEN नोटिफ़िकेशन में साइज़ ज़रूर मिलाएँ। DocBrisk पर Railway RRB चुनें और सिग्नेचर तैयार करें।',
    kw: ['railway photo signature size', 'rrb ntpc photo size', 'rrb group d signature size', 'railway form photo resize', 'rrb alp signature size', 'rrb signature 30 to 50 kb']
  },
  'ibps-sbi-photo-signature-size': {
    short: 'IBPS & SBI', full: 'IBPS PO, Clerk, RRB, SO and SBI PO, Clerk',
    items: [['Photograph', '200 × 230 px', '20–50 KB', 'JPG'], ['Signature', '140 × 60 px', '10–20 KB', 'JPG'],
      ['Left thumb impression', '240 × 240 px', '20–50 KB', 'JPG'], ['Handwritten declaration', '800 × 400 px', '50–100 KB', 'JPG']],
    intro: 'IBPS and SBI bank exams ask for four uploads: a photograph, a signature, a left thumb impression and a handwritten declaration. Each has its own pixel size and KB range, and the portal rejects files that are too small as well as too large.',
    tips: ['Write the declaration in English, in your own handwriting and not in capital letters, using the exact text from your notification.', 'Use blue or black ink for the thumb impression and keep the whole print inside the box.', 'Photograph each page flat in daylight. "Clean the paper" removes shadows and grey tones.'],
    hi: 'IBPS और SBI परीक्षा में चार फ़ाइलें लगती हैं: फोटो 200 × 230 पिक्सल (20–50 KB), सिग्नेचर 140 × 60 पिक्सल (10–20 KB), बाएँ अँगूठे का निशान 240 × 240 पिक्सल (20–50 KB) और हाथ से लिखा डिक्लेरेशन 800 × 400 पिक्सल (50–100 KB)। DocBrisk पर IBPS & SBI चुनें, चारों फ़ाइलें डालें और डाउनलोड करें।',
    kw: ['ibps photo signature size', 'ibps po photo resize', 'sbi clerk photo size', 'ibps thumb impression size', 'ibps handwritten declaration size', 'bank exam photo 20 to 50 kb']
  },
  'upsc-photo-signature-size': {
    short: 'UPSC', full: 'UPSC Civil Services, NDA, CDS and ESE',
    items: [['Photograph', '413 × 531 px (passport ratio)', '20–200 KB', 'JPG'], ['Signature', '500 × 350 px (350–500 px range)', '20–100 KB', 'JPG']],
    intro: 'UPSC applications ask for a JPG photograph between 20 KB and 200 KB and a JPG signature between 20 KB and 100 KB, with the signature between 350 and 500 pixels. The face should take up about three quarters of the photo, on a plain white background.',
    tips: ['Some UPSC forms also capture a live photo while you apply. Follow the instructions on the form.', 'Sign in black ink on plain white paper.', 'Use a recent photo with your full face clearly visible and a neutral expression.'],
    hi: 'UPSC फ़ॉर्म में फोटो JPG, 20 से 200 KB और सिग्नेचर JPG, 20 से 100 KB (350 से 500 पिक्सल) होना चाहिए। फोटो में चेहरा साफ़ दिखे और बैकग्राउंड सफ़ेद हो। DocBrisk पर UPSC चुनें और दोनों फ़ाइलें तैयार करें।',
    kw: ['upsc photo size', 'upsc signature size', 'upsc otr photo resize', 'upsc photo 20 to 200 kb', 'upsc cse photo and signature size']
  },
  'neet-photo-signature-size': {
    short: 'NEET UG', full: 'NEET UG (NTA)',
    items: [['Passport-size photograph', '350 × 450 px (3.5 × 4.5 cm)', '10–200 KB', 'JPG'], ['Postcard-size photograph', '1200 × 1800 px (4 × 6 inch)', '10–200 KB', 'JPG'],
      ['Signature', '350 × 150 px', '4–30 KB', 'JPG']],
    intro: 'NEET UG needs a passport-size photograph and a postcard-size (4 × 6 inch) photograph, each between 10 KB and 200 KB, and a signature between 4 KB and 30 KB. Use the same recent photo for both, on a white background, with your face clearly visible.',
    tips: ['Keep 6 to 8 printed copies of the same photo. It is used again at the exam centre and in counselling.', 'The signature must be in black ink and not in capital letters.', 'If your form also asks for finger or thumb impressions, choose Custom and enter the size it gives.'],
    hi: 'NEET UG में पासपोर्ट साइज़ फोटो और पोस्टकार्ड साइज़ (4 × 6 इंच) फोटो, दोनों 10 से 200 KB के बीच, और सिग्नेचर 4 से 30 KB के बीच लगता है। DocBrisk पर NEET UG चुनें, फोटो और सिग्नेचर डालें और तैयार फ़ाइलें डाउनलोड करें।',
    kw: ['neet photo size', 'neet signature size', 'neet postcard size photo', 'neet photo 10 to 200 kb', 'neet signature 4 to 30 kb']
  },
  'jee-main-photo-signature-size': {
    short: 'JEE Main', full: 'JEE Main (NTA)',
    items: [['Photograph', '350 × 450 px (3.5 × 4.5 cm)', '10–200 KB', 'JPG'], ['Signature', '350 × 150 px (3.5 × 1.5 cm)', '10–100 KB', 'JPG']],
    intro: 'JEE Main asks for a recent colour photograph of about 3.5 × 4.5 cm and a signature of about 3.5 × 1.5 cm, both as JPG files. Guides for 2026 give 10 to 200 KB for the photo (some list up to 300 KB) and 10 to 100 KB for the signature. The preset stays inside both.',
    tips: ['Use a white background with your face covering most of the photo.', 'Sign in blue or black ink on white paper.', 'The name on the photo is not required unless your information bulletin says so.'],
    hi: 'JEE Main में फोटो लगभग 3.5 × 4.5 सेमी (10–200 KB) और सिग्नेचर लगभग 3.5 × 1.5 सेमी (10–100 KB) चाहिए, दोनों JPG में। DocBrisk पर JEE Main चुनें और फ़ाइलें तैयार करें।',
    kw: ['jee main photo size', 'jee main signature size', 'nta photo resize', 'jee photo 10 to 200 kb']
  },
  'cat-photo-signature-size': {
    short: 'CAT', full: 'CAT (IIM)',
    items: [['Photograph', '354 × 531 px (30 × 45 mm)', 'Up to 80 KB', 'JPG'], ['Signature', '945 × 413 px (80 × 35 mm)', 'Up to 80 KB', 'JPG']],
    intro: 'The CAT registration form asks for a coloured passport-size photograph of 30 × 45 mm and a signature of 80 × 35 mm, each as a JPG no larger than 80 KB.',
    tips: ['Sign with a black or blue pen on white paper.', 'Use a recent photo with a plain, light background.', 'Check the file opens clearly before you upload it; the same photo is used on your admit card.'],
    hi: 'CAT फ़ॉर्म में फोटो 30 × 45 मिमी और सिग्नेचर 80 × 35 मिमी चाहिए, दोनों JPG और 80 KB से कम। DocBrisk पर CAT चुनें और फ़ाइलें तैयार करें।',
    kw: ['cat photo size', 'cat signature size', 'cat registration photo resize', 'cat photo 80 kb']
  },
  'india-post-gds-photo-signature-size': {
    short: 'India Post GDS', full: 'India Post Gramin Dak Sevak',
    items: [['Photograph', '320 × 400 px', '30–100 KB', 'JPG'], ['Signature', '300 × 120 px', '20–100 KB', 'JPG']],
    intro: 'India Post GDS applications ask for a JPG photograph of 320 × 400 pixels between 30 KB and 100 KB, and a JPG signature of 300 × 120 pixels between 20 KB and 100 KB. The face should fill most of the photo, against a plain white or light background.',
    tips: ['Do not upload a selfie or a scanned photo of a printed picture.', 'Keep the signature dark and clear, in running handwriting.', 'Crop the photo to a 4:5 shape; the resizer does this automatically.'],
    hi: 'India Post GDS फ़ॉर्म में फोटो 320 × 400 पिक्सल (30–100 KB) और सिग्नेचर 300 × 120 पिक्सल (20–100 KB) चाहिए, दोनों JPG में। DocBrisk पर India Post GDS चुनें और फ़ाइलें तैयार करें।',
    kw: ['india post gds photo size', 'gds signature size', 'gds photo resize', 'gds photo 30 to 100 kb']
  }
};

function examTitle(e) {
  const long = e.short + ' Photo & Signature Size 2026: Free Resizer | DocBrisk';
  return long.length <= 62 ? long : e.short + ' Photo & Signature Size 2026 | DocBrisk';
}
function examH1(e) { return e.short + ' Photo & Signature Size 2026'; }
function examDesc(e) {
  const parts = e.items.map((r) => r[0].toLowerCase() + (r[2] ? ' ' + r[2] : ' captured live')).join(', ');
  return clampDesc(e.short + ' 2026 sizes: ' + parts + '. Resize yours to the exact pixels and KB on your phone. Free, nothing uploaded.');
}
function examFaq(e) {
  const out = [];
  e.items.forEach((r) => {
    out.push(['What is the ' + e.short + ' ' + r[0].toLowerCase() + ' size?',
      r[2] ? 'For 2026 the ' + r[0].toLowerCase() + ' should be ' + r[1] + ', ' + r[2] + ', in ' + r[3] + ' format. Confirm it in your notification before you apply.'
           : 'In most 2026 forms the ' + r[0].toLowerCase() + ' is captured live through the application, so there is no file to upload.']);
  });
  out.push(['My ' + e.short + ' form says the file is too small. What do I do?',
    'Portals often set a minimum size as well as a maximum. The DocBrisk resizer checks both limits and brings each file inside the range, so it passes the portal check.']);
  out.push(['Are my photo and signature uploaded to DocBrisk?',
    'No. The resizer runs inside your browser tab. Your photo and signature are read into memory on your own device and saved back as downloads.']);
  return out;
}
function examLinks(current) {
  return '<ul>' + Object.keys(EXAMS).filter((s) => s !== current).map((s) =>
    '<li><a href="/exam/' + s + '">' + esc(examH1(EXAMS[s])) + '</a></li>').join('') + '</ul>';
}
function examAboutHtml(slug) {
  const e = EXAMS[slug];
  const cell = 'style="text-align:left;padding:8px 10px;border-bottom:1px solid #e2e8f0"';
  const rows = e.items.map((r) => '<tr><td ' + cell + '>' + esc(r[0]) + '</td><td ' + cell + '>' + esc(r[1]) + '</td><td ' + cell + '>' +
    esc(r[2] || 'No upload') + '</td><td ' + cell + '>' + esc(r[3] || '—') + '</td></tr>').join('');
  const hasPhoto = e.items.some((r) => r[2] && /photo/i.test(r[0]));
  const steps = ['Open the resizer above. ' + e.short + ' is already selected.'].concat(hasPhoto ?
    ['Add your photo, then drag and zoom until your face sits in the middle of the frame.'] : []).concat([
    'Sign on plain white paper, take a picture of it in daylight and add it. Keep "Clean the paper" and "Trim to the ink" on.',
    'Check the green ticks for pixels and KB, then download each file and upload it to the ' + e.short + ' portal.']);
  const faq = examFaq(e).map((f) => '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>').join('');
  return '<div id="seo-about" class="wrap">' +
    '<section class="prose" id="exam-guide" style="margin-top:56px">' +
      '<h2>' + esc(e.short) + ' photo and signature size for 2026</h2>' +
      '<p>' + esc(e.intro) + '</p>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.92rem">' +
        '<thead><tr><th ' + cell + '>File</th><th ' + cell + '>Size</th><th ' + cell + '>File size</th><th ' + cell + '>Format</th></tr></thead>' +
        '<tbody>' + rows + '</tbody></table></div>' +
      '<p><small>Checked ' + EXAM_CHECKED + ' against published guides to the 2026 notices for ' + esc(e.full) +
        '. Always confirm the sizes in your own notification. The resizer lets you edit every value.</small></p>' +
      '<h3>How to resize your ' + esc(e.short) + ' photo and signature</h3><ol>' + steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
      '<h3>Tips so your form is not rejected</h3><ul>' + e.tips.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul>' +
      '<p>Need a white background or a printed passport photo too? Use the <a href="/tool/photo-studio">passport photo maker</a>. ' +
        'For certificates and marksheets, <a href="/tool/compress-pdf">compress the PDF</a> to the portal\'s limit.</p>' +
    '</section>' +
    '<section class="prose" id="exam-hindi" lang="hi" style="margin-top:32px"><h2>' + esc(e.short) + ' फोटो और सिग्नेचर साइज़ 2026</h2><p>' + esc(e.hi) + '</p></section>' +
    '<section class="faq prose" aria-labelledby="examFaqHeading"><h2 id="examFaqHeading">Questions about ' + esc(e.short) + ' photo and signature size</h2>' + faq + '</section>' +
    '<section class="prose" id="other-exams" style="margin-top:32px"><h2>Photo and signature sizes for other exams</h2>' + examLinks(slug) + '</section>' +
    allToolsNav() +
  '</div>';
}
function examSchema(slug) {
  const e = EXAMS[slug], url = SITE + '/exam/' + slug;
  return ldScript([ORG, WEBSITE,
    { '@type': 'WebPage', '@id': url, 'url': url, 'name': examH1(e), 'description': examDesc(e),
      'isPartOf': { '@id': SITE + '/#site' }, 'inLanguage': 'en-IN', 'keywords': e.kw.join(', '),
      'mainEntity': { '@id': SITE + '/tool/exam-photo#app' } },
    { '@type': 'BreadcrumbList', 'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'DocBrisk', 'item': SITE + '/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Exam Photo & Signature Resizer', 'item': SITE + '/tool/exam-photo' },
      { '@type': 'ListItem', 'position': 3, 'name': examH1(e), 'item': url }] },
    { '@type': 'FAQPage', 'mainEntity': examFaq(e).map((f) => ({ '@type': 'Question', 'name': f[0],
      'acceptedAnswer': { '@type': 'Answer', 'text': f[1] } })) }]);
}

const GROUPS = [["biodata-maker", "letter-maker", "cv-studio", "invoice-maker", "gstin-validator", "id-card"], ["photo-studio", "exam-photo", "doc-scanner", "id-card", "cv-studio", "ocr-pdf", "image-to-pdf"], ["pdf-editor", "sign-pdf", "redact-pdf", "smart-redact", "clean-metadata", "unlock-pdf", "protect-pdf", "watermark-pdf", "remove-watermark", "number-pdf", "doc-integrity"], ["merge-pdf", "split-by-size", "organize-pdf", "compress-pdf", "resize-pdf", "impose-pdf", "clean-scan", "batch-process", "compare-pdf"], ["pdf-to-word", "word-to-pdf", "pdf-to-excel", "extract-tables", "sheet-to-pdf", "pdf-to-image", "image-to-pdf", "pdf-to-ppt", "extract-images", "translate-pdf", "ocr-pdf"], ["qr-maker", "qr-stamp", "invoice-maker", "mail-merge", "sheet-to-pdf"]];

const FREE_COUNT = Object.values(TOOLS).filter((t) => !t.pro).length;
const PRO_COUNT = Object.keys(TOOLS).length - FREE_COUNT;
// Pro tools every free account can try (counted per account by docbrisk-api).
const TRIALS = { 'ocr-pdf': 3, 'mail-merge': 3 };

const STATIC_PAGES = {
  'privacy':  ['Privacy Policy | DocBrisk', 'How DocBrisk handles your documents: everything is processed in your browser and nothing is uploaded.', 'Privacy Policy'],
  'about':    ['About DocBrisk', 'Why DocBrisk processes documents entirely in the browser, and who builds it.', 'About DocBrisk'],
  'terms':    ['Terms of Use | DocBrisk', 'The terms that apply when you use the free document tools on DocBrisk.', 'Terms of Use'],
  'pricing':  ['Pricing — Free Tools and DocBrisk Pro', FREE_COUNT + ' tools are free with no limits. DocBrisk Pro adds ' + PRO_COUNT + ' advanced tools and 20 extra resume templates for ₹' + PRO_PRICE + ' a month.', 'Pricing'],
  'addins':   ['Excel Add-ins: Dashboards, NLOOKUP & Custom Builds | DocBrisk', 'Excel add-ins for dashboards and lookups that run on your own PC, plus custom Excel add-ins built for your workflow. Your workbook is never uploaded.', 'Excel Add-ins'],
  'security': ['Security | DocBrisk', 'How DocBrisk keeps your documents and your account secure.', 'Security']
};
// App screens that must load but never be indexed.
const PRIVATE_PAGES = ['admin', 'diagnostics', 'admin-addins'];

const HOME_H1 = 'Free PDF tools that keep your files on your device';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function titleFor(t) {
  if (t.st) return t.st + ' | DocBrisk';
  return t.t.length > 34 ? t.t + ' | DocBrisk' : t.t + ' — Free & Private | DocBrisk';
}

/* Google shows roughly 155 characters of a description. */
function clampDesc(d) {
  if (d.length <= 158) return d;
  return d.slice(0, 155).replace(/\s+\S*$/, '') + '…';
}

/* Always use a replacer FUNCTION with String.replace: a plain string
   replacement treats "$&" and "$1" specially and would corrupt content. */
function setTag(html, pattern, value) {
  return html.replace(pattern, (m) =>
    m.replace(/(content|href)="[^"]*"/, (a, attr) => attr + '="' + esc(value) + '"'));
}

function rewriteHead(html, { title, desc, url, path, noindex, keywords }) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => '<title>' + esc(title) + '</title>');
  html = setTag(html, /<meta name="description"[^>]*>/, desc);
  html = setTag(html, /<link rel="canonical"[^>]*>/, url);
  html = setTag(html, /<meta property="og:title"[^>]*>/, title);
  html = setTag(html, /<meta property="og:description"[^>]*>/, desc);
  html = setTag(html, /<meta property="og:url"[^>]*>/, url);
  html = setTag(html, /<meta name="twitter:title"[^>]*>/, title);
  html = setTag(html, /<meta name="twitter:description"[^>]*>/, desc);
  if (noindex) html = setTag(html, /<meta name="robots"[^>]*>/, 'noindex, follow');
  html = html.replace(/<meta name="keywords"[^>]*>\s*/g, () => '');
  if (keywords) html = html.replace('</head>', () => '<meta name="keywords" content="' + esc(keywords) + '">\n</head>');
  html = html.replace(/<link rel="alternate" hreflang="[^"]*"[^>]*>\s*/g, () => '');
  // Tells the app this head was written for this exact path, so it keeps it.
  html = html.replace('</head>', () => '<meta name="db-ssr" content="' + esc(path) + '">\n</head>');
  return html;
}

/* ---------- content builders ---------- */

function relatedSlugs(slug, n) {
  const out = [];
  GROUPS.forEach((g) => {
    const i = g.indexOf(slug);
    if (i === -1) return;
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
    '</ul><h2 style="margin-top:24px">Photo and signature size by exam</h2>' +
    '<ul style="columns:2;column-gap:28px;padding-left:18px">' +
    Object.keys(EXAMS).map((s) => '<li><a href="/exam/' + s + '">' + esc(examH1(EXAMS[s])) + '</a></li>').join('') +
    '</ul><h2 style="margin-top:24px">Popular guides</h2>' +
    '<ul style="columns:2;column-gap:28px;padding-left:18px">' +
    Object.keys(LANDINGS).map((s) => '<li><a href="/' + s + '">' + esc(LANDINGS[s].h1) + '</a></li>').join('') +
    '</ul></section>';
}

function faqFor(slug) {
  const t = TOOLS[slug];
  const list = t.faq.slice();
  if (t.pro) {
    list.push(['Is ' + t.t + ' free?', 'It is part of DocBrisk Pro at ₹' + PRO_PRICE + ' a month.' +
      (TRIALS[slug] ? ' Every free DocBrisk account can use it ' + TRIALS[slug] + ' times before upgrading.' : '') + ' ' + FREE_COUNT +
      ' other DocBrisk tools are free to use with no signup and no page limits.']);
  }
  if (slug === 'translate-pdf') {
    list.push(['Are my documents uploaded to a server?', 'The PDF itself never leaves your device. Only the extracted text is sent to a public translation service so it can be translated.']);
  } else {
    list.push(['Are my files uploaded to a server?', 'No. ' + t.t + ' runs as JavaScript inside your own browser tab. Your file is read from your device into browser memory and the result is saved back as a download, so nothing is transmitted.']);
  }
  return list;
}

/* ---------- long-form guides (v4.2) ----------
   Extra, visible content for the six tool pages people search for most.
   Rendered inside #seo-about between "About <tool>" and the FAQ, so it sits
   below the tool for visitors and is readable by crawlers without JavaScript.
   Every other tool page is unchanged.
   Mini-markup: [label](/tool/slug) becomes an internal link (site paths only). */

function guideInline(s) {
  return esc(s).replace(/\[([^\]]+)\]\((\/[a-z0-9\-\/]*)\)/g,
    (m, label, href) => '<a href="' + href + '">' + label + '</a>');
}

function guideBlocks(body) {
  return body.map((b) => {
    if (typeof b === 'string') return '<p>' + guideInline(b) + '</p>';
    if (b.ul) return '<ul>' + b.ul.map((li) => '<li>' + guideInline(li) + '</li>').join('') + '</ul>';
    if (b.ol) return '<ol>' + b.ol.map((li) => '<li>' + guideInline(li) + '</li>').join('') + '</ol>';
    return '';
  }).join('');
}

const GUIDES = {

  'exam-photo': {
    title: 'How to resize a photo and signature for an exam form',
    intro: [
      'Recruitment and entrance-exam portals check two things about every image: its size in pixels and its file size in KB. Most also set a minimum as well as a maximum, such as 20 KB to 50 KB for a photo or 10 KB to 20 KB for a signature. A file outside that window is rejected even if it looks perfect.'
    ],
    sections: [
      { h: 'Why a normal photo gets rejected', body: [
        { ul: [
          'A phone photo is several MB and thousands of pixels wide, far above the limit.',
          'A photo shrunk in a basic editor can drop to 5 or 8 KB, below the minimum.',
          'A signature photographed on grey or shadowed paper looks dirty and can be rejected as unclear.'
        ] }
      ] },
      { h: 'What the resizer does', body: [
        { ol: [
          'Sets the exact pixel size for your exam, so the portal\'s dimension check passes.',
          'Crops your photo to that frame. You drag and zoom to centre your face.',
          'Cleans the signature: shadows and grey paper turn white and the ink gets darker, then empty paper is trimmed away.',
          'Saves a JPG inside the KB window, raising or lowering quality and, if needed, adding a small comment block so the file clears the minimum.'
        ] }
      ] },
      { h: 'Exam-by-exam sizes', body: [
        'Each exam has its own page with the 2026 sizes, steps and common reasons for rejection: [SSC](/exam/ssc-photo-signature-size), [Railway RRB](/exam/railway-rrb-photo-signature-size), [IBPS and SBI](/exam/ibps-sbi-photo-signature-size), [UPSC](/exam/upsc-photo-signature-size), [NEET UG](/exam/neet-photo-signature-size), [JEE Main](/exam/jee-main-photo-signature-size), [CAT](/exam/cat-photo-signature-size) and [India Post GDS](/exam/india-post-gds-photo-signature-size).'
      ] }
    ],
    hi: {
      title: 'परीक्षा फ़ॉर्म के लिए फोटो और सिग्नेचर का साइज़ कैसे बदलें',
      body: [
        'सरकारी नौकरी और प्रवेश परीक्षा के पोर्टल फोटो और सिग्नेचर का साइज़ पिक्सल और KB दोनों में जाँचते हैं, जैसे फोटो 20 से 50 KB और सिग्नेचर 10 से 20 KB। बहुत बड़ी या बहुत छोटी फ़ाइल रिजेक्ट हो जाती है।',
        { ol: [
          'अपनी परीक्षा चुनें, जैसे SSC, Railway RRB, IBPS, UPSC, NEET या JEE।',
          'अपनी फोटो डालें और चेहरे को फ़्रेम के बीच में रखें।',
          'सफ़ेद कागज़ पर किए सिग्नेचर की फोटो डालें। "Clean the paper" कागज़ को सफ़ेद और स्याही को गहरा कर देता है।',
          'हरे निशान देखकर फ़ाइलें डाउनलोड करें। आपकी फोटो और सिग्नेचर आपके फ़ोन से बाहर नहीं जाते।'
        ] }
      ]
    }
  },

  'compress-pdf': {
    title: 'How to compress a PDF to 100KB, 200KB or 500KB',
    intro: [
      'Recruitment portals, exam applications, scholarship forms, university admissions and bank KYC pages often cap uploads at a fixed size: 100KB, 200KB, 500KB or 1MB. The limit is usually printed next to the upload button or in the form\'s instructions. Use that number as your target and DocBrisk works toward it on your own device.'
    ],
    sections: [
      { h: 'How DocBrisk gets a PDF under the limit', body: [
        'Compression runs in stages, and the size is checked against your target after each one:',
        { ol: [
          'Structure first. Duplicate and unused data inside the file is cleaned up. Nothing you can see changes.',
          'Images next. Photos and scanned pages are re-encoded step by step, and the highest quality that still fits the target is kept.',
          'Flattening only if you allow it. If the target can\'t be reached any other way and "Flatten pages if needed" is ticked, pages are turned into images and the text is no longer selectable. The result tells you when that happened.'
        ] }
      ] },
      { h: 'Why is my PDF still bigger than 100KB?', body: [
        'Almost all of a large PDF\'s size comes from photos and scans. DocBrisk shows what is taking up the space before you compress, which tells you where the savings can come from. A multi-page scan made at high resolution may not fit 100KB and stay readable. These help:',
        { ul: [
          'Remove pages the form doesn\'t need, such as blank backs of pages, with [Organize PDF](/tool/organize-pdf), then compress again.',
          'If you are rescanning anyway, 150 to 200 DPI is enough for most text documents, and grayscale or black and white is far smaller than colour.',
          'If the portal accepts more than one file, split the document with [Split PDF by size](/tool/split-by-size).'
        ] }
      ] },
      { h: 'Tips for exam, job and government form uploads', body: [
        { ul: [
          'Check the format as well as the size. Some forms want PDF, some want JPG, and a few want both.',
          'Photos and signatures usually have their own, much smaller limits. For the photo, use the [passport photo maker](/tool/photo-studio).',
          'Keep file names short and plain, like name_marksheet.pdf. Some portals have trouble with spaces and special characters.',
          'Open the compressed file once and zoom in on small print, stamps and signatures before you upload it.'
        ] }
      ] },
      { h: 'Can I compress a digitally signed PDF?', body: [
        'A PDF signed with a digital certificate, which is common on documents issued by government and bank systems, is sealed. Changing any part of the file, including compressing it, makes the signature show as invalid. If the receiver needs to verify the signature, upload the original. A signature that is only a picture of a handwritten signature is not affected.'
      ] }
    ],
    hi: {
      title: 'PDF का साइज़ 100KB या 200KB तक कैसे कम करें',
      body: [
        'सरकारी फ़ॉर्म, भर्ती परीक्षा, स्कॉलरशिप और एडमिशन पोर्टल अक्सर PDF को 100KB, 200KB या 500KB से छोटा माँगते हैं। फ़ॉर्म के निर्देशों में लिखी लिमिट देखें।',
        { ol: [
          'ऊपर दिए बॉक्स में अपनी PDF चुनें।',
          'फ़ॉर्म में जो लिमिट लिखी है, वही साइज़ चुनें, जैसे 100 KB या 200 KB।',
          'कम्प्रेस करें और नई फ़ाइल डाउनलोड करें।'
        ] },
        'आपकी फ़ाइल किसी सर्वर पर अपलोड नहीं होती। पूरा काम आपके फ़ोन या कंप्यूटर के ब्राउज़र में होता है।',
        'स्कैन की हुई PDF 100KB से नीचे न आए तो Black and white चुनें, या बेकार पेज हटाकर दोबारा कम्प्रेस करें।'
      ]
    }
  },

  'pdf-to-word': {
    title: 'Converting a PDF to an editable Word file',
    intro: [
      'A PDF records where each character sits on the page. It has no idea what a paragraph, a table or a heading is, so every converter has to rebuild that structure. How well it does that decides whether the Word file looks like your PDF or like a jumble.'
    ],
    sections: [
      { h: 'Exact look or Reflowed: which one to choose', body: [
        'Exact look keeps the page as it is. Backgrounds, borders, lines, logos and photos stay in place, and the text sits on top at its original position, size and colour. Choose it for small, precise edits such as a name, a date, an amount or an address, when the document has to look like the original.',
        'Reflowed rebuilds the document as normal Word structure: real headings, lists, columns and tables that flow as you type. Choose it when you will rewrite paragraphs, add pages or reuse the text in a new layout.'
      ] },
      { h: 'Why can\'t I select the text in my PDF?', body: [
        'Then the PDF is a scan or a photo: each page is a picture of text, and there is no text for a converter to read. Run it through [OCR](/tool/ocr-pdf) first. It recognises the characters and can give you an editable Word file directly.'
      ] },
      { h: 'The fonts look different after converting', body: [
        'Word can only show fonts installed on your computer. If the PDF used a font you don\'t have, Word substitutes a similar one and line lengths can shift a little. Installing the original font, or picking one close match for the whole document, fixes it.'
      ] },
      { h: 'Common reasons to convert PDF to Word', body: [
        { ul: [
          'Updating a resume that only exists as a PDF. If you\'re starting over, the [resume builder](/tool/cv-studio) is quicker.',
          'Reusing a quotation, notice or letter format for a new version.',
          'Correcting a draft agreement before it is signed.',
          'Getting tables into a spreadsheet. For that, [Extract tables](/tool/extract-tables) usually gives cleaner rows and columns.'
        ] },
        'When you\'ve finished editing, [Word to PDF](/tool/word-to-pdf) turns the file back into a PDF.'
      ] }
    ],
    hi: {
      title: 'PDF को Word में कैसे बदलें',
      body: [
        'अपनी PDF चुनें, मोड चुनें और .docx फ़ाइल डाउनलोड करें। डिज़ाइन जैसा का तैसा चाहिए तो Exact look चुनें। पूरा टेक्स्ट दोबारा लिखना हो तो Reflowed चुनें। फ़ाइल आपके डिवाइस से बाहर नहीं जाती।',
        'अगर PDF में टेक्स्ट सेलेक्ट नहीं होता, तो वह स्कैन की हुई फ़ाइल है। पहले [OCR](/tool/ocr-pdf) इस्तेमाल करें।',
        'पुराने हिंदी फ़ॉन्ट (जैसे Kruti Dev) में बनी PDF को कोई भी कन्वर्टर सही यूनिकोड हिंदी में नहीं बदल पाता, क्योंकि उनमें हिंदी अक्षर अंग्रेज़ी अक्षरों के कोड पर बने होते हैं। ऐसी फ़ाइल का मूल Word दस्तावेज़ मिल जाए तो वही सबसे अच्छा है।'
      ]
    }
  },

  'id-card': {
    title: 'Printing Aadhaar, PAN and other ID cards front and back on one page',
    intro: [
      'Banks, offices, schools and landlords often ask for one self-attested copy showing both sides of an ID. This tool places the front and back on a single sheet of A4, A5, US Letter or 4×6 paper at the card\'s real size, 85.6 × 54 mm, with cut guides, one above the other or side by side.'
    ],
    sections: [
      { h: 'Which cards it supports', body: [
        'Aadhaar (the e-Aadhaar card or the PVC card), PAN, voter ID (EPIC), driving licence and Ayushman or other health cards all share the same credit-card size. For anything else, enter a custom size in millimetres.'
      ] },
      { h: 'Getting a clean print', body: [
        { ul: [
          'Photograph each side lying flat, in good light, with no flash glare over the text or photo.',
          'Crop close to the card\'s edges. If the photo was taken at an angle, straighten it first with the [document scanner](/tool/doc-scanner).',
          'In the print dialog, choose "Actual size" or 100% scale. "Fit to page" shrinks the card below its real size.'
        ] }
      ] },
      { h: 'Using e-Aadhaar downloaded from UIDAI', body: [
        'The e-Aadhaar PDF from UIDAI is password protected. The password is the first four letters of your name as printed on the card, in capitals, followed by your year of birth, for example SURE1990. You can remove the password from your own copy with [Unlock PDF](/tool/unlock-pdf), then turn the page into an image with [PDF to JPG](/tool/pdf-to-image) and crop each side.',
        'UIDAI treats a printout of e-Aadhaar as valid in the same way as the Aadhaar letter that arrives by post.'
      ] },
      { h: 'Sharing a copy safely', body: [
        'UIDAI also offers a masked Aadhaar, which shows only the last four digits of the number. Use it when the full number isn\'t needed. On any photocopy you hand over, writing the purpose and date across it, such as "For KYC at ABC Bank only", makes misuse harder.'
      ] }
    ],
    hi: {
      title: 'आधार कार्ड के आगे और पीछे का प्रिंट एक पेज पर कैसे निकालें',
      body: [
        { ol: [
          'कार्ड के आगे और पीछे की साफ़ फ़ोटो या स्कैन चुनें।',
          'कार्ड का प्रकार चुनें: आधार, PAN, वोटर ID, ड्राइविंग लाइसेंस या कस्टम साइज़।',
          'दोनों साइड ऊपर-नीचे या अगल-बगल रखें, पेपर साइज़ (जैसे A4) चुनें और PDF डाउनलोड करें।',
          'प्रिंट करते समय "Actual size" या 100% स्केल चुनें, "Fit to page" नहीं।'
        ] },
        'UIDAI से डाउनलोड किए e-Aadhaar का पासवर्ड आपके नाम के पहले चार अक्षर (कैपिटल में) और जन्म का साल होता है, जैसे SURE1990।'
      ]
    }
  },

  'photo-studio': {
    title: 'Passport size photos for applications, exams and visas',
    intro: [
      'Almost every application asks for a photo with a fixed size, a plain background and a file size limit. Getting any one of them wrong is a common reason forms are rejected. This tool removes the background, crops to passport, visa and ID sizes for 14 countries and saves a file small enough for online uploads, without sending your photo anywhere.'
    ],
    sections: [
      { h: 'Common photo sizes', body: [
        { ul: [
          'Indian forms: "passport size" usually means 3.5 × 4.5 cm.',
          'United States passport and visa: 2 × 2 inches (51 × 51 mm).',
          'United Kingdom, Schengen countries and much of Europe: 35 × 45 mm.'
        ] },
        'If your form gives a different size, follow the form. For an Indian passport applied for at a Passport Seva Kendra, you don\'t need to bring a photo; it is taken at the centre.'
      ] },
      { h: 'Photo rules behind most rejections', body: [
        { ul: [
          'Background: plain white or off-white unless the form says otherwise, with no shadow behind the head.',
          'Face: straight to the camera, neutral expression, eyes clearly visible. Avoid tinted glasses and caps.',
          'Recency: most forms want a photo taken within the last few months.',
          'Lighting: even on both sides of the face. Daylight from a window in front of you works better than a ceiling bulb overhead.'
        ] }
      ] },
      { h: 'Making a photo fit a KB limit', body: [
        'Online forms often give a file size range, such as 20KB to 50KB, along with pixel dimensions. Too large and the upload fails; squeezed too far and the face turns blocky. Set the cap the form asks for, then zoom in on the saved photo to check the face is still sharp. A signature, if the form asks for one, is a separate image with its own limit.'
      ] },
      { h: 'Getting a clean background', body: [
        'The tool treats the colour around the edges of the photo as the backdrop, so a plain, evenly lit wall behind you gives the cleanest result. Hair or clothing close to the wall\'s colour is the hard case; the keep and erase brushes fix those spots by hand.'
      ] }
    ],
    hi: {
      title: 'पासपोर्ट साइज़ फ़ोटो ऑनलाइन कैसे बनाएँ',
      body: [
        'फ़ोटो चुनें, बैकग्राउंड हटाकर सफ़ेद करें, अपने फ़ॉर्म का साइज़ चुनें (भारत में आम तौर पर 3.5 × 4.5 सेमी) और फ़ाइल डाउनलोड करें।',
        'परीक्षा और नौकरी के फ़ॉर्म अक्सर फ़ोटो को तय KB में माँगते हैं, जैसे 20KB से 50KB। फ़ॉर्म के निर्देश ज़रूर देखें।',
        'अच्छी फ़ोटो के लिए सादी, हल्के रंग की दीवार के सामने खड़े हों और रोशनी सामने से आए।'
      ]
    }
  },

  'invoice-maker': {
    title: 'Making a GST invoice with a UPI payment QR',
    intro: [
      'A tax invoice under GST has to carry specific details, and a UPI QR on the same page lets the customer pay the exact total by scanning it. This generator lays out both and keeps your business details in your browser, so the next invoice takes a minute.'
    ],
    sections: [
      { h: 'What a GST tax invoice should include', body: [
        'Rule 46 of the CGST Rules lists the details a tax invoice must carry. The main ones are:',
        { ul: [
          'Your name, address and GSTIN.',
          'A unique invoice number and the date of issue. Numbers run in one series per financial year and can be up to 16 characters long.',
          'The buyer\'s name and address, and their GSTIN if they are registered.',
          'HSN code for goods or SAC code for services, with a description and quantity.',
          'Taxable value, GST rate and tax amount, shown as CGST and SGST or as IGST.',
          'Place of supply, with the state name for an inter-state sale.',
          'Signature or digital signature of the supplier or an authorised person.'
        ] },
        'Rules change from time to time, so check anything unusual with your accountant.'
      ] },
      { h: 'CGST and SGST, or IGST?', body: [
        'If you and the place of supply are in the same state, the tax is split equally between CGST and SGST, so 18% becomes 9% + 9%. If they are in different states, the full rate is charged as IGST. In a union territory without its own legislature, UTGST takes the place of SGST.'
      ] },
      { h: 'Why put a UPI QR on an invoice', body: [
        'The QR carries your UPI ID and the invoice total, so the customer doesn\'t type either one, which removes the most common payment mistakes. It works with any UPI app. Before you send the first invoice, scan the QR yourself and check that the app shows the right payee name and amount.'
      ] },
      { h: 'What this tool doesn\'t do', body: [
        'Businesses above the government\'s e-invoicing turnover threshold must register B2B invoices on the Invoice Registration Portal and print the IRN and signed QR code it returns. DocBrisk doesn\'t connect to that portal, so it suits businesses below the threshold, freelancers and small shops. E-way bills are also generated separately, on the government portal.'
      ] }
    ],
    hi: {
      title: 'GST बिल / इनवॉइस ऑनलाइन कैसे बनाएँ',
      body: [
        'अपनी दुकान या फ़र्म का नाम, पता और GSTIN डालें, ग्राहक और आइटम (HSN या SAC कोड के साथ) जोड़ें, और UPI QR के साथ इनवॉइस की PDF डाउनलोड करें। QR में बिल की पूरी रकम होती है।',
        'एक ही राज्य में बिक्री पर टैक्स CGST और SGST में आधा-आधा बँटता है (18% = 9% + 9%)। दूसरे राज्य में बिक्री पर पूरा टैक्स IGST के रूप में लगता है।',
        'आपका डेटा आपके ही ब्राउज़र में रहता है, किसी सर्वर पर नहीं जाता।'
      ]
    }
  },

  'unlock-pdf': {
    title: 'Removing the password from a bank statement, e-Aadhaar or other PDF',
    intro: [
      'Bank statements, credit card statements, salary slips, insurance policies and e-Aadhaar arrive as password-protected PDFs. Typing the password every time is tedious, and many upload portals reject protected files outright. Unlock your copy once and it opens anywhere without asking.'
    ],
    sections: [
      { h: 'Common password formats', body: [
        'Senders build the password from details they already hold, so the covering email or the sender\'s website is the place to check. Typical patterns:',
        { ul: [
          'Bank and card statements: often part of your name, your date of birth, or the last digits of the account or card number.',
          'Other documents: often your PAN, customer ID or date of birth.',
          'e-Aadhaar: the fixed UIDAI format described in the questions below.'
        ] }
      ] },
      { h: 'Why is my password being rejected?', body: [
        { ul: [
          'Passwords are case-sensitive. Check whether the name part should be in capitals.',
          'Dates come in several forms: DDMMYYYY, DDMMYY and DDMM are all common.',
          'Copying the password from an email can bring along a hidden space at the end.'
        ] }
      ] },
      { h: 'After unlocking', body: [
        'Locked files often can\'t be compressed or merged either. Once your copy is unlocked, you can [compress it](/tool/compress-pdf) to a portal\'s size limit or [merge](/tool/merge-pdf) several statements into one file. To add a password again before you share it, use [Protect PDF](/tool/protect-pdf).'
      ] }
    ],
    hi: {
      title: 'PDF से पासवर्ड कैसे हटाएँ',
      body: [
        { ol: [
          'पासवर्ड वाली PDF चुनें।',
          'उसे खोलने वाला पासवर्ड एक बार डालें। सिर्फ़ प्रिंट या कॉपी वाले लॉक के लिए पासवर्ड की ज़रूरत नहीं होती।',
          'बिना पासवर्ड वाली कॉपी डाउनलोड करें।'
        ] },
        'जो PDF खुलने के लिए पासवर्ड माँगती है, उसे बिना पासवर्ड के कोई नहीं खोल सकता। बैंक स्टेटमेंट का पासवर्ड अक्सर ईमेल में बताए फ़ॉर्मैट में होता है। e-Aadhaar का पासवर्ड नाम के पहले चार अक्षर (कैपिटल में) और जन्म का साल होता है।'
      ]
    }
  }
};

function guideHtml(slug) {
  const g = GUIDES[slug];
  if (!g) return '';
  let html =
    '<section class="prose" id="tool-guide" style="margin-top:40px">' +
      '<h2>' + esc(g.title) + '</h2>' + guideBlocks(g.intro) +
      g.sections.map((s) => '<h3>' + esc(s.h) + '</h3>' + guideBlocks(s.body)).join('') +
    '</section>';
  if (g.hi) {
    html +=
      '<section class="prose" id="tool-hindi" lang="hi" style="margin-top:32px">' +
        '<h2>' + esc(g.hi.title) + '</h2>' + guideBlocks(g.hi.body) +
      '</section>';
  }
  return html;
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
      (KW[slug] ? '<p style="font-size:.9rem;color:#475569">Also searched as: ' + KW[slug].slice(0, 5).map(esc).join(', ') + '.</p>' : '') +
      (t.pro ? '<p>' + esc(t.t) + ' is part of <a href="/pricing">DocBrisk Pro</a> (₹' + PRO_PRICE + ' a month).</p>' : '') +
    '</section>' +
    guideHtml(slug) +
    (() => {
      const lands = Object.keys(LANDINGS).filter((k) => LANDINGS[k].tool === slug);
      return lands.length ? '<section class="prose" id="tool-searches" style="margin-top:32px"><h2>Popular with this tool</h2><ul>' +
        lands.map((k) => '<li><a href="/' + k + '">' + esc(LANDINGS[k].h1) + '</a></li>').join('') + '</ul></section>' : '';
    })() +
    '<section class="faq prose" aria-labelledby="toolFaqHeading">' +
      '<h2 id="toolFaqHeading">Questions about ' + esc(t.t) + '</h2>' + faq +
    '</section>' +
    '<section class="prose" id="related-tools" style="margin-top:32px">' +
      '<h2>Related tools</h2><ul>' + rel + '</ul>' +
    '</section>' +
    allToolsNav() +
  '</div>';
}

const ORG = { '@type': 'Organization', '@id': SITE + '/#org', 'name': 'DocBrisk', 'url': SITE + '/',
  'logo': { '@type': 'ImageObject', 'url': SITE + '/icon-512.png', 'width': 512, 'height': 512 },
  'founder': { '@type': 'Person', 'name': 'Nitish Choudhary' } };
const WEBSITE = { '@type': 'WebSite', '@id': SITE + '/#site', 'url': SITE + '/', 'name': 'DocBrisk',
  'publisher': { '@id': SITE + '/#org' }, 'inLanguage': 'en-IN' };

function ldScript(graph) {
  // "<" is escaped so a stray "</script>" in content can never break out of the tag
  return '<script type="application/ld+json">' +
    JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c') +
    '</script>';
}

function toolSchema(slug) {
  const t = TOOLS[slug];
  const url = SITE + '/tool/' + slug;
  const app = {
    '@type': 'WebApplication',
    '@id': url + '#app',
    'name': t.t,
    'url': url,
    'description': t.d,
    'keywords': (KW[slug] || []).join(', '),
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'Any (runs in a web browser)',
    'isPartOf': { '@id': SITE + '/#site' },
    'publisher': { '@id': SITE + '/#org' },
    'offers': t.pro
      ? { '@type': 'Offer', 'price': String(PRO_PRICE), 'priceCurrency': 'INR',
          'priceSpecification': { '@type': 'UnitPriceSpecification', 'price': String(PRO_PRICE),
            'priceCurrency': 'INR', 'billingDuration': 'P1M', 'unitText': 'month' } }
      : { '@type': 'Offer', 'price': '0', 'priceCurrency': 'INR' }
  };
  const graph = [ORG, WEBSITE, app, {
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'DocBrisk', 'item': SITE + '/' },
      { '@type': 'ListItem', 'position': 2, 'name': t.t, 'item': url }
    ]
  }];
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
  return ldScript(graph);
}

function staticSchema(slug, h1) {
  const url = SITE + '/' + slug;
  return ldScript([ORG, WEBSITE,
    { '@type': 'WebPage', '@id': url, 'url': url, 'name': h1, 'isPartOf': { '@id': SITE + '/#site' } },
    { '@type': 'BreadcrumbList', 'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'DocBrisk', 'item': SITE + '/' },
      { '@type': 'ListItem', 'position': 2, 'name': h1, 'item': url }] }]);
}

/* ---------- landing pages (v4.4) ---------- */
function landingFaq(slug) {
  const L = LANDINGS[slug], t = TOOLS[L.tool];
  const free = t.pro
    ? 'It is part of DocBrisk Pro (₹' + PRO_PRICE + ' a month)' + (TRIALS[L.tool] ? ', and every free account can use it ' + TRIALS[L.tool] + ' times first' : '') + '. '
    : 'Yes, it is free, with no sign-up and no watermark. ';
  return L.f.concat([['Is it free, and is my file uploaded?', free + 'Your file is processed inside your browser and is never uploaded to a server.']]);
}

function landingAboutHtml(slug) {
  const L = LANDINGS[slug], t = TOOLS[L.tool];
  const faq = landingFaq(slug).map((f) => '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>').join('');
  const rel = L.rel.filter((s) => LANDINGS[s]).map((s) => '<li><a href="/' + s + '">' + esc(LANDINGS[s].h1) + '</a></li>').join('');
  return '<div id="seo-about" class="wrap">' +
    '<section class="prose" id="tool-about" style="margin-top:56px">' +
      '<h2>About ' + esc(L.h1.replace(/\s*\(.*\)$/, '')) + '</h2>' +
      L.body.map((p) => '<p>' + esc(p) + '</p>').join('') +
      '<h3>How it works</h3><ol>' + t.steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
      '<p style="font-size:.9rem;color:#475569">Also searched as: ' + L.kw.slice(0, 5).map(esc).join(', ') + '.</p>' +
    '</section>' +
    '<section class="faq prose" aria-labelledby="toolFaqHeading">' +
      '<h2 id="toolFaqHeading">Questions people ask</h2>' + faq +
    '</section>' +
    '<section class="prose" id="related-tools" style="margin-top:32px"><h2>Related</h2><ul>' + rel +
      '<li>' + toolLink(L.tool) + ': all options</li></ul></section>' +
    allToolsNav() +
  '</div>';
}

function landingSchema(slug) {
  const L = LANDINGS[slug], t = TOOLS[L.tool], url = SITE + '/' + slug;
  return ldScript([ORG, WEBSITE,
    { '@type': 'WebPage', '@id': url, 'url': url, 'name': L.t.replace(/ \| DocBrisk$/, ''), 'description': L.d,
      'inLanguage': /[\u0900-\u097F]/.test(L.t + L.d) ? 'hi-IN' : 'en-IN', 'keywords': L.kw.join(', '),
      'isPartOf': { '@id': SITE + '/#site' }, 'about': { '@id': SITE + '/tool/' + L.tool + '#app' } },
    { '@type': 'BreadcrumbList', 'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'DocBrisk', 'item': SITE + '/' },
      { '@type': 'ListItem', 'position': 2, 'name': t.t, 'item': SITE + '/tool/' + L.tool },
      { '@type': 'ListItem', 'position': 3, 'name': L.h1, 'item': url }] },
    { '@type': 'FAQPage', 'mainEntity': landingFaq(slug).map((f) => ({
      '@type': 'Question', 'name': f[0], 'acceptedAnswer': { '@type': 'Answer', 'text': f[1] } })) }]);
}

/* ---------- HTML surgery ---------- */

const VIEW_RE = /(<div class="wrap" id="view">)[\s\S]*?(<\/div>)/;
const SEO_BLOCK_RE = /<div id="noscript-seo">[\s\S]*?\n<\/div>/;
const HOME_LD_RE = /<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/;

function toolShell(h1, intro) {
  return '<div class="tool-shell"><div class="tool-head"><h1>' + esc(h1) + '</h1><p>' + esc(intro) + '</p></div></div>';
}

function homeShell(desc) {
  return '<section class="home-hero"><div class="hero-copy"><h1>' + esc(HOME_H1) + '</h1>' +
    '<p class="lead">' + esc(desc) + '</p></div></section>' +
    '<nav aria-label="All tools"><h2>All ' + Object.keys(TOOLS).length + ' tools</h2><ul>' +
    Object.keys(TOOLS).map((s) => '<li>' + toolLink(s) + ' — ' + esc(TOOLS[s].d) + '</li>').join('') +
    '</ul></nav>' +
    '<nav aria-label="Exam photo and signature sizes"><h2>Photo and signature size by exam</h2><ul>' +
    Object.keys(EXAMS).map((s) => '<li><a href="/exam/' + s + '">' + esc(examH1(EXAMS[s])) + '</a></li>').join('') +
    '</ul></nav>' +
    '<nav aria-label="Popular guides"><h2>Popular guides</h2><ul>' +
    Object.keys(LANDINGS).map((s) => '<li><a href="/' + s + '">' + esc(LANDINGS[s].h1) + '</a></li>').join('') +
    '</ul></nav>';
}

/* view: markup placed inside #view (the app replaces it on load; crawlers and
   no-JS visitors read it). about: replaces the hidden fallback block. */
function build(html, { title, desc, url, path, view, about, ld, noindex, keywords }) {
  html = rewriteHead(html, { title, desc, url, path, noindex, keywords });
  if (ld !== undefined) html = html.replace(HOME_LD_RE, () => ld);
  if (view) html = html.replace(VIEW_RE, (m, open, close) => open + view + close);
  html = html.replace(SEO_BLOCK_RE, () => about || '');
  return html;
}

/* ---------- origin + caching ---------- */

async function baseHtml() {
  try {
    const res = await fetch(ORIGIN_HTML, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

async function etagFor(body) {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(body));
  return 'W/"' + Array.from(new Uint8Array(buf)).slice(0, 10).map((b) => b.toString(16).padStart(2, '0')).join('') + '"';
}

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), geolocation=()'
};

function htmlHeaders(etag, noindex) {
  return Object.assign({
    'Content-Type': 'text/html; charset=utf-8',
    // Browsers revalidate after 2 minutes (a cheap 304); the edge keeps a copy for 5.
    'Cache-Control': 'public, max-age=120, stale-while-revalidate=86400',
    'ETag': etag,
    'X-Robots-Tag': noindex ? 'noindex, follow' : 'index, follow',
    // Lets Cloudflare send 103 Early Hints for the font connections.
    'Link': '<https://fonts.googleapis.com>; rel=preconnect, <https://fonts.gstatic.com>; rel=preconnect; crossorigin'
  }, SECURITY_HEADERS);
}

/* Build a page once per BUILD per 5 minutes at each edge location. */
async function servePage(request, ctx, key, make) {
  const cache = caches.default;
  const cacheKey = new Request(SITE + '/__page/' + BUILD + key, { method: 'GET' });
  let res = await cache.match(cacheKey);
  if (!res) {
    const html = await baseHtml();
    if (!html) return unavailable();
    const page = make(html);
    const etag = await etagFor(page.body);
    res = new Response(page.body, { headers: htmlHeaders(etag, page.noindex) });
    const toCache = res.clone();
    toCache.headers.set('Cache-Control', 'public, max-age=300');
    ctx.waitUntil(cache.put(cacheKey, toCache));
  }
  const etag = res.headers.get('ETag');
  const inm = request.headers.get('If-None-Match');
  if (etag && inm && inm.split(/\s*,\s*/).includes(etag)) {
    return new Response(null, { status: 304, headers: { 'ETag': etag, 'Cache-Control': 'public, max-age=120, stale-while-revalidate=86400' } });
  }
  const out = new Response(request.method === 'HEAD' ? null : res.body, { headers: res.headers });
  out.headers.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=86400');
  return out;
}

const unavailable = () => new Response('Temporarily unavailable. Please retry shortly.', {
  status: 503,
  headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '300', 'Cache-Control': 'no-store' }
});

const notFound = () => new Response(
  '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<meta name="robots" content="noindex"><title>Page not found | DocBrisk</title>' +
  '<style>body{font-family:system-ui,sans-serif;background:#eef0f6;color:#171a33;display:grid;place-items:center;min-height:100vh;margin:0;padding:20px}' +
  'main{background:#fff;padding:36px 32px;border-radius:14px;max-width:480px;border:1px solid #e2e8f0}h1{margin:0 0 8px;font-size:1.6rem}' +
  'a{color:#4338ca;font-weight:600}ul{padding-left:18px;line-height:1.9}</style>' +
  '<main><h1>That page doesn\'t exist</h1><p>The link may be old or mistyped. These are the tools people use most:</p><ul>' +
  ['compress-pdf', 'merge-pdf', 'pdf-to-word', 'id-card', 'photo-studio', 'exam-photo', 'cv-studio'].map((s) => '<li>' + toolLink(s) + '</li>').join('') +
  '</ul><p><a href="/">See all ' + Object.keys(TOOLS).length + ' tools</a></p></main></html>',
  { status: 404, headers: Object.assign({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }, SECURITY_HEADERS) });

/* ---------- generated files ---------- */

function sitemap() {
  const urls = [SITE + '/']
    .concat(Object.keys(TOOLS).map((s) => SITE + '/tool/' + s))
    .concat(Object.keys(STATIC_PAGES).map((s) => SITE + '/' + s))
    .concat(Object.keys(EXAMS).map((s) => SITE + '/exam/' + s))
    .concat(Object.keys(LANDINGS).map((s) => SITE + '/' + s));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => '  <url><loc>' + u + '</loc><lastmod>' + LASTMOD + '</lastmod></url>').join('\n') +
    '\n</urlset>\n';
}

function robots() {
  return 'User-agent: *\nAllow: /\n' + PRIVATE_PAGES.map((p) => 'Disallow: /' + p + '\n').join('') +
    '\nSitemap: ' + SITE + '/sitemap.xml\n';
}

function manifest() {
  return JSON.stringify({
    name: 'DocBrisk — Free PDF & Document Tools',
    short_name: 'DocBrisk',
    description: 'Edit, convert, compress, merge and sign PDFs, build a resume or passport photo. Files never leave your device.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f3eee5',
    theme_color: '#4f46e5',
    lang: 'en-IN',
    categories: ['productivity', 'utilities', 'business'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ],
    shortcuts: [
      ['Compress PDF', 'compress-pdf'], ['PDF to Word', 'pdf-to-word'],
      ['Merge PDF', 'merge-pdf'], ['Biodata Maker', 'biodata-maker']
    ].map(([name, slug]) => ({ name, url: '/tool/' + slug, icons: [{ src: '/icon-192.png', sizes: '192x192' }] })),
    // "Share to DocBrisk": on Android and ChromeOS, files shared from WhatsApp,
    // Gallery or Files are posted here; the service worker hands them to the app.
    share_target: {
      action: '/share-target',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: { title: 'title', text: 'text', files: [{ name: 'files', accept: [
        'application/pdf', '.pdf', 'image/jpeg', 'image/png', 'image/webp', '.jpg', '.jpeg', '.png', '.webp',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx', 'text/csv', '.csv'] }] }
    },
    // Installed on a desktop, DocBrisk can be the "Open with" app for these.
    file_handlers: [{
      action: '/',
      accept: {
        'application/pdf': ['.pdf'],
        'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'text/csv': ['.csv']
      }
    }]
  }, null, 1);
}

/* The service worker keeps the app shell and the (versioned) CDN libraries
   on the device, so repeat visits start instantly and most tools work
   offline. It never touches uploads, API calls or payments.
   If anything ever goes wrong with it, set SW_ENABLED = false and deploy:
   every browser will then fetch a worker that deletes its caches and
   unregisters itself. */
function serviceWorker() {
  if (!SW_ENABLED) {
    return `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil((async () => {
  for (const k of await caches.keys()) await caches.delete(k);
  await self.registration.unregister();
  for (const c of await self.clients.matchAll()) c.navigate(c.url);
})()));`;
  }
  return `/* Ad network (monetisation). Keep these lines at the very top.
   Wrapped so a blocked or unreachable ad host can never stop DocBrisk's own worker installing. */
self.options = {
    "domain": "3nbf4.com",
    "zoneId": 11930558
}
self.lary = ""
try { importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw') } catch (e) { /* ad host unreachable */ }
/* End ad network */

/* DocBrisk service worker — build ${BUILD} */
const V = 'docbrisk-${BUILD}';
const PAGES = V + '-pages', LIBS = V + '-libs';
const LIB_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.add('/')).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!k.startsWith(V) && k !== 'docbrisk-share') await caches.delete(k);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method === 'POST' && new URL(req.url).pathname === '/share-target') { e.respondWith(shareTarget(req)); return; }
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' && url.origin === self.location.origin) {
    e.respondWith(page(e));
  } else if (LIB_HOSTS.includes(url.hostname) && /\\.(js|css|woff2?)$/.test(url.pathname)) {
    e.respondWith(lib(req));
  }
});

/* Pages: network first, so people always get the latest version; the saved
   copy is used when offline. Every route is the same app shell. */
async function page(e) {
  const cache = await caches.open(PAGES);
  try {
    const res = (await e.preloadResponse) || (await fetch(e.request));
    if (res && res.ok && res.type === 'basic') cache.put(new URL(e.request.url).pathname, res.clone());
    if (res && res.status >= 500) {
      const saved = await cache.match(new URL(e.request.url).pathname) || await cache.match('/');
      if (saved) return saved;
    }
    return res;
  } catch (err) {
    return (await cache.match(new URL(e.request.url).pathname)) || (await cache.match('/')) ||
      new Response('You are offline and this page has not been saved yet.', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

/* Share to DocBrisk: keep the shared files for a moment in a local cache and
   open the home page, which picks them up (see receiveSharedFiles in the app). */
async function shareTarget(req) {
  try {
    const form = await req.formData();
    const cache = await caches.open('docbrisk-share');
    const files = form.getAll('files').filter((f) => f && typeof f !== 'string');
    await Promise.all(files.map((f, i) => cache.put(new Request('/shared/' + Date.now() + '-' + i),
      new Response(f, { headers: { 'content-type': f.type || 'application/octet-stream', 'x-filename': encodeURIComponent(f.name || 'file') } }))));
  } catch (err) { /* open the app anyway */ }
  return Response.redirect('/?shared=1', 303);
}

/* Libraries: every URL is version-pinned, so a saved copy never goes stale. */
async function lib(req) {
  const cache = await caches.open(LIBS);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  // Opaque (no-CORS) responses cost ~7 MB of quota each in Chrome; skip them.
  if (res.ok && res.type === 'cors') cache.put(req, res.clone());
  return res;
}
`;
}

/* Static files in the repo (images, icons, verification files, .well-known). */
const TYPES = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml',
  ico: 'image/x-icon', gif: 'image/gif', txt: 'text/plain; charset=utf-8', json: 'application/json',
  xml: 'application/xml; charset=utf-8', html: 'text/html; charset=utf-8', pdf: 'application/pdf',
  woff2: 'font/woff2', css: 'text/css; charset=utf-8', js: 'application/javascript; charset=utf-8'
};

async function staticFile(path) {
  const ext = (path.match(/\.([a-z0-9]+)$/i) || [])[1];
  const res = await fetch(REPO_RAW + path, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (res.status === 404) return notFound();
  if (!res.ok) return unavailable();
  const type = TYPES[(ext || '').toLowerCase()] ||
    (path.startsWith('/.well-known/') ? 'application/json' : 'application/octet-stream');
  return new Response(res.body, {
    headers: Object.assign({ 'Content-Type': type, 'Cache-Control': 'public, max-age=86400' }, SECURITY_HEADERS)
  });
}


/* ---------- Excel add-ins: catalogue, downloads, admin uploads, custom requests ----------
   Everything lives in ONE R2 bucket bound to this Worker as  ADDINS :
     _catalog.json                    the add-in list shown on the site
     <slug>/<version>/<file>          installers (old versions are kept for rollback)
     _requests/<time>-<id>.json       custom add-in requests sent from /addins
   Admin: add a Cloudflare SECRET named ADDINS_ADMIN_KEY (24+ random characters) to
   this Worker, open docbrisk.com/admin-addins, paste the key, and add, edit, upload
   or unpublish add-ins there. A new add-in or version needs NO code change.
   ADDIN_DEFAULTS below is only used until the first save from the admin page. */
const ADDIN_DEFAULTS = {
  'smart-dashboard-pro': {
    name: 'Smart Dashboard Pro', tagline: 'A finished KPI dashboard from your data in seconds',
    blurb: 'Select your data and get KPI cards, charts and slicers laid out as a dashboard inside desktop Excel. Works offline.',
    features: ['Suggests KPIs from your columns', 'KPI cards, charts and slicers in one click', 'Works offline in desktop Excel'],
    needs: 'Windows, desktop Excel', free: false, buy: '', ready: false, order: 1,
    version: '', file: '', size: 0, sha256: '', updated: ''
  },
  'nlookup-pack': {
    name: 'NLOOKUP Formula Pack', tagline: 'Lookups without the limits of VLOOKUP',
    blurb: 'Adds a custom NLOOKUP function, plus XLOOKUP and FILTER for Excel versions that do not have them.',
    features: ['NLOOKUP: look left, right, first or nth match', 'XLOOKUP and FILTER for older Excel', 'Works offline in desktop Excel'],
    needs: 'Windows, desktop Excel', free: true, buy: '', ready: false, order: 2,
    version: '', file: '', size: 0, sha256: '', updated: ''
  }
};
const ADDIN_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
const ADDIN_VER_RE = /^[0-9A-Za-z][0-9A-Za-z.+-]{0,23}$/;
const ADDIN_EXT_RE = /\.(exe|msi|zip|xlam|xll)$/i;
const ADDIN_MAX_BYTES = 100 * 1024 * 1024;   // Cloudflare's request-size limit on Free and Pro plans
const CATALOG_KEY = '_catalog.json';

const jsonRes = (obj, status, extra) => new Response(JSON.stringify(obj), {
  status: status || 200,
  headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SECURITY_HEADERS, extra || {})
});

async function readCatalogRaw(env) {
  if (env && env.ADDINS) {
    const o = await env.ADDINS.get(CATALOG_KEY);
    if (o) {
      try { const c = await o.json(); if (c && c.items) return { cat: c, etag: o.etag }; } catch (e) { /* fall back */ }
    }
  }
  return { cat: { items: JSON.parse(JSON.stringify(ADDIN_DEFAULTS)), updated: '' }, etag: null };
}
async function readCatalog(env) {
  try { return (await readCatalogRaw(env)).cat; } catch (e) { return { items: ADDIN_DEFAULTS, updated: '' }; }
}
/* Write only if nobody else saved in between (two admin tabs, for example). */
async function writeCatalog(env, cat, etag) {
  cat.updated = new Date().toISOString();
  const body = JSON.stringify(cat);
  const opts = { httpMetadata: { contentType: 'application/json' } };
  if (etag) opts.onlyIf = { etagMatches: etag };
  const res = await env.ADDINS.put(CATALOG_KEY, body, opts);
  return !!res;
}

function sortedSlugs(items) {
  return Object.keys(items).sort((a, b) => ((items[a].order || 99) - (items[b].order || 99)) || a.localeCompare(b));
}
function publicAddin(slug, a, env) {
  const downloadable = !!(a.ready && a.free && a.file && env && env.ADDINS);
  return {
    slug, name: a.name || slug, tagline: a.tagline || '', blurb: a.blurb || '',
    features: Array.isArray(a.features) ? a.features : [], needs: a.needs || '',
    free: !!a.free, ready: !!a.ready, buy: a.ready && !a.free ? (a.buy || '') : '',
    version: a.version || '', size: a.size || 0, sha256: downloadable ? (a.sha256 || '') : '',
    updated: a.updated || '', downloadable,
    fileName: downloadable ? a.file.split('/').pop() : ''
  };
}

async function addinsJson(env) {
  const cat = await readCatalog(env);
  const list = sortedSlugs(cat.items).filter((s) => cat.items[s].listed !== false).map((s) => publicAddin(s, cat.items[s], env));
  return new Response(JSON.stringify({ addins: list, updated: cat.updated || '' }), {
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' }, SECURITY_HEADERS)
  });
}

/* Downloads stream straight from R2. Range requests are supported, so download
   managers and resumed downloads work. */
async function addinDownload(request, slug, env) {
  if (!env || !env.ADDINS) return unavailable();
  const cat = await readCatalog(env);
  const a = cat.items[slug];
  if (!a || a.listed === false || !a.ready || !a.free || !a.file) return notFound();
  const fname = a.file.split('/').pop().replace(/[^A-Za-z0-9._-]/g, '_');
  const base = Object.assign({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename="' + fname + '"',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=300',
    'X-Download-Options': 'noopen'
  }, SECURITY_HEADERS);
  if (request.method === 'HEAD') {
    const h = await env.ADDINS.head(a.file);
    if (!h) return notFound();
    return new Response(null, { headers: Object.assign({}, base, { 'Content-Length': String(h.size), 'ETag': h.httpEtag }) });
  }
  const wantsRange = request.headers.has('Range');
  const obj = await env.ADDINS.get(a.file, wantsRange ? { range: request.headers } : undefined);
  if (!obj) return notFound();
  const headers = Object.assign({}, base, { 'ETag': obj.httpEtag });
  if (wantsRange && obj.range && typeof obj.range.offset === 'number') {
    const start = obj.range.offset, len = obj.range.length != null ? obj.range.length : obj.size - start;
    headers['Content-Range'] = 'bytes ' + start + '-' + (start + len - 1) + '/' + obj.size;
    headers['Content-Length'] = String(len);
    return new Response(obj.body, { status: 206, headers });
  }
  headers['Content-Length'] = String(obj.size);
  return new Response(obj.body, { headers });
}

/* ---------- admin ---------- */
async function isAddinAdmin(request, env) {
  const want = env && env.ADDINS_ADMIN_KEY ? String(env.ADDINS_ADMIN_KEY) : '';
  if (want.length < 24) return false;
  const got = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!got) return false;
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest('SHA-256', enc.encode(got)), crypto.subtle.digest('SHA-256', enc.encode(want))]);
  const a = new Uint8Array(x), b = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const clip = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

function cleanAddinMeta(input, prev) {
  const p = prev || {};
  const out = Object.assign({}, p);
  out.name = clip(input.name, 60) || p.name || '';
  out.tagline = clip(input.tagline, 90);
  out.blurb = clip(input.blurb, 400);
  out.features = (Array.isArray(input.features) ? input.features : String(input.features || '').split('\n'))
    .map((f) => clip(f, 90)).filter(Boolean).slice(0, 8);
  out.needs = clip(input.needs, 120);
  out.free = !!input.free;
  const buy = clip(input.buy, 300);
  out.buy = /^https:\/\/[^\s"'<>]+$/i.test(buy) ? buy : '';
  out.order = Math.max(1, Math.min(999, parseInt(input.order, 10) || p.order || 50));
  out.ready = !!input.ready;
  out.listed = input.listed === undefined ? p.listed !== false : !!input.listed;
  ['version', 'file', 'size', 'sha256', 'updated'].forEach((k) => { if (out[k] === undefined) out[k] = k === 'size' ? 0 : ''; });
  return out;
}

async function listRequests(env) {
  const out = [];
  const listed = await env.ADDINS.list({ prefix: '_requests/', limit: 200 });
  const keys = listed.objects.map((o) => o.key).sort().reverse().slice(0, 100);
  await Promise.all(keys.map(async (k) => {
    const o = await env.ADDINS.get(k);
    if (o) { try { out.push(Object.assign({ id: k.slice('_requests/'.length, -5) }, await o.json())); } catch (e) { /* skip */ } }
  }));
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

/* ---------- public: custom add-in request ---------- */
async function addinRequest(request, env, ctx) {
  if (request.headers.get('Origin') !== SITE) return jsonRes({ error: 'Not allowed.' }, 403);
  if (!/^application\/json/i.test(request.headers.get('Content-Type') || '')) return jsonRes({ error: 'Send JSON.' }, 415);
  if (+(request.headers.get('Content-Length') || 0) > 8000) return jsonRes({ error: 'That message is too long.' }, 413);
  let b;
  try { b = await request.json(); } catch (e) { return jsonRes({ error: 'Could not read the form.' }, 400); }
  if (b && b.website) return jsonRes({ ok: true });            // honeypot: bots fill every field
  const name = clip(b.name, 80), contact = clip(b.contact, 120), need = clip(b.need, 2000);
  if (name.length < 2) return jsonRes({ error: 'Please enter your name.' }, 400);
  const phone = contact.replace(/[\s()+-]/g, '');
  if (!/^\d{10,13}$/.test(phone) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    return jsonRes({ error: 'Please enter a valid mobile number or email.' }, 400);
  }
  if (need.length < 15) return jsonRes({ error: 'Please describe what the add-in should do (a sentence or two).' }, 400);
  // One request per minute per visitor, per Cloudflare location. The IP is not stored.
  const ip = request.headers.get('CF-Connecting-IP') || 'x';
  const rlKey = new Request(SITE + '/__rl/addin-request/' + encodeURIComponent(ip));
  if (await caches.default.match(rlKey)) return jsonRes({ error: 'Request already received. Please wait a minute before sending another.' }, 429);
  ctx.waitUntil(caches.default.put(rlKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=60' } })));
  const at = new Date().toISOString();
  const id = at.replace(/[^0-9]/g, '').slice(0, 14) + '-' + crypto.randomUUID().slice(0, 8);
  await env.ADDINS.put('_requests/' + id + '.json', JSON.stringify({
    at, name, contact, need, addin: clip(b.addin, 40), country: (request.cf && request.cf.country) || ''
  }), { httpMetadata: { contentType: 'application/json' } });
  return jsonRes({ ok: true });
}

async function addinsApi(request, env, ctx, url) {
  if (!env || !env.ADDINS) return jsonRes({ error: 'Add-in storage is not connected. Bind the R2 bucket as ADDINS.' }, 503);
  const p = url.pathname, m = request.method;
  if (p === '/api/addins/request' && m === 'POST') return addinRequest(request, env, ctx);

  // Everything below is admin-only.
  if (!(await isAddinAdmin(request, env))) {
    const k = env.ADDINS_ADMIN_KEY ? String(env.ADDINS_ADMIN_KEY) : '';
    return jsonRes({ error: !k ? 'Set the ADDINS_ADMIN_KEY secret on the docbrisk-seo Worker first.'
      : k.length < 24 ? 'ADDINS_ADMIN_KEY must be at least 24 characters. Set a longer one.' : 'Wrong admin key.' }, 401);
  }
  if (m !== 'GET') {
    const origin = request.headers.get('Origin');
    if (origin && origin !== SITE) return jsonRes({ error: 'Not allowed.' }, 403);
  }

  if (p === '/api/addins/admin' && m === 'GET') {
    const [{ cat }, requests] = await Promise.all([readCatalogRaw(env), listRequests(env)]);
    return jsonRes({ items: cat.items, order: sortedSlugs(cat.items), updated: cat.updated || '', requests });
  }

  const item = p.match(/^\/api\/addins\/item\/([a-z0-9-]+)$/);
  if (item) {
    const slug = item[1];
    if (!ADDIN_SLUG_RE.test(slug)) return jsonRes({ error: 'Use 2 to 40 lowercase letters, numbers and dashes for the ID.' }, 400);
    const { cat, etag } = await readCatalogRaw(env);
    if (m === 'PUT') {
      let b;
      try { b = await request.json(); } catch (e) { return jsonRes({ error: 'Could not read the form.' }, 400); }
      const next = cleanAddinMeta(b || {}, cat.items[slug]);
      if (!next.name) return jsonRes({ error: 'Name is required.' }, 400);
      if (next.ready && next.free && !next.file) return jsonRes({ error: 'Upload the installer before publishing a free add-in.' }, 400);
      if (next.ready && !next.free && !next.buy) return jsonRes({ error: 'Add the https:// buy link before publishing a paid add-in.' }, 400);
      cat.items[slug] = next;
      if (!(await writeCatalog(env, cat, etag))) return jsonRes({ error: 'Someone saved at the same time. Reload and try again.' }, 409);
      return jsonRes({ ok: true, item: next });
    }
    if (m === 'DELETE') {
      if (!cat.items[slug]) return jsonRes({ error: 'Not found.' }, 404);
      delete cat.items[slug];
      if (!(await writeCatalog(env, cat, etag))) return jsonRes({ error: 'Someone saved at the same time. Reload and try again.' }, 409);
      if (url.searchParams.get('files') === '1') {
        let cursor;
        do {
          const l = await env.ADDINS.list({ prefix: slug + '/', cursor });
          if (l.objects.length) await env.ADDINS.delete(l.objects.map((o) => o.key));
          cursor = l.truncated ? l.cursor : undefined;
        } while (cursor);
      }
      return jsonRes({ ok: true });
    }
  }

  const file = p.match(/^\/api\/addins\/file\/([a-z0-9-]+)$/);
  if (file && m === 'PUT') {
    const slug = file[1];
    const version = clip(url.searchParams.get('version'), 24);
    const name = clip(url.searchParams.get('name'), 120).replace(/[^A-Za-z0-9._-]/g, '_');
    const sha = clip(url.searchParams.get('sha256'), 64).toLowerCase();
    const len = +(request.headers.get('Content-Length') || 0);
    if (!ADDIN_SLUG_RE.test(slug)) return jsonRes({ error: 'Bad add-in ID.' }, 400);
    if (!ADDIN_VER_RE.test(version)) return jsonRes({ error: 'Enter a version like 1.0.0.' }, 400);
    if (!ADDIN_EXT_RE.test(name)) return jsonRes({ error: 'Allowed file types: .exe, .msi, .zip, .xlam, .xll' }, 400);
    if (!/^[0-9a-f]{64}$/.test(sha)) return jsonRes({ error: 'Missing file checksum.' }, 400);
    if (!len || len > ADDIN_MAX_BYTES) return jsonRes({ error: 'Files must be under 100 MB.' }, 413);
    const { cat } = await readCatalogRaw(env);
    if (!cat.items[slug]) return jsonRes({ error: 'Save the add-in details first, then upload the file.' }, 404);
    const key = slug + '/' + version + '/' + name;
    let obj;
    try {
      // R2 recomputes SHA-256 and rejects the upload if a single byte differs.
      obj = await env.ADDINS.put(key, request.body, {
        sha256: sha,
        httpMetadata: { contentType: 'application/octet-stream', contentDisposition: 'attachment; filename="' + name + '"' },
        customMetadata: { sha256: sha, version }
      });
    } catch (e) {
      return jsonRes({ error: 'Upload failed the integrity check or was interrupted. Please try again.' }, 422);
    }
    // Re-read the catalogue after the (possibly long) upload so no other edit is lost.
    const fresh = await readCatalogRaw(env);
    const it = fresh.cat.items[slug];
    if (!it) return jsonRes({ error: 'The add-in was deleted during the upload.' }, 409);
    Object.assign(it, { version, file: key, size: obj.size, sha256: sha, updated: new Date().toISOString().slice(0, 10) });
    if (!(await writeCatalog(env, fresh.cat, fresh.etag))) return jsonRes({ error: 'Uploaded, but the list changed at the same time. Reload and upload again.' }, 409);
    return jsonRes({ ok: true, item: it });
  }

  const reqDel = p.match(/^\/api\/addins\/request\/([0-9a-f-]{10,40})$/);
  if (reqDel && m === 'DELETE') {
    await env.ADDINS.delete('_requests/' + reqDel[1] + '.json');
    return jsonRes({ ok: true });
  }
  return jsonRes({ error: 'Not found.' }, 404);
}

/* ---------- /addins page: server-rendered list and structured data ---------- */
function addinsSeoHtml(cat) {
  const items = sortedSlugs(cat.items).filter((k) => cat.items[k].listed !== false).map((k) => {
    const a = cat.items[k];
    return '<li><strong>' + esc(a.name) + '</strong>' + (a.tagline ? ': ' + esc(a.tagline) : '') + '. ' + esc(a.blurb || '') + '</li>';
  }).join('');
  return '<div class="ax-ssr"><h2>DocBrisk Excel add-ins</h2><ul>' + items + '</ul>' +
    '<p>Add-ins install into desktop Excel on your own computer and work on your workbook there. Every free download lists a SHA-256 checksum. Custom Excel add-ins and automation can be built on request.</p></div>';
}
function addinsSchema(cat) {
  const url = SITE + '/addins';
  const apps = sortedSlugs(cat.items).filter((k) => cat.items[k].ready && cat.items[k].listed !== false).map((k) => {
    const a = cat.items[k];
    const app = { '@type': 'SoftwareApplication', 'name': a.name, 'description': a.blurb || a.tagline || '',
      'applicationCategory': 'BusinessApplication', 'operatingSystem': 'Windows', 'url': url + '#' + k,
      'publisher': { '@id': SITE + '/#org' } };
    if (a.version) app.softwareVersion = a.version;
    if (a.free) app.offers = { '@type': 'Offer', 'price': '0', 'priceCurrency': 'INR' };
    return app;
  });
  return ldScript([ORG, WEBSITE,
    { '@type': 'CollectionPage', '@id': url, 'url': url, 'name': 'Excel Add-ins', 'isPartOf': { '@id': SITE + '/#site' } },
    { '@type': 'BreadcrumbList', 'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'DocBrisk', 'item': SITE + '/' },
      { '@type': 'ListItem', 'position': 2, 'name': 'Excel Add-ins', 'item': url }] }].concat(apps));
}

const redirect = (to) => new Response(null, { status: 301, headers: { Location: to, 'Cache-Control': 'public, max-age=86400' } });

export default {
  async fetch(request, env, ctx) {
    // A share that arrives before the service worker is active still opens the app.
    if (request.method === 'POST' && new URL(request.url).pathname === '/share-target') {
      return new Response(null, { status: 303, headers: { Location: '/?shared=1', 'Cache-Control': 'no-store' } });
    }
    if (new URL(request.url).pathname.startsWith('/api/addins/')) return addinsApi(request, env, ctx, new URL(request.url));
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    const url = new URL(request.url);

    // One canonical host, one canonical form of every path.
    if (url.hostname === 'www.docbrisk.com') return redirect(SITE + url.pathname + url.search);
    if (url.pathname === '/index.html') return redirect(SITE + '/' + url.search);
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      return redirect(SITE + url.pathname.replace(/\/+$/, '') + url.search);
    }
    const path = url.pathname;

    if (path === '/sitemap.xml') {
      return new Response(sitemap(), {
        headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
    }
    if (path === '/robots.txt') {
      return new Response(robots(), { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
    }
    if (path === '/manifest.webmanifest') {
      return new Response(manifest(), {
        headers: { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
      });
    }
    if (path === '/sw.js') {
      return new Response(serviceWorker(), {
        headers: { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-cache', 'Service-Worker-Allowed': '/' }
      });
    }

    if (path === '/addins.json') return addinsJson(env);
    const dl = path.match(/^\/download\/([a-z0-9-]+)$/);
    if (dl) return addinDownload(request, dl[1], env);

    if (path === '/') {
      return servePage(request, ctx, '/', (html) => {
        const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
        // Keep the homepage head and JSON-LD as they are in index.html; add a
        // visible H1 and tool list for anything that doesn't run JavaScript,
        // and drop the hidden duplicate.
        return { body: build(html, {
          title: ((html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || 'DocBrisk').replace(/&amp;/g, '&'),
          desc: desc.replace(/&amp;/g, '&'), url: SITE + '/', path: '/', view: homeShell(desc.replace(/&amp;/g, '&'))
        }) };
      });
    }

    const toolMatch = path.match(/^\/tool\/([a-z0-9-]+)$/);
    if (toolMatch && TOOLS[toolMatch[1]]) {
      const slug = toolMatch[1];
      const t = TOOLS[slug];
      return servePage(request, ctx, path, (html) => ({ body: build(html, {
        title: titleFor(t), desc: clampDesc(t.d), url: SITE + path, path, keywords: (KW[slug] || []).join(', '),
        view: toolShell(t.t, t.d), about: toolAboutHtml(slug), ld: toolSchema(slug)
      }) }));
    }

    const examMatch = path.match(/^\/exam\/([a-z0-9-]+)$/);
    if (examMatch && EXAMS[examMatch[1]]) {
      const e = EXAMS[examMatch[1]];
      return servePage(request, ctx, path, (html) => ({ body: build(html, {
        title: examTitle(e), desc: examDesc(e), url: SITE + path, path, keywords: e.kw.join(', '),
        view: toolShell(examH1(e), examDesc(e)), about: examAboutHtml(examMatch[1]), ld: examSchema(examMatch[1])
      }) }));
    }

    const slug = path.slice(1);
    if (STATIC_PAGES[slug]) {
      const [title, desc, h1] = STATIC_PAGES[slug];
      const cat = slug === 'addins' ? await readCatalog(env) : null;
      return servePage(request, ctx, path, (html) => ({ body: build(html, {
        title, desc, url: SITE + path, path, view: toolShell(h1, desc),
        about: '<div id="seo-about" class="wrap">' + (cat ? addinsSeoHtml(cat) : '') + allToolsNav() + '</div>',
        ld: cat ? addinsSchema(cat) : staticSchema(slug, h1)
      }) }));
    }

    if (LANDINGS[slug]) {
      const L = LANDINGS[slug];
      return servePage(request, ctx, path, (html) => ({ body: build(html, {
        title: L.t, desc: clampDesc(L.d), url: SITE + path, path, keywords: L.kw.join(', '),
        view: toolShell(L.h1, L.lead), about: landingAboutHtml(slug), ld: landingSchema(slug)
      }) }));
    }
    if (REDIRECTS[path]) return redirect(SITE + REDIRECTS[path]);

    if (PRIVATE_PAGES.includes(slug)) {
      return servePage(request, ctx, path, (html) => ({ noindex: true, body: build(html, {
        title: 'DocBrisk', desc: 'DocBrisk', url: SITE + path, path, noindex: true, ld: ''
      }) }));
    }

    if (/\.[a-z0-9]{2,5}$/i.test(path) || path.startsWith('/.well-known/')) {
      if (/^\/(?:\.git|\.env|node_modules)/.test(path)) return notFound();
      return staticFile(path);
    }

    return notFound();
  }
};
