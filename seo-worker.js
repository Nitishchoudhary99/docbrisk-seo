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

   ROUTES: point  docbrisk.com/*  and  www.docbrisk.com/*  at this Worker
   (Workers → docbrisk-seo → Settings → Domains & Routes). Nothing else needs
   to serve the domain. See the note at SW_ENABLED if offline mode ever
   misbehaves.
   ========================================================================== */

const REPO_RAW = 'https://raw.githubusercontent.com/Nitishchoudhary99/My-website/main';
const ORIGIN_HTML = REPO_RAW + '/index.html';

const SITE = 'https://docbrisk.com';
const LASTMOD = '2026-09-24';          // bump when page content changes
const BUILD = '2026-09-24a';              // bump on every deploy of this Worker
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
  "st": "Aadhaar Card Print Front and Back on One Page"
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
  "st": "Compress PDF to 100KB, 200KB or Any Size — Free"
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
  "st": "Translate PDF to Hindi, English & 33 Languages"
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
  "st": "Remove PDF Password: Unlock e-Aadhaar & Bank PDFs"
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
  "st": "Free QR Code Generator — UPI, Wi-Fi, vCard"
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
  "d": "Convert .docx documents into clean, shareable PDF files with preserved paragraph flow.",
  "l": "Convert .docx documents into clean, shareable PDF files with preserved paragraph flow.",
  "steps": [
   "Add a .docx file.",
   "Paragraph flow is preserved during conversion.",
   "Download the PDF."
  ],
  "use": "Use it to send a Word document in a format that looks the same everywhere.",
  "faq": [],
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

const GROUPS = [["photo-studio", "exam-photo", "doc-scanner", "id-card", "cv-studio", "ocr-pdf", "image-to-pdf"], ["pdf-editor", "sign-pdf", "redact-pdf", "smart-redact", "clean-metadata", "unlock-pdf", "protect-pdf", "watermark-pdf", "remove-watermark", "number-pdf", "doc-integrity"], ["merge-pdf", "split-by-size", "organize-pdf", "compress-pdf", "resize-pdf", "impose-pdf", "clean-scan", "batch-process", "compare-pdf"], ["pdf-to-word", "word-to-pdf", "pdf-to-excel", "extract-tables", "sheet-to-pdf", "pdf-to-image", "image-to-pdf", "pdf-to-ppt", "extract-images", "translate-pdf", "ocr-pdf"], ["qr-maker", "qr-stamp", "invoice-maker", "mail-merge", "sheet-to-pdf"]];

const FREE_COUNT = Object.values(TOOLS).filter((t) => !t.pro).length;
const PRO_COUNT = Object.keys(TOOLS).length - FREE_COUNT;
// Pro tools every free account can try (counted per account by docbrisk-api).
const TRIALS = { 'ocr-pdf': 3, 'mail-merge': 3 };

const STATIC_PAGES = {
  'privacy':  ['Privacy Policy | DocBrisk', 'How DocBrisk handles your documents: everything is processed in your browser and nothing is uploaded.', 'Privacy Policy'],
  'about':    ['About DocBrisk', 'Why DocBrisk processes documents entirely in the browser, and who builds it.', 'About DocBrisk'],
  'terms':    ['Terms of Use | DocBrisk', 'The terms that apply when you use the free document tools on DocBrisk.', 'Terms of Use'],
  'pricing':  ['Pricing — Free Tools and DocBrisk Pro', FREE_COUNT + ' tools are free with no limits. DocBrisk Pro adds ' + PRO_COUNT + ' advanced tools and 20 extra resume templates for ₹' + PRO_PRICE + ' a month.', 'Pricing'],
  'security': ['Security | DocBrisk', 'How DocBrisk keeps your documents and your account secure.', 'Security']
};
// App screens that must load but never be indexed.
const PRIVATE_PAGES = ['admin', 'diagnostics'];

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
    .concat(Object.keys(EXAMS).map((s) => SITE + '/exam/' + s));
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
    background_color: '#eef0f6',
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
      ['Merge PDF', 'merge-pdf'], ['Resume builder', 'cv-studio']
    ].map(([name, slug]) => ({ name, url: '/tool/' + slug, icons: [{ src: '/icon-192.png', sizes: '192x192' }] })),
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
  return `/* DocBrisk service worker — build ${BUILD} */
const V = 'docbrisk-${BUILD}';
const PAGES = V + '-pages', LIBS = V + '-libs';
const LIB_HOSTS = ['cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.add('/')).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (!k.startsWith(V)) await caches.delete(k);
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
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

const redirect = (to) => new Response(null, { status: 301, headers: { Location: to, 'Cache-Control': 'public, max-age=86400' } });

export default {
  async fetch(request, env, ctx) {
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
      return servePage(request, ctx, path, (html) => ({ body: build(html, {
        title, desc, url: SITE + path, path, view: toolShell(h1, desc),
        about: '<div id="seo-about" class="wrap">' + allToolsNav() + '</div>', ld: staticSchema(slug, h1)
      }) }));
    }

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
