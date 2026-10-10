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

   v4.5 (2026-10-01): Excel add-ins. /addins page, /download/<slug>, the
   private /admin-addins page and its API under /addins-api/ (old /api/addins/
   paths still work), custom add-in requests, and /addins-api/status, which
   reports whether storage and the admin key are set up. Needs storage (a free
   KV namespace bound as ADDINS_KV, or an R2 bucket bound as ADDINS) and a
   secret ADDINS_ADMIN_KEY; see the add-ins section.

   v4.6 (2026-10-07): eight new tools (Image Compressor, GST Calculator, Age
   Calculator, Salary Slip, Rent Receipt, PAN & Aadhaar Validator, Amount in
   Words, CGPA Calculator); 48 more landing pages (image sizes in KB and
   cm, bank, TC and HR letter formats, biodata in Marathi and Gujarati, GST
   state codes with a table, page jobs); long-form guides with a Hindi
   section for eight more tools; a /guides hub; and a server-rendered shell
   that reserves the tool's space, so the guide below it no longer jumps when
   the app starts (layout shift).

   ROUTES: point  docbrisk.com/*  and  www.docbrisk.com/*  at this Worker
   (Workers → docbrisk-seo → Settings → Domains & Routes). Nothing else needs
   to serve the domain. See the note at SW_ENABLED if offline mode ever
   misbehaves.
   ========================================================================== */

const REPO_RAW = 'https://raw.githubusercontent.com/Nitishchoudhary99/My-website/main';
const ORIGIN_HTML = REPO_RAW + '/index.html';

const SITE = 'https://docbrisk.com';
const LASTMOD = '2026-10-10';          // bump when page content changes
const BUILD = '2026-10-10c';              // bump on every deploy of this Worker
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
  "d": "Turn scans and phone photos into a searchable PDF that looks identical, or an editable Word file. Straightens tilted pages and cleans up faint or shadowed scans, on your device. 3 free uses.",
  "l": "Recognise the text in scans, phone photos and image-only PDFs. Get a searchable PDF that looks exactly like the original, with text you can select, search and copy; or an editable Word file where logos, photos and layout stay in place. Built for real-world scans: tilted pages are straightened, faded text is boosted, and pages with shadows or uneven lighting are cleaned up and read again automatically. Long PDFs are read one page at a time (two at once on capable devices), so they work on phones too. Everything runs on your device; nothing is uploaded. Phone photos of a page lying on a table are found and flattened into a straight scan, two-column pages and side-by-side blocks are read in the right order, and lines the engine skips on a first pass are found and read again. Searchable PDF and Word output work in every supported language, Hindi included.",
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
    "Does it work on blurry, faded, tilted or shadowed scans?",
    "Yes. Before reading, DocBrisk straightens pages tilted by up to about 6 degrees and boosts faded text. If a page still reads poorly, it removes shadows and uneven lighting and reads the page again, keeping whichever reading is more confident. The result tells you which pages were fixed."
   ],
   [
    "Can it handle long PDFs on a phone?",
    "Yes. Pages are read one at a time and cleared from memory as soon as they are done, so a long document needs memory for a page or two, not the whole file. On devices with enough memory, two pages are read at once to finish sooner."
   ],
   [
    "Are my documents uploaded?",
    "No. Recognition runs in your browser on your own device. Only the language pack is downloaded, once, and then it works offline."
   ],
   [
    "Which languages are supported?",
    "16 languages including Hindi, Bengali, Tamil, Telugu, Arabic and Chinese, plus a Hindi + English option for documents that mix both. Every language gets all three outputs: plain text, a searchable PDF whose text can be copied and searched, and an editable Word file."
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
  "d": "Make GST tax invoices, quotations and proformas with per-item GST rates, auto IGST, logo, signature, bank details, amount in words and a UPI QR.",
  "l": "Build a professional tax invoice, quotation, proforma, estimate, bill of supply, credit note or delivery challan. Each line has its own HSN or SAC code, unit and GST rate, so mixed 5%, 12% and 18% items are taxed correctly, and the CGST and SGST or IGST split is chosen automatically from the seller's and buyer's GSTINs, with the place of supply. Add your logo, a signature or stamp, bank details for NEFT and IMPS, shipping charges, round-off, the amount in words and a tax summary by HSN, plus a scannable UPI QR carrying the exact total. Long invoices continue onto more pages, clients can be saved for next time, and the line items export to Excel.",
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

/* ---------- v4.6: eight more tools ---------- */
Object.assign(TOOLS, {
 "image-compressor": {
  "t": "Image Compressor: Reduce Photo Size in KB",
  "d": "Compress JPG, PNG or WebP to 20 KB, 50 KB, 100 KB or any size. Resize in pixels or cm, convert the format, many photos at once. Free, nothing uploaded.",
  "l": "Reduce a photo to an exact size in KB without sending it anywhere. Type the limit your form gives, such as 20 KB, 50 KB, 100 KB or 200 KB, and the compressor finds the best quality that fits. It can also hold a minimum size, resize to exact pixels or to centimetres at a chosen DPI, crop to a new shape without stretching, and convert between JPG, PNG and WebP. Add many photos together and download them as one ZIP.",
  "steps": [
   "Choose one or more photos from your phone or computer.",
   "Type the size you need in KB, or tap 20, 50, 100 or 200 KB. Set the pixel or centimetre size if the form asks for one.",
   "Press Compress and download each image, or all of them as a ZIP."
  ],
  "use": "Useful for job and exam forms, scholarship and admission portals, KYC uploads, email attachments and websites that need small images.",
  "faq": [
   [
    "How do I reduce a photo to 50 KB?",
    "Add the photo, tap 50 KB and press Compress. The tool lowers JPG quality first and makes the picture smaller only if quality alone cannot reach 50 KB."
   ],
   [
    "Can I keep the file between two sizes, like 20 KB to 50 KB?",
    "Yes. Fill in \"Not smaller than\" as well. If the JPG comes out below the minimum it is padded inside the file, so the picture itself does not change."
   ],
   [
    "Can I resize a photo in centimetres?",
    "Yes. Choose \"Size in centimetres\", type the width and height, for example 3.5 × 4.5 cm, and pick the DPI. The pixel size is worked out for you."
   ],
   [
    "Why is my PNG still large?",
    "PNG keeps every pixel exactly, so lowering quality does not shrink it. Choose JPG for photos, and keep PNG for logos and screenshots that need a transparent background."
   ],
   [
    "Does compressing change the pixel size?",
    "Only when it has to. Quality is lowered first. If the target is still out of reach, the picture is scaled down a little at a time and the result shows the final pixel size. When you ask for an exact pixel size, that size is kept."
   ]
  ],
  "st": "Image Compressor: Reduce Photo Size in KB Online"
 },
 "gst-calculator": {
  "t": "GST Calculator: Add or Remove GST",
  "d": "Free GST calculator for India: add GST to a price or remove it from a total. Shows CGST, SGST or IGST, the taxable value and the total in words.",
  "l": "Work out GST in either direction. Enter a price before tax to add GST, or a final price to find how much of it is tax. The result shows the taxable value, the tax split into CGST and SGST for a sale within the state or IGST for a sale to another state, and the total written in words for your invoice. The current 5%, 18% and 40% slabs are one tap away, the older 12% and 28% rates are there for earlier bills, and any other rate can be typed in.",
  "steps": [
   "Enter the amount.",
   "Choose \"Before GST\" to add tax or \"Including GST\" to remove it, then pick the rate.",
   "Read the taxable value, CGST and SGST or IGST, and the total. Copy the result if you need it."
  ],
  "use": "Handy for shopkeepers, freelancers, accountants and anyone checking a bill or quoting a price.",
  "faq": [
   [
    "How do I calculate GST on an amount?",
    "GST = amount × rate ÷ 100. On ₹1,000 at 18% the GST is ₹180 and the total is ₹1,180. For a sale within the state it is split equally into CGST ₹90 and SGST ₹90."
   ],
   [
    "How do I remove GST from a total?",
    "Taxable value = total ÷ (1 + rate ÷ 100). A total of ₹1,180 at 18% is ₹1,000 before tax and ₹180 of GST. Choose \"Including GST\" to do this."
   ],
   [
    "What are the GST rates now?",
    "Since 22 September 2025 most goods and services are taxed at 5% or 18%, with 40% on a short list of luxury and sin goods and special rates such as 3% on gold. The rate depends on the HSN or SAC code, so confirm it before billing."
   ],
   [
    "What is the difference between CGST, SGST and IGST?",
    "For a sale within one state the tax is split equally between the centre (CGST) and the state (SGST). For a sale to another state the whole tax is charged as IGST. The total tax is the same."
   ],
   [
    "Is 18% of the total the same as the GST inside it?",
    "No. 18% of ₹1,180 is ₹212.40, but the GST inside ₹1,180 is ₹180, because the tax was charged on ₹1,000. Divide by 1.18 to find the price before tax."
   ]
  ],
  "st": "GST Calculator: Add or Remove GST Online, Free",
  "calc": true
 },
 "age-calculator": {
  "t": "Age Calculator: Exact Age as on a Date",
  "d": "Calculate exact age in years, months and days as on any cut-off date. Check SSC, UPSC, Railway and bank exam age limits with relaxation. Free.",
  "l": "Work out an exact age in completed years, months and days between a date of birth and any other date. For exam and job forms, enter the cut-off date from the notification and the minimum and maximum age, add any category relaxation, and see at once whether the date of birth is inside the limit, along with the eligible date-of-birth range to compare with the notice. It also shows the age in months, weeks and days, the weekday of birth and the next birthday.",
  "steps": [
   "Enter your date of birth.",
   "Keep today, or enter the \"as on\" date printed in the notification.",
   "To check eligibility, open the age limit section and enter the minimum age, maximum age and relaxation."
  ],
  "use": "Built for recruitment and entrance exam forms, school admissions, retirement dates and anyone who needs an exact age.",
  "faq": [
   [
    "How do I calculate age as on a cut-off date?",
    "Enter your date of birth and the cut-off date printed in the notification, for example 1 August 2026. The result is the completed years, months and days between the two dates."
   ],
   [
    "How is the upper age limit counted?",
    "Most central government notices say a candidate must not have attained the maximum age on the cut-off date. For a limit of 27 years you are eligible until the day before your 27th birthday. The date-of-birth range printed in the notice is final."
   ],
   [
    "How much age relaxation do OBC, SC and ST candidates get?",
    "It depends on the exam. Many central government exams give 3 years to OBC (non-creamy layer), 5 years to SC and ST and 10 years to PwBD candidates. Enter the years from your notification in the Relaxation box."
   ],
   [
    "Which date of birth should I use for a government form?",
    "The one printed on your Class 10 (matriculation) certificate. Commissions check it at document verification."
   ],
   [
    "Does the calculator count the day of birth?",
    "It counts completed time. A person born on 1 August 2008 completes 18 years on 1 August 2026, so on that day the age shown is exactly 18 years, 0 months, 0 days."
   ]
  ],
  "st": "Age Calculator: Age as on Date for Exam Forms",
  "calc": true
 },
 "salary-slip": {
  "t": "Salary Slip Generator (Payslip Maker)",
  "d": "Create a salary slip online: basic, HRA, allowances, PF, professional tax and TDS, with net pay in words. Download an A4 PDF. Free, no sign-up.",
  "l": "Build a monthly salary slip in a couple of minutes. Enter the company and employee details once, list the earnings such as basic pay, HRA and allowances, and the deductions such as provident fund, professional tax and TDS. Totals and net pay are added up as you type and the net amount is written in words. Every row can be renamed, removed or added, and the result downloads as a clean A4 PDF. Details stay on your device, so next month only the month and any changed amounts need editing.",
  "steps": [
   "Enter the company name, the salary month and the employee details.",
   "Fill in the earnings and deductions. Add, rename or remove any row.",
   "Check the net pay and download the PDF."
  ],
  "use": "Made for small businesses, shops, schools, clinics and households that pay staff without payroll software.",
  "faq": [
   [
    "What does a salary slip contain?",
    "The company name, the pay month, employee details such as ID, designation, PAN and UAN, the earnings (basic, HRA, allowances), the deductions (PF, professional tax, TDS) and the net pay in figures and words."
   ],
   [
    "How is net pay calculated?",
    "Net pay = total earnings − total deductions. The slip adds both columns for you and writes the net amount in words."
   ],
   [
    "Who should issue a salary slip?",
    "The employer. This tool is meant for small businesses, shops, schools and other employers without payroll software. A slip must show salary that was actually paid."
   ],
   [
    "Can I add my own earning or deduction heads?",
    "Yes. Use \"Add an earning\" or \"Add a deduction\", and type any name such as Overtime, Bonus, ESI or Loan recovery."
   ],
   [
    "Is a computer-generated salary slip valid without a signature?",
    "Many employers issue computer-generated slips with a line saying no signature is needed. Banks may still ask for a stamped and signed copy, so the slip has a place for both signatures."
   ]
  ],
  "st": "Salary Slip Generator: Free Payslip Format PDF",
  "calc": true
 },
 "rent-receipt": {
  "t": "Rent Receipt Generator for HRA",
  "d": "Generate monthly rent receipts for an HRA claim in one PDF: 12 months at once, amount in words, landlord PAN and revenue stamp box. Free, no sign-up.",
  "l": "Create rent receipts for a whole year in one PDF. Enter the tenant, the landlord, the address and the monthly rent, choose the first month and the number of months, and the generator writes a numbered receipt for each month with the period, the amount in figures and words, the payment mode and a place for the landlord's signature. It reminds you when the landlord's PAN is needed and adds a revenue stamp box for cash payments. Three receipts fit on each A4 page.",
  "steps": [
   "Enter the tenant's name, the landlord's name, the address and the monthly rent.",
   "Choose the first month and the number of months, for example April and 12 months.",
   "Download the PDF, print it, and have the landlord sign each receipt."
  ],
  "use": "For salaried employees submitting HRA proof to their employer, and for landlords who want a tidy record of rent received.",
  "faq": [
   [
    "Is the landlord's PAN needed on a rent receipt?",
    "Your employer needs the landlord's PAN when the rent is more than ₹1,00,000 a year, which is above about ₹8,333 a month. Below that, receipts without a PAN are accepted."
   ],
   [
    "Is a revenue stamp required on a rent receipt?",
    "A ₹1 revenue stamp is needed when more than ₹5,000 is paid in cash against one receipt. For rent paid by bank transfer, UPI or cheque it is not required."
   ],
   [
    "Can I claim HRA under the new tax regime?",
    "No. The HRA exemption is available only under the old tax regime. Under the old regime your employer asks for rent receipts as proof."
   ],
   [
    "How many rent receipts does my employer need?",
    "Most employers ask for a receipt for each month, and some accept one per quarter. Generate all twelve and submit what your employer asks for."
   ],
   [
    "What if my landlord does not have a PAN?",
    "If the yearly rent is above ₹1,00,000, employers usually ask for a signed declaration from the landlord stating that they do not hold a PAN, along with their name and address."
   ]
  ],
  "st": "Rent Receipt Generator for HRA: Free PDF",
  "calc": true
 },
 "pan-aadhaar-validator": {
  "t": "PAN, Aadhaar & IFSC Number Validator",
  "d": "Check PAN format, the Aadhaar check digit, GSTIN and IFSC for typing mistakes. Paste one or thousands and export a CSV. Runs offline, nothing uploaded.",
  "l": "Catch typing mistakes in identity and bank numbers before they cause a rejected form or a failed payment. Paste one number or a whole column: each is recognised as a PAN, an Aadhaar number, a GSTIN or an IFSC and checked against its pattern. PAN holder types are decoded, Aadhaar numbers are tested with the Verhoeff check digit, and GSTINs with their own checksum. Duplicates are flagged and the results export to CSV. The numbers are checked on your device and never sent anywhere.",
  "steps": [
   "Paste one or many numbers, or load them from a CSV or Excel file.",
   "Each number is recognised and checked, with the reason shown for any that fail.",
   "Download the results as a CSV for Excel."
  ],
  "use": "Useful for HR and accounts teams cleaning employee or vendor records, and for anyone filling a form who wants to be sure a number was typed correctly.",
  "faq": [
   [
    "What is the format of a PAN number?",
    "Ten characters: five letters, four digits and one letter, like ABCPK1234L. The fourth letter shows the holder type (P for an individual, C for a company) and the fifth is the first letter of the surname or name."
   ],
   [
    "How is an Aadhaar number checked?",
    "An Aadhaar number has 12 digits, never starts with 0 or 1, and ends in a check digit calculated with the Verhoeff algorithm. A single wrong digit, or two neighbouring digits swapped, fails the check."
   ],
   [
    "Does this confirm that a PAN or Aadhaar is real?",
    "No. It tells you the number is correctly formed and catches typing mistakes. Only the Income Tax Department and UIDAI can confirm that a number has been issued and who holds it."
   ],
   [
    "What is the format of an IFSC code?",
    "Eleven characters: four letters for the bank, a zero, and six characters for the branch, like SBIN0001234."
   ],
   [
    "Is it safe to paste Aadhaar numbers here?",
    "The check runs inside your browser and the numbers are not uploaded or stored. For shared documents, mask all but the last four digits; the Smart Redaction tool does that for PDFs."
   ]
  ],
  "st": "PAN & Aadhaar Number Validator: Format Check",
  "calc": true
 },
 "amount-in-words": {
  "t": "Number to Words Converter (Rupees)",
  "d": "Convert an amount to words in Indian rupees: lakh and crore in English, Hindi words, or the million format. With paise, ready for cheques and invoices.",
  "l": "Write any rupee amount in words without counting zeros. Type the figure and read it three ways: English in the Indian system of lakh and crore, Hindi in Devanagari, and English in the international system of million and billion. Paise are included, and one switch adds the cheque wording \"Rupees ... Only\". Each line has its own copy button.",
  "steps": [
   "Type the amount in figures, with or without commas.",
   "Read it in English, Hindi and the international format.",
   "Tap Copy next to the line you need."
  ],
  "use": "Handy for writing cheques, invoices, receipts, rent agreements, affidavits and salary letters.",
  "faq": [
   [
    "How do I write 1,50,000 in words?",
    "One Lakh Fifty Thousand. On a cheque: \"Rupees One Lakh Fifty Thousand Only\"."
   ],
   [
    "How do I write paise in words?",
    "₹1,250.50 is written \"Rupees One Thousand Two Hundred Fifty and Fifty Paise Only\"."
   ],
   [
    "What is 1 crore in millions?",
    "One crore is 10 million (1,00,00,000 = 10,000,000), and one lakh is 100 thousand."
   ],
   [
    "How do I write 10,00,000 in words?",
    "Ten Lakh. In the international system the same number is One Million."
   ],
   [
    "How do I write an amount in Hindi words?",
    "Type the figure and copy the Hindi line. For example 1,25,000 is \"एक लाख पच्चीस हज़ार रुपये मात्र\"."
   ]
  ],
  "st": "Number to Words in Rupees: English & Hindi",
  "calc": true
 },
 "cgpa-calculator": {
  "t": "CGPA to Percentage Calculator",
  "d": "Convert CGPA to percentage and percentage to CGPA, find the percentage of marks, or turn SGPA into CGPA. Pick the formula your university uses.",
  "l": "Three calculators students need when filling a form. Convert CGPA to percentage or percentage to CGPA with the formula your board or university uses, including CGPA × 9.5, CGPA × 10 and (CGPA − 0.75) × 10, or type your own multiplier. Work out the percentage from marks obtained and total marks, with the marks needed for common cut-offs. Or enter each semester's SGPA, with credits if you have them, to get the overall CGPA.",
  "steps": [
   "Choose what you want to work out: CGPA and percentage, percentage of marks, or SGPA to CGPA.",
   "Enter your numbers and, for CGPA, choose the formula your board or university uses.",
   "Read the result with the working shown."
  ],
  "use": "For job applications, entrance and scholarship forms, and higher-education admissions that ask for a percentage instead of a CGPA.",
  "faq": [
   [
    "How do I convert CGPA to percentage?",
    "Multiply by the factor your board or university gives. CBSE used 9.5, so a CGPA of 8.2 is 8.2 × 9.5 = 77.9%. Many universities use CGPA × 10 or (CGPA − 0.75) × 10, so check your marksheet."
   ],
   [
    "How do I calculate the percentage of marks?",
    "Percentage = marks obtained ÷ total marks × 100. For 432 out of 500 it is 86.4%."
   ],
   [
    "How is CGPA calculated from SGPA?",
    "If every semester carries the same credits, CGPA is the average of the SGPAs. Otherwise multiply each SGPA by its credits, add the results, and divide by the total credits."
   ],
   [
    "Which formula should I use?",
    "The one printed on your marksheet or in your university's circular. Universities set their own rule, and forms that need an exact figure may ask for the university's conversion certificate."
   ],
   [
    "What CGPA is 75 percent?",
    "With the 9.5 formula, 75% is a CGPA of about 7.89. With CGPA × 10 it is 7.5."
   ]
  ],
  "st": "CGPA to Percentage Calculator (CBSE, 10 Point)",
  "calc": true
 }
});
TOOLS['biodata-maker'].l += ' Headings and labels are also available in Marathi and Gujarati, there are ten designs to choose from, and the opening line can be changed to suit any faith.';
TOOLS['biodata-maker'].faq.push(['Can I make a biodata in Marathi or Gujarati?', 'Yes. Choose मराठी or ગુજરાતી at the top. The headings and labels change to that language, and the PDF keeps the script exactly as shown.']);
TOOLS['letter-maker'].l += ' More formats are included: applications to a bank manager in English and Hindi, TC, bonafide and fee-concession applications, relieving, offer, appointment, joining and salary letters, an internship certificate, an authorisation letter and a self-declaration.';
TOOLS['letter-maker'].faq.push(['Which letter formats are included?', 'Leave applications in English and Hindi, bank applications in English and Hindi, TC and bonafide applications, a fee-concession application in Hindi, a lost-article report, resignation, relieving, offer, appointment, joining, experience, salary and internship letters, NOC, authorisation letter, self-declaration and an 11-month rent agreement.']);

/* ---------- v4.7: loan, investment and income tax calculators ---------- */
Object.assign(TOOLS, {
 "income-tax-calculator": {
  "t": "Income Tax Calculator FY 2026-27 (New vs Old Regime)",
  "d": "Compare income tax under the new and old regimes for FY 2026-27, with the ₹12 lakh rebate, standard deduction, 80C, HRA, 80D and home loan interest.",
  "l": "Enter your salary and other income once and see your tax under both regimes side by side: standard deduction, taxable income, tax on each slab, the rebate, surcharge, cess, the total and the monthly figure. The new regime uses the slabs from 0% up to ₹4 lakh to 30% above ₹24 lakh, the ₹75,000 standard deduction and the rebate that makes income up to ₹12 lakh tax-free, with marginal relief just above it. For the old regime you can add HRA, 80C, 80D, home loan interest, NPS and professional tax, each capped at its limit, and the calculator tells you how large your deductions would need to be for the old regime to break even.",
  "steps": [
   "Choose your age group and enter your gross salary and any other income.",
   "If you are thinking of the old regime, open its deductions and add HRA, 80C, 80D and home loan interest.",
   "Compare the two totals, see how much the cheaper regime saves, and copy the comparison."
  ],
  "use": "For salaried employees choosing a regime for TDS at the start of the year, and for anyone checking their tax before filing an ITR.",
  "faq": [
   [
    "Is income up to ₹12 lakh tax-free?",
    "Under the new regime, yes. Resident individuals with taxable income up to ₹12 lakh get a rebate of up to ₹60,000, which cancels the tax. Salaried people also get the ₹75,000 standard deduction, so a salary up to ₹12.75 lakh pays nothing."
   ],
   [
    "What are the new regime slabs for FY 2026-27?",
    "Nil up to ₹4 lakh, 5% from ₹4 to 8 lakh, 10% from ₹8 to 12 lakh, 15% from ₹12 to 16 lakh, 20% from ₹16 to 20 lakh, 25% from ₹20 to 24 lakh and 30% above ₹24 lakh, plus 4% health and education cess. Budget 2026 left them unchanged."
   ],
   [
    "What are the old regime slabs?",
    "Nil up to ₹2.5 lakh (₹3 lakh for 60 to 79, ₹5 lakh for 80 and above), 5% up to ₹5 lakh, 20% from ₹5 to 10 lakh and 30% above ₹10 lakh. Income up to ₹5 lakh is tax-free through the ₹12,500 rebate."
   ],
   [
    "Which regime is better for me?",
    "With only the standard deduction, the new regime is cheaper at every income. The old regime can come out ahead only when you claim large deductions such as HRA, 80C, 80D and home loan interest. The calculator shows exactly how large they would need to be."
   ],
   [
    "What is marginal relief at ₹12 lakh?",
    "If your taxable income is a little over ₹12 lakh, the tax cannot be more than the income above ₹12 lakh. At ₹12.25 lakh of taxable income the tax is ₹25,000 plus cess, not the ₹63,750 the slabs would give."
   ]
  ],
  "st": "Income Tax Calculator FY 2026-27: New vs Old Regime",
  "calc": true,
  "fin": true
 },
 "emi-calculator": {
  "t": "EMI Calculator for Home, Car & Personal Loans",
  "d": "Calculate the EMI, total interest and amortisation schedule of any loan, and see how much interest a part payment or a higher monthly payment saves.",
  "l": "Enter the loan amount, the interest rate and the tenure in years or months to get the EMI, the total interest and the total amount payable, with a chart of principal against interest. The amortisation schedule shows each year or each month, with the principal and interest inside every EMI and the balance left, and you can save it as a CSV for Excel. Add an extra amount every month or a one-time part payment to see how many months sooner the loan ends and how much interest you save. Quick settings for home, car, personal and education loans fill in typical amounts and rates.",
  "steps": [
   "Pick the loan type, or simply enter the loan amount, interest rate and tenure.",
   "Read the EMI, the total interest and the year-wise or month-wise schedule.",
   "Add a prepayment to see the interest and months saved, and download the schedule if you need it."
  ],
  "use": "For comparing loan offers, planning a home, car or personal loan, and deciding whether to prepay.",
  "faq": [
   [
    "What is the formula for EMI?",
    "EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1). P is the loan amount, r is the annual rate divided by 12 and by 100, and n is the tenure in months."
   ],
   [
    "What is the EMI on a ₹30 lakh home loan?",
    "At 8.5% for 20 years it is ₹26,035 a month, and the total interest over the loan is about ₹32.5 lakh. At 15 years the EMI rises to about ₹29,540 but the interest falls sharply."
   ],
   [
    "What is the EMI on a ₹5 lakh personal loan?",
    "At 12% for 3 years it is ₹16,607 a month, with ₹97,858 of interest in all."
   ],
   [
    "Is it better to reduce the EMI or the tenure after a prepayment?",
    "Reducing the tenure saves more interest, because the balance is cleared sooner. This calculator keeps the EMI fixed and shows the shorter tenure."
   ],
   [
    "Why does my bank show a slightly different EMI?",
    "Banks may round the rate or the EMI, and the first EMI can include broken-period interest from the day the loan is paid out. The difference is usually a few rupees."
   ]
  ],
  "st": "EMI Calculator: Home, Car & Personal Loan EMI",
  "calc": true,
  "fin": true
 },
 "sip-calculator": {
  "t": "SIP Calculator: Mutual Fund SIP & Lumpsum Returns",
  "d": "Estimate what a monthly SIP, a lumpsum or a step-up SIP could grow to, or find the SIP you need for a goal such as ₹1 crore, with a year-by-year table.",
  "l": "Four calculators in one. The SIP tab shows what a fixed monthly investment could grow to at the return you expect. The lumpsum tab does the same for a single investment. The step-up SIP tab raises the SIP by a percentage every year, the way most people invest as their salary grows, and shows how much more it builds than a flat SIP. The goal planner works backwards from a target, such as ₹1 crore for retirement or a child's education, to the monthly SIP or the one-time amount you would need. Each result has a chart and a year-by-year table, and can be shown in today's money for any inflation rate you choose.",
  "steps": [
   "Choose SIP, lumpsum, step-up SIP or the goal planner.",
   "Enter the amount or target, the return you expect each year and the number of years.",
   "Read the amount invested, the estimated returns and the year-by-year growth."
  ],
  "use": "For planning mutual fund investments, comparing a SIP with a lumpsum, and setting a monthly figure for a goal.",
  "faq": [
   [
    "How is the SIP maturity amount calculated?",
    "FV = P × ((1 + i)^n − 1) ÷ i × (1 + i), where P is the monthly SIP, i is the expected annual return divided by 12 and by 100, and n is the number of months. This assumes you invest at the start of every month."
   ],
   [
    "What will ₹10,000 a month in SIP give in 20 years?",
    "At an assumed 12% a year, about ₹1 crore (₹99.9 lakh) on ₹24 lakh invested."
   ],
   [
    "How much SIP do I need for ₹1 crore?",
    "At 12% a year, about ₹10,000 a month for 20 years, ₹19,800 a month for 15 years or ₹43,000 a month for 10 years."
   ],
   [
    "Are SIP returns guaranteed?",
    "No. Mutual fund returns depend on the market and change from year to year. The rate you enter is an assumption, so it is sensible to check a lower one too."
   ],
   [
    "How are mutual fund gains taxed?",
    "For equity funds, gains on units held over a year are long-term and taxed at 12.5% above ₹1.25 lakh a year; gains within a year are taxed at 20%. Debt fund gains are added to your income."
   ]
  ],
  "st": "SIP Calculator: Mutual Fund SIP & Lumpsum Returns",
  "calc": true,
  "fin": true
 },
 "fd-calculator": {
  "t": "FD, RD & PPF Calculator",
  "d": "Calculate the maturity amount and interest of a fixed deposit, a recurring deposit or a PPF account, with quarterly, monthly or yearly compounding.",
  "l": "Three deposit calculators in one. For a fixed deposit, enter the amount, rate and period in years and months, and choose quarterly, monthly, half-yearly or yearly compounding, or simple interest if you take the interest out as it is paid. For a recurring deposit, enter the monthly instalment, rate and number of months; each instalment is compounded quarterly for the time it stays in the account, which is how banks calculate RD maturity. For PPF, enter your yearly deposit and see the balance after 15 years, or after extending in 5-year blocks, with a table of the interest added each year.",
  "steps": [
   "Choose FD, RD or PPF.",
   "Enter the amount, the interest rate and the period, and for an FD the compounding.",
   "Read the maturity value and the interest earned, and copy the result."
  ],
  "use": "For comparing bank FD rates, planning a monthly RD, and seeing what a PPF account will be worth at maturity.",
  "faq": [
   [
    "How is FD maturity calculated?",
    "With quarterly compounding, maturity = P × (1 + r ÷ 400)^(4 × years). ₹5 lakh at 7.25% for 3 years matures at about ₹6.2 lakh."
   ],
   [
    "How is RD interest calculated?",
    "Every monthly instalment earns interest compounded each quarter for the months it is in the account. ₹2,000 a month for 5 years at 7% matures at about ₹1.44 lakh."
   ],
   [
    "What is the PPF interest rate now?",
    "The government set it at 7.1% a year for October to December 2026. It is reviewed every quarter, and the calculator lets you change it."
   ],
   [
    "What will ₹1.5 lakh a year in PPF give?",
    "At 7.1%, about ₹40.68 lakh after 15 years, ₹66.6 lakh after 20 years and ₹1.03 crore after 25 years. PPF interest and maturity are tax-free."
   ],
   [
    "Is TDS deducted on FD interest?",
    "Banks deduct TDS when the interest from one bank is more than ₹50,000 in a year, or ₹1,00,000 for senior citizens, unless you submit Form 15G or 15H."
   ]
  ],
  "st": "FD Calculator, RD & PPF Calculator: Maturity Amount",
  "calc": true,
  "fin": true
 }
});

/* ---------- v5.0: Excel Dashboard Maker ---------- */
Object.assign(TOOLS, {
 "excel-dashboard": {
  "t": "Excel Dashboard Maker",
  "d": "Upload an Excel or CSV file and get suggested KPIs and charts, then a ready dashboard: live Excel, HTML, PDF, PNG, or a Power BI / Looker Studio kit.",
  "l": "Upload any spreadsheet with a header row: sales, invoices, expenses, HR, inventory, leads or marks. DocBrisk reads every column, works out what it means (dates, amounts, quantities, regions, products, people, statuses) and suggests KPIs and charts: totals and averages, growth against the previous month, profit and margin when revenue and cost are present, target achievement, completion rates, monthly trends, breakdowns by region or channel, and top-10 rankings. Tick what you want, or type a question in plain English (for example: top 5 products by profit in 2026, region wise units, monthly revenue trend for South) and the chart appears. Click any bar, slice or point to filter the whole dashboard; change any chart's type, size and order. A data health check flags blanks, duplicates, typos and unusual values, trend charts show a three-period projection, and the insights call out growth, year-on-year change, unusual months and 80/20 concentration. Pick the currency and Indian or international number style, save the design, and next month's file gets the same dashboard automatically. Download it as a PowerPoint with editable charts too. The Excel dashboard uses live formulas and native charts over a Data sheet, so it updates when you paste new data. The HTML dashboard is one file with working filters. The Power BI kit has clean data, DAX measures, a date table, a theme and a build guide; the Looker Studio kit has calculated fields and a guide. Everything runs in your browser.",
  "steps": [
   "Upload the Excel or CSV file, or try the sample sales data.",
   "Check how each column was read, then tick the suggested KPIs and charts.",
   "Pick a theme, set filters if you like, and download Excel, HTML, PDF, PNG or a Power BI / Looker Studio kit."
  ],
  "use": "For monthly MIS reports, sales reviews, management dashboards, and starting a Power BI or Looker Studio report from a spreadsheet.",
  "faq": [
   [
    "Which files work?",
    "Any .xlsx, .xls or .csv with a header row and one row per record: sales, invoices, expenses, attendance, leads, stock or marks. A title block above the header row is fine."
   ],
   [
    "Is the Excel dashboard live?",
    "Yes. The KPI cards and charts are formulas over the Data sheet, so when you paste new rows and recalculate, every number and chart updates."
   ],
   [
    "Can I use it with Power BI or Looker Studio?",
    "Yes. The Power BI kit has clean data, DAX measures, a theme file and a step-by-step build guide; the Looker Studio kit has the data, calculated fields and a guide."
   ],
   [
    "Can I ask questions about my data?",
    "Yes. Type a question such as \"top 5 products by profit in 2026\" or \"monthly sales trend for South\" and the chart is added to the dashboard. Questions are answered on your device."
   ],
   [
    "Which downloads are free?",
    "HTML, PDF and PNG are free. Excel, PowerPoint and the Power BI / Looker Studio kits are part of DocBrisk Pro, and every free account can try them 3 times."
   ],
   [
    "Is my data uploaded?",
    "No. The file is read and the dashboard is built inside your browser."
   ]
  ],
  "st": "Excel Dashboard Maker: Automatic KPI Dashboard from Excel"
 }
});

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
Object.assign(KW, {
 "image-compressor": [
  "image compressor",
  "compress image to 50kb",
  "reduce image size in kb",
  "photo size reducer",
  "compress jpg",
  "image resizer in cm",
  "resize image to 20kb",
  "photo compressor online"
 ],
 "gst-calculator": [
  "gst calculator",
  "gst calculator online",
  "reverse gst calculator",
  "cgst sgst calculator",
  "gst inclusive calculator",
  "gst exclusive calculator",
  "18 percent gst calculator",
  "gst kaise nikale"
 ],
 "age-calculator": [
  "age calculator",
  "age calculator as on date",
  "age calculator for exam",
  "date of birth calculator",
  "age limit calculator",
  "ssc age calculator",
  "upsc age calculator",
  "umar calculator"
 ],
 "salary-slip": [
  "salary slip generator",
  "salary slip format",
  "payslip generator",
  "salary slip maker online free",
  "pay slip format",
  "salary slip pdf",
  "simple salary slip"
 ],
 "rent-receipt": [
  "rent receipt generator",
  "rent receipt format",
  "rent receipt for hra",
  "house rent receipt",
  "rent receipt pdf",
  "online rent receipt",
  "kiraya rasid"
 ],
 "pan-aadhaar-validator": [
  "pan card number check",
  "pan number format",
  "aadhaar number validator",
  "pan validation",
  "aadhaar check digit",
  "ifsc code format",
  "bulk pan validation"
 ],
 "amount-in-words": [
  "number to words",
  "amount in words",
  "rupees in words",
  "number to words in hindi",
  "amount in words converter",
  "cheque amount in words",
  "lakh crore converter"
 ],
 "cgpa-calculator": [
  "cgpa to percentage",
  "cgpa to percentage calculator",
  "percentage calculator",
  "sgpa to cgpa",
  "percentage to cgpa",
  "marks percentage calculator",
  "cgpa calculator"
 ]
});

/* ---------- v4.7: target searches for the money calculators ---------- */
Object.assign(KW, {
 "income-tax-calculator": [
  "income tax calculator",
  "income tax calculator fy 2026-27",
  "new vs old tax regime calculator",
  "tax calculator new regime",
  "salary tax calculator",
  "income tax slab 2026-27",
  "old regime vs new regime"
 ],
 "emi-calculator": [
  "emi calculator",
  "home loan emi calculator",
  "loan emi calculator",
  "car loan emi calculator",
  "personal loan emi calculator",
  "emi calculator with prepayment",
  "loan amortization schedule"
 ],
 "sip-calculator": [
  "sip calculator",
  "mutual fund sip calculator",
  "lumpsum calculator",
  "step up sip calculator",
  "sip return calculator",
  "sip calculator for 1 crore",
  "mutual fund returns calculator"
 ],
 "fd-calculator": [
  "fd calculator",
  "fixed deposit calculator",
  "rd calculator",
  "ppf calculator",
  "fd interest calculator",
  "recurring deposit calculator",
  "fd maturity calculator"
 ]
});

/* ---------- v5.0: target searches for the dashboard maker ---------- */
Object.assign(KW, {
 "excel-dashboard": [
  "excel dashboard maker",
  "dashboard from excel",
  "kpi dashboard generator",
  "automatic dashboard from excel",
  "excel to dashboard online",
  "create dashboard from csv",
  "excel dashboard online free",
  "data to dashboard"
 ]
});

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
/* ---------- v4.6 landing pages ---------- */
Object.assign(LANDINGS, {
 "compress-image-to-10kb": {
  "tool": "image-compressor",
  "h1": "Compress Image to 10 KB",
  "t": "Compress Image to 10 KB Online (Photo, Signature) | DocBrisk",
  "d": "Reduce a photo or signature to under 10 KB for exam and job forms. Set a minimum too, like 4 KB to 10 KB. Free, on your phone, nothing uploaded.",
  "lead": "Set to 10 KB already. Choose your photo or signature and download a JPG inside the limit.",
  "body": [
   "10 KB is a tight limit, used mostly for signatures and thumb impressions on recruitment forms. A signature has little detail, so it compresses to 10 KB easily; a face photo usually has to be made smaller in pixels as well.",
   "If the form gives the size in pixels, choose \"Exact size in pixels\" and enter it, for example 140 × 60 for a signature. The compressor then holds that size and lowers only the quality."
  ],
  "f": [
   [
    "How do I reduce a signature to 10 KB?",
    "Sign on white paper, take a photo, add it here and download. For a cleaner result with the paper turned white, use the exam photo and signature tool."
   ],
   [
    "My form says 4 KB to 10 KB. Can it do that?",
    "Yes. Type 10 in the first box and 4 in \"Not smaller than\". The JPG is kept between the two."
   ],
   [
    "Why does my photo look blurred at 10 KB?",
    "10 KB holds very little detail. Use the smallest pixel size the form allows, such as 200 × 230, so the detail that remains is spent on fewer pixels."
   ]
  ],
  "kw": [
   "compress image to 10kb",
   "reduce image size to 10kb",
   "signature resize 10kb",
   "photo 10kb",
   "jpg 10kb converter",
   "image ko 10kb kaise kare"
  ],
  "rel": [
   "compress-image-to-20kb",
   "compress-image-to-50kb",
   "compress-image-to-100kb"
  ]
 },
 "compress-image-to-20kb": {
  "tool": "image-compressor",
  "h1": "Compress Image to 20 KB",
  "t": "Compress Image to 20 KB Online Free (JPG) | DocBrisk",
  "d": "Reduce a photo or signature to 20 KB, or keep it between 10 KB and 20 KB, for exam, bank and job forms. Free, works on mobile, nothing uploaded.",
  "lead": "Set to 20 KB already. Choose your photo and download a JPG that fits.",
  "body": [
   "20 KB is the usual upper limit for signatures (10 KB to 20 KB) and the lower limit for many form photos (20 KB to 50 KB). Type the second number in \"Not smaller than\" when your form gives a range.",
   "A face photo stays clear at 20 KB when it is small in pixels. If your form gives a size such as 200 × 230 pixels, choose \"Exact size in pixels\" and enter it before compressing."
  ],
  "f": [
   [
    "How do I resize a photo to 20 KB?",
    "Choose the photo here and press Compress. The tool lowers JPG quality step by step, and reduces the pixel size only if needed, until the file is under 20 KB."
   ],
   [
    "How do I keep a signature between 10 KB and 20 KB?",
    "Type 20 as the maximum and 10 in \"Not smaller than\". The file is brought inside that range."
   ],
   [
    "Is 20 KB enough for a clear photo?",
    "Yes, at form sizes such as 200 × 230 or 276 × 354 pixels. A full camera photo squeezed to 20 KB without resizing will look soft."
   ]
  ],
  "kw": [
   "compress image to 20kb",
   "resize image to 20kb",
   "photo resize 20kb",
   "reduce image size to 20kb",
   "jpg to 20kb",
   "photo ko 20kb kaise kare"
  ],
  "rel": [
   "compress-image-to-10kb",
   "compress-image-to-50kb",
   "resize-image-in-cm"
  ]
 },
 "compress-image-to-50kb": {
  "tool": "image-compressor",
  "h1": "Compress Image to 50 KB",
  "t": "Compress Image to 50 KB Online Free | DocBrisk",
  "d": "Reduce JPG or PNG photo size to under 50 KB, or between 20 KB and 50 KB, for SSC, IBPS, scholarship and job forms. Free, private, on your phone.",
  "lead": "Set to 50 KB already. Choose your photo and download it inside the limit.",
  "body": [
   "50 KB is the most common photo limit on recruitment and scholarship portals, usually written as 20 KB to 50 KB. A passport-style photo of about 200 × 230 to 350 × 450 pixels fits comfortably and stays sharp.",
   "Portals reject files that are too small as well as too large. Fill in \"Not smaller than\" with the lower number and the result stays inside the range."
  ],
  "f": [
   [
    "How do I reduce image size to 50 KB?",
    "Add your photo and press Compress. The best JPG quality that fits under 50 KB is kept, so the photo looks as good as the limit allows."
   ],
   [
    "My form needs 20 KB to 50 KB. What should I enter?",
    "50 in the first box and 20 in \"Not smaller than\"."
   ],
   [
    "Can I compress several photos to 50 KB at once?",
    "Yes. Choose them together and download a ZIP with every photo under the limit."
   ]
  ],
  "kw": [
   "compress image to 50kb",
   "reduce image size to 50kb",
   "photo resize 50kb",
   "image compressor 50kb",
   "jpg 50kb",
   "photo ka size 50kb kaise kare"
  ],
  "rel": [
   "compress-image-to-20kb",
   "compress-image-to-100kb",
   "resize-image-3-5-cm-x-4-5-cm"
  ]
 },
 "compress-image-to-100kb": {
  "tool": "image-compressor",
  "h1": "Compress Image to 100 KB",
  "t": "Compress Image to 100 KB Online Free | DocBrisk",
  "d": "Compress a JPG, PNG or WebP photo to under 100 KB for visa, university and government portals. Keeps the best quality that fits. Free, no upload.",
  "lead": "Set to 100 KB already. Choose your photo and download it inside the limit.",
  "body": [
   "100 KB is a common cap for visa, university admission and KYC uploads. At this size a photo of around 600 to 1,000 pixels on its long side still looks clean.",
   "Scanned documents saved as images, such as a marksheet or an ID proof, also fit in 100 KB when they are about 1,000 pixels wide. For several pages, convert them to one PDF instead."
  ],
  "f": [
   [
    "How do I compress a photo to 100 KB?",
    "Choose the photo on this page and press Compress. The target is already set, and the result shows the final size in KB and pixels."
   ],
   [
    "Will the photo lose quality at 100 KB?",
    "Very little for a normal photo. The compressor keeps the highest JPG quality that fits, and reduces the pixel size only if it has to."
   ],
   [
    "Can I compress a PNG to 100 KB?",
    "A photo saved as PNG is far larger than the same photo as JPG. Keep \"Save as\" on JPG and it will fit easily."
   ]
  ],
  "kw": [
   "compress image to 100kb",
   "reduce image size to 100kb",
   "compress jpeg to 100kb",
   "photo 100kb",
   "image size reducer 100kb",
   "compress photo to 100kb"
  ],
  "rel": [
   "compress-image-to-50kb",
   "compress-image-to-200kb",
   "png-to-jpg"
  ]
 },
 "compress-image-to-200kb": {
  "tool": "image-compressor",
  "h1": "Compress Image to 200 KB",
  "t": "Compress Image to 200 KB Online Free | DocBrisk",
  "d": "Reduce image size to under 200 KB for NEET, JEE, UPSC and admission forms that allow up to 200 KB. Free, fast and private: nothing is uploaded.",
  "lead": "Set to 200 KB already. Choose your photo and download it inside the limit.",
  "body": [
   "Several national exam forms accept photos from 10 KB to 200 KB, and many websites cap uploads at 200 KB. That is enough for a clear, detailed portrait.",
   "If the form also fixes the dimensions, such as 3.5 × 4.5 cm, choose \"Size in centimetres\" and enter them. The file is then made at exactly that size and brought under 200 KB."
  ],
  "f": [
   [
    "How do I reduce a photo to 200 KB?",
    "Choose the photo on this page and press Compress. The target is already 200 KB."
   ],
   [
    "What pixel size should a 200 KB photo be?",
    "Anything up to about 1,500 pixels on the long side keeps good quality at 200 KB. Use the size your form gives if it gives one."
   ],
   [
    "Can I reduce a 5 MB camera photo to 200 KB?",
    "Yes. The compressor lowers the quality and, if needed, the pixel size, and shows the final dimensions next to the result."
   ]
  ],
  "kw": [
   "compress image to 200kb",
   "reduce image size to 200kb",
   "photo resize 200kb",
   "compress jpg to 200kb",
   "image 200kb",
   "photo ko 200kb kaise kare"
  ],
  "rel": [
   "compress-image-to-100kb",
   "compress-image-to-50kb",
   "resize-image-in-cm"
  ]
 },
 "resize-image-in-cm": {
  "tool": "image-compressor",
  "h1": "Resize Image in Centimetres (cm)",
  "t": "Resize Image in cm Online, with KB Limit | DocBrisk",
  "d": "Resize a photo to an exact size in centimetres, such as 3.5 × 4.5 cm or 6 × 2 cm, at 100 to 300 DPI, and set the KB limit too. Free, nothing uploaded.",
  "lead": "Set to centimetres already. Enter the width and height your form gives.",
  "body": [
   "Forms often give photo and signature sizes in centimetres, but a digital image is measured in pixels. The link between them is the DPI: pixels = centimetres ÷ 2.54 × DPI. At 200 DPI, 3.5 × 4.5 cm is 276 × 354 pixels.",
   "Choose the DPI your form mentions, or 200 if it does not say. The DPI is also written into the JPG, so the photo prints at the right physical size."
  ],
  "f": [
   [
    "How many pixels is 3.5 cm × 4.5 cm?",
    "138 × 177 at 100 DPI, 207 × 266 at 150 DPI, 276 × 354 at 200 DPI and 413 × 531 at 300 DPI."
   ],
   [
    "What if my photo is a different shape?",
    "By default the edges are cropped so nothing is stretched. You can instead fit the whole picture inside the size, or stretch it."
   ],
   [
    "What is the size of a signature in cm?",
    "It depends on the form. Common sizes are 6 × 2 cm and 3.5 × 1.5 cm. Enter the size printed in your notification."
   ]
  ],
  "kw": [
   "resize image in cm",
   "photo resize in cm",
   "image resizer cm",
   "resize photo in centimeters",
   "cm to pixel photo resize",
   "photo size in cm"
  ],
  "rel": [
   "resize-image-3-5-cm-x-4-5-cm",
   "compress-image-to-50kb",
   "compress-image-to-20kb"
  ]
 },
 "resize-image-3-5-cm-x-4-5-cm": {
  "tool": "image-compressor",
  "h1": "Resize Photo to 3.5 cm × 4.5 cm",
  "t": "3.5 cm × 4.5 cm Photo Resize Online, Free | DocBrisk",
  "d": "Resize a photo to 3.5 cm × 4.5 cm at 200 or 300 DPI and bring it under your KB limit. Crops without stretching. Free, and nothing is uploaded.",
  "lead": "Set to 3.5 × 4.5 cm already. Choose your photo, then add a KB limit if your form has one.",
  "body": [
   "3.5 cm × 4.5 cm (35 × 45 mm) is the passport-style photo size used by many Indian exam, admission and visa forms. At 200 DPI it is 276 × 354 pixels, and at 300 DPI it is 413 × 531 pixels.",
   "Your photo is cropped to this shape from the centre, slightly towards the top so the face stays in frame. For a white background or a printable sheet of photos, use the passport photo maker."
  ],
  "f": [
   [
    "How do I resize a photo to 3.5 × 4.5 cm on my phone?",
    "Open this page, choose the photo and press Compress. The size is already filled in; change the DPI or add a KB limit if your form asks for one."
   ],
   [
    "What is 3.5 × 4.5 cm in pixels?",
    "276 × 354 pixels at 200 DPI and 413 × 531 pixels at 300 DPI."
   ],
   [
    "Which forms use a 3.5 × 4.5 cm photo?",
    "Many exam and admission forms, including NEET and JEE Main, and many visa applications. Always follow the size printed in your own form."
   ]
  ],
  "kw": [
   "3.5 cm x 4.5 cm photo",
   "3.5 x 4.5 cm photo resize",
   "photo resize 3.5 cm 4.5 cm",
   "35mm x 45mm photo",
   "passport size photo 3.5 x 4.5",
   "3.5 cm 4.5 cm photo size in pixels"
  ],
  "rel": [
   "resize-image-in-cm",
   "compress-image-to-50kb",
   "compress-image-to-200kb"
  ]
 },
 "jpg-to-png": {
  "tool": "image-compressor",
  "h1": "Convert JPG to PNG",
  "t": "JPG to PNG Converter Online, Free & Private | DocBrisk",
  "d": "Convert JPG or JPEG images to PNG in your browser, one or many at once, and resize them if you need to. Free, no watermark, nothing uploaded.",
  "lead": "Set to PNG already. Choose your JPG files and download the PNGs.",
  "body": [
   "PNG stores every pixel exactly, so it suits logos, screenshots, diagrams and anything that will be edited again. Converting a JPG to PNG stops further quality loss each time the file is saved.",
   "A PNG is larger than the same picture as a JPG, and converting does not bring back detail the JPG already lost. For photos going into a form, JPG is still the better choice."
  ],
  "f": [
   [
    "Does converting JPG to PNG improve quality?",
    "No. It keeps the quality the JPG has now and prevents further loss when the file is edited and saved again."
   ],
   [
    "Can I convert many JPG files to PNG at once?",
    "Yes. Choose them together and download a ZIP of PNG files."
   ],
   [
    "Will the PNG have a transparent background?",
    "No. A JPG has no transparency, so the PNG keeps the same background. To remove a background, use the photo studio."
   ]
  ],
  "kw": [
   "jpg to png",
   "jpeg to png converter",
   "convert jpg to png",
   "jpg to png online free",
   "photo to png",
   "image to png converter"
  ],
  "rel": [
   "png-to-jpg",
   "webp-to-jpg",
   "compress-image-to-100kb"
  ]
 },
 "png-to-jpg": {
  "tool": "image-compressor",
  "h1": "Convert PNG to JPG",
  "t": "PNG to JPG Converter Online, Free & Private | DocBrisk",
  "d": "Convert PNG images to JPG and cut the file size, with a KB limit if your form has one. Many files at once. Free, no watermark, nothing uploaded.",
  "lead": "Set to JPG already. Choose your PNG files and download the JPGs.",
  "body": [
   "Screenshots and scans are often saved as PNG, which some form portals do not accept and which can be many times larger than a JPG. Converting to JPG fixes both problems.",
   "Transparent areas of a PNG become white in the JPG, since JPG has no transparency. Add a size in KB and the JPG is also brought under your upload limit."
  ],
  "f": [
   [
    "How do I convert PNG to JPG on my phone?",
    "Open this page in your phone browser, choose the PNG and press Compress. The JPG downloads to your phone."
   ],
   [
    "What happens to a transparent background?",
    "It turns white, because JPG does not support transparency."
   ],
   [
    "Can I set the JPG size in KB?",
    "Yes. Type the limit in KB, for example 50 or 100, and the JPG is made to fit."
   ]
  ],
  "kw": [
   "png to jpg",
   "png to jpeg converter",
   "convert png to jpg",
   "png to jpg online free",
   "screenshot to jpg",
   "png to jpg 50kb"
  ],
  "rel": [
   "jpg-to-png",
   "webp-to-jpg",
   "compress-image-to-50kb"
  ]
 },
 "webp-to-jpg": {
  "tool": "image-compressor",
  "h1": "Convert WebP to JPG",
  "t": "WebP to JPG Converter Online, Free | DocBrisk",
  "d": "Convert WebP images to JPG that every form, app and printer accepts. Many files at once, with an optional KB limit. Free, nothing uploaded.",
  "lead": "Set to JPG already. Choose your WebP files and download the JPGs.",
  "body": [
   "Pictures saved from websites and chat apps are often WebP, a format many portals, older phones and photo printers do not open. JPG works everywhere.",
   "Choose one or many WebP files and download JPGs of the same pixel size. Add a KB limit if the place you are sending them to has one."
  ],
  "f": [
   [
    "Why can't I upload a WebP image to a form?",
    "Most government and exam portals accept only JPG or JPEG, and sometimes PNG. Convert the WebP to JPG first."
   ],
   [
    "Does the picture lose quality?",
    "The JPG is saved at high quality, so the difference is not visible in normal use."
   ],
   [
    "Can I convert WebP to PNG instead?",
    "Yes. Change \"Save as\" to PNG."
   ]
  ],
  "kw": [
   "webp to jpg",
   "webp to jpeg converter",
   "convert webp to jpg",
   "webp to jpg online free",
   "webp to png",
   "webp file to jpg"
  ],
  "rel": [
   "png-to-jpg",
   "jpg-to-png",
   "compress-image-to-100kb"
  ]
 },
 "reverse-gst-calculator": {
  "tool": "gst-calculator",
  "h1": "Reverse GST Calculator",
  "t": "Reverse GST Calculator: Remove GST from Total | DocBrisk",
  "d": "Find the price before GST from an amount that includes GST. Shows the taxable value and the CGST, SGST or IGST inside it. Free and instant.",
  "lead": "Set to \"Including GST\" already. Enter the total and pick the rate.",
  "body": [
   "A reverse GST calculation starts from the final price, such as an MRP or a bill total, and works out how much of it is tax. The formula is taxable value = total ÷ (1 + rate ÷ 100).",
   "For example, an MRP of ₹1,180 that includes 18% GST has a taxable value of ₹1,000 and ₹180 of GST. Taking 18% off ₹1,180 would give the wrong answer, because GST was charged on the lower amount."
  ],
  "f": [
   [
    "How do I calculate GST from the total amount?",
    "Divide the total by 1 plus the rate as a decimal. For 18%, divide by 1.18; for 5%, divide by 1.05. The difference between the total and the result is the GST."
   ],
   [
    "How do I remove 18% GST from an MRP?",
    "Divide the MRP by 1.18. An MRP of ₹590 gives ₹500 before tax and ₹90 of GST."
   ],
   [
    "How do I find the GST when the rate is 5%?",
    "Divide the total by 1.05. A total of ₹1,050 gives ₹1,000 before tax and ₹50 of GST."
   ]
  ],
  "kw": [
   "reverse gst calculator",
   "gst inclusive calculator",
   "remove gst from total",
   "gst reverse calculation formula",
   "mrp to base price calculator",
   "gst back calculation"
  ],
  "rel": [
   "gst-state-code-list",
   "gst-invoice-format"
  ]
 },
 "gst-state-code-list": {
  "tool": "gstin-validator",
  "h1": "GST State Code List",
  "t": "GST State Code List: All States & UTs (01 to 38) | DocBrisk",
  "d": "GST state codes for every state and union territory, from 01 Jammu and Kashmir to 38 Ladakh: the first two digits of a GSTIN. Check any GSTIN free.",
  "lead": "The first two digits of every GSTIN are a state code. Paste a GSTIN above to decode it, or find the code in the list below.",
  "body": [
   "Every GST number begins with a two-digit state code, which shows where the business is registered. 27 is Maharashtra, 07 is Delhi, 29 is Karnataka, 33 is Tamil Nadu and 09 is Uttar Pradesh.",
   "The code decides the tax on an invoice. When the supplier and the buyer have the same state code, the invoice carries CGST and SGST. When the codes differ, it carries IGST.",
   "Code 26 now covers the merged union territory of Dadra and Nagar Haveli and Daman and Diu, and 37 is Andhra Pradesh after Telangana (36) was formed. Older registrations may still show 25 or 28."
  ],
  "f": [
   [
    "What is the GST state code of Maharashtra?",
    "27. A GSTIN registered in Maharashtra starts with 27."
   ],
   [
    "What is the GST state code for Delhi?",
    "07."
   ],
   [
    "What is state code 97 in GST?",
    "97 is used for \"Other Territory\", and 99 for Centre Jurisdiction."
   ]
  ],
  "kw": [
   "gst state code list",
   "gst state code",
   "state code list for gst",
   "gst code of all states",
   "27 state code gst",
   "gst state code 09"
  ],
  "rel": [
   "reverse-gst-calculator",
   "gst-invoice-format",
   "pan-card-number-format"
  ],
  "tbl": "GST_STATES"
 },
 "salary-slip-format": {
  "tool": "salary-slip",
  "h1": "Salary Slip Format",
  "t": "Salary Slip Format: Free PDF Maker for Employers | DocBrisk",
  "d": "A simple salary slip format with earnings, deductions and net pay in words. Fill it in online and download a ready PDF. Free, no sign-up or watermark.",
  "lead": "A standard salary slip format, ready to fill. Change the sample details and download the PDF.",
  "body": [
   "A standard salary slip has four parts: the company name and pay month at the top, the employee's details, two columns for earnings and deductions, and the net pay in figures and words.",
   "The usual earnings are basic pay, house rent allowance, conveyance and special allowance. The usual deductions are provident fund, professional tax and income tax (TDS). Rename, remove or add rows to match how you pay your staff."
  ],
  "f": [
   [
    "What is the simple format of a salary slip?",
    "Company name, month, employee name, ID and designation, a table of earnings and deductions with totals, and the net pay. The format on this page follows that layout."
   ],
   [
    "Can I make a salary slip in Excel or Word instead?",
    "You can, but the columns and totals have to be set up by hand. Here the totals and the amount in words are filled in for you and the result is a PDF."
   ],
   [
    "How many months of salary slips do banks ask for?",
    "Usually the last three months for a personal loan or credit card, and sometimes six for a home loan."
   ]
  ],
  "kw": [
   "salary slip format",
   "salary slip format in pdf",
   "simple salary slip format",
   "pay slip format",
   "salary slip format for small business",
   "salary slip sample"
  ],
  "rel": [
   "salary-certificate-format",
   "rent-receipt-format",
   "offer-letter-format"
  ]
 },
 "rent-receipt-format": {
  "tool": "rent-receipt",
  "h1": "Rent Receipt Format",
  "t": "Rent Receipt Format for HRA: Fill & Download PDF | DocBrisk",
  "d": "A rent receipt format with tenant, landlord, address, period, amount in words, PAN and revenue stamp box. Fill it in and download a PDF. Free.",
  "lead": "A standard rent receipt format, ready to fill for as many months as you need.",
  "body": [
   "A rent receipt states who paid, who received, how much, for which home and for which period. The wording on this page is the one employers are used to: \"Received with thanks from ... a sum of ... towards the rent of ... for the period ...\".",
   "Each receipt carries its own number and date, the amount in figures and words, and a line for the landlord's signature. Add the landlord's PAN when the yearly rent is above ₹1,00,000."
  ],
  "f": [
   [
    "How do I write a rent receipt?",
    "Write the date, the tenant's name, the amount in figures and words, the address of the house, the rent period and the landlord's name, then have the landlord sign it. This page fills in that wording for you."
   ],
   [
    "Is a handwritten rent receipt valid?",
    "Yes, if it has the same details and the landlord's signature. A printed receipt is easier to read and quicker to make for twelve months."
   ],
   [
    "Do I need a rent receipt if I pay by bank transfer?",
    "Employers still ask for receipts as HRA proof. Keep the bank entries too; together they are strong evidence."
   ]
  ],
  "kw": [
   "rent receipt format",
   "house rent receipt format",
   "rent receipt format for hra",
   "rent receipt format pdf",
   "monthly rent receipt",
   "rent receipt sample"
  ],
  "rel": [
   "rent-agreement-format",
   "salary-slip-format"
  ]
 },
 "pan-card-number-format": {
  "tool": "pan-aadhaar-validator",
  "h1": "PAN Card Number Format",
  "t": "PAN Card Number Format: What Each Character Means | DocBrisk",
  "d": "A PAN has 10 characters: 5 letters, 4 digits and 1 letter. See what the 4th and 5th letters mean and check any PAN for typing mistakes. Free.",
  "lead": "Paste a PAN to check its format, or read what each character stands for below.",
  "body": [
   "A Permanent Account Number has ten characters in the pattern AAAAA9999A: five letters, four digits and a final letter. The first three letters are a running series from AAA to ZZZ.",
   "The fourth letter tells you who holds the PAN: P is an individual, C a company, H a Hindu Undivided Family, F a firm, A an association of persons, T a trust, B a body of individuals, L a local authority, J an artificial juridical person and G a government body.",
   "The fifth letter is the first letter of the holder's surname for an individual, or of the name for any other holder. The four digits are a running number, and the last letter is a check character."
  ],
  "f": [
   [
    "What does the 4th letter of a PAN mean?",
    "The type of holder. P means an individual, C a company, F a firm, H a Hindu Undivided Family and T a trust."
   ],
   [
    "What is the 5th character of a PAN?",
    "The first letter of the surname for an individual, or of the entity's name for others. For Rahul Verma it would be V."
   ],
   [
    "How do I know if a PAN is valid?",
    "This page checks that the pattern and holder type are correct, which catches typing mistakes. To confirm that a PAN is active, use the Verify PAN service on the Income Tax e-filing portal."
   ]
  ],
  "kw": [
   "pan card number format",
   "pan number format",
   "pan card 4th character",
   "pan card 5th character meaning",
   "pan number structure",
   "pan card format check"
  ],
  "rel": [
   "gst-state-code-list",
   "pan-card-print-front-and-back"
  ]
 },
 "number-to-words-in-hindi": {
  "tool": "amount-in-words",
  "h1": "Number to Words in Hindi (संख्या शब्दों में)",
  "t": "Number to Words in Hindi: रुपये शब्दों में | DocBrisk",
  "d": "कोई भी रकम हिन्दी शब्दों में लिखें: 1,25,000 = एक लाख पच्चीस हज़ार रुपये मात्र। Convert numbers to Hindi words for cheques and receipts. Free.",
  "lead": "Type an amount and copy it in Hindi words. अंकों में रकम लिखें और हिन्दी शब्दों में कॉपी करें।",
  "body": [
   "चेक, रसीद, बिल और सरकारी फ़ॉर्म में रकम अंकों के साथ शब्दों में भी लिखनी होती है। यहाँ रकम टाइप करते ही वह हिन्दी में शब्दों में लिख जाती है, जैसे 1,25,000 के लिए \"एक लाख पच्चीस हज़ार रुपये मात्र\"।",
   "Hindi number words do not follow one pattern from 1 to 99: 25 is पच्चीस, 49 is उनचास, 79 is उनासी and 99 is निन्यानवे. The converter uses the full list, so every amount is spelled the way it is written on cheques.",
   "Paise are added when you type them, and the same amount is shown in English with lakh and crore for forms that need both."
  ],
  "f": [
   [
    "1 लाख को शब्दों में कैसे लिखें?",
    "एक लाख रुपये मात्र। अंकों में 1,00,000।"
   ],
   [
    "How do I write 50,000 in Hindi words?",
    "पचास हज़ार रुपये मात्र।"
   ],
   [
    "How do I write 2,50,000 in Hindi?",
    "दो लाख पचास हज़ार रुपये मात्र।"
   ]
  ],
  "kw": [
   "number to words in hindi",
   "amount in words in hindi",
   "rupees in words in hindi",
   "hindi number to words",
   "रुपये शब्दों में",
   "ginti shabdon mein"
  ],
  "rel": [
   "reverse-gst-calculator",
   "rent-receipt-format"
  ]
 },
 "percentage-calculator": {
  "tool": "cgpa-calculator",
  "h1": "Marks Percentage Calculator",
  "t": "Marks Percentage Calculator: Marks to % | DocBrisk",
  "d": "Calculate the percentage of marks from marks obtained and total marks, and see the marks needed for 33%, 60%, 75% or 90%. Free and instant.",
  "lead": "Set to marks already. Enter the marks you got and the total.",
  "body": [
   "Percentage of marks = marks obtained ÷ total marks × 100. For 432 marks out of 500, that is 432 ÷ 500 × 100 = 86.4%.",
   "For several subjects, add the marks of all subjects and divide by the total maximum marks. Do not average the percentages of each subject unless every subject has the same maximum. The result also lists the marks needed for common cut-offs such as 33%, 60% and 75%."
  ],
  "f": [
   [
    "How do I calculate percentage of marks?",
    "Divide the marks you got by the total marks and multiply by 100. 360 out of 600 is 60%."
   ],
   [
    "How do I calculate the percentage for 5 subjects?",
    "Add the marks of all five subjects, divide by the total maximum (500 if each is out of 100) and multiply by 100."
   ],
   [
    "How many marks are needed for 75% out of 500?",
    "375 marks."
   ]
  ],
  "kw": [
   "percentage calculator",
   "marks percentage calculator",
   "how to calculate percentage of marks",
   "percentage calculator for marks",
   "marks to percentage",
   "percentage kaise nikale"
  ],
  "rel": [
   "sgpa-to-cgpa-calculator"
  ]
 },
 "sgpa-to-cgpa-calculator": {
  "tool": "cgpa-calculator",
  "h1": "SGPA to CGPA Calculator",
  "t": "SGPA to CGPA Calculator (With or Without Credits) | DocBrisk",
  "d": "Convert semester SGPAs into an overall CGPA, weighted by credits when you enter them. Add up to 12 semesters. Free, instant and private.",
  "lead": "Set to SGPA already. Enter the SGPA of each semester, with credits if you know them.",
  "body": [
   "SGPA is the grade point average of one semester; CGPA is the average over all semesters so far. When every semester carries the same credits, CGPA is simply the average of the SGPAs.",
   "When credits differ, each SGPA is weighted by its credits: CGPA = Σ(SGPA × credits) ÷ Σ credits. For SGPAs of 8.0 (20 credits) and 9.0 (24 credits), the CGPA is (160 + 216) ÷ 44 = 8.55."
  ],
  "f": [
   [
    "How do I calculate CGPA from SGPA?",
    "Add the SGPAs and divide by the number of semesters, or use the credit-weighted formula if your semesters have different credits."
   ],
   [
    "Is CGPA the average of SGPA?",
    "Only when all semesters have equal credits. Otherwise semesters with more credits count for more."
   ],
   [
    "How do I convert the CGPA to a percentage?",
    "Use the first tab with the formula your university prints, such as CGPA × 10 or (CGPA − 0.75) × 10."
   ]
  ],
  "kw": [
   "sgpa to cgpa",
   "sgpa to cgpa calculator",
   "cgpa from sgpa",
   "calculate cgpa from sgpa",
   "sgpa to cgpa formula",
   "semester gpa to cgpa"
  ],
  "rel": [
   "percentage-calculator"
  ]
 },
 "application-to-bank-manager": {
  "tool": "letter-maker",
  "h1": "Application to Bank Manager",
  "t": "Application to Bank Manager: Format & PDF Maker | DocBrisk",
  "d": "Write an application to a bank manager for an ATM card, statement, mobile number change, account closure or transfer. Ready format, free PDF.",
  "lead": "Choose what you need from the bank, fill in your account details and download the letter.",
  "body": [
   "Banks still ask for a signed application for many requests: a new ATM card, a statement, a change of mobile number or address, a new passbook or cheque book, transferring the account to another branch, or closing it.",
   "The letter is addressed to the Branch Manager and gives your name, account number and type, the request in one clear paragraph, and your contact details. Choose the request and the wording changes to match."
  ],
  "f": [
   [
    "How do I write an application to a bank manager?",
    "Address it to The Branch Manager with the bank and branch, add the date and a subject line, state your account number and your request, and close with your name, signature and mobile number."
   ],
   [
    "Which documents should I attach?",
    "A self-attested copy of your identity proof for most requests, and an address proof for an address change. Carry the originals to the branch."
   ],
   [
    "Can I write the application in Hindi?",
    "Yes. Use the Hindi bank application format; branches accept applications in Hindi or English."
   ]
  ],
  "kw": [
   "application to bank manager",
   "bank application format",
   "application for bank manager",
   "letter to bank manager",
   "bank application in english",
   "bank manager ko application"
  ],
  "rel": [
   "bank-application-in-hindi",
   "application-for-atm-card",
   "bank-statement-application",
   "mobile-number-change-application-bank",
   "bank-account-closing-application"
  ]
 },
 "bank-application-in-hindi": {
  "tool": "letter-maker",
  "h1": "Bank Application in Hindi (बैंक मैनेजर को आवेदन पत्र)",
  "t": "Bank Application in Hindi: बैंक मैनेजर को आवेदन | DocBrisk",
  "d": "बैंक मैनेजर को हिन्दी में आवेदन पत्र लिखें: एटीएम कार्ड, स्टेटमेंट, मोबाइल नंबर बदलना, खाता बंद या ट्रांसफ़र। सही प्रारूप, मुफ़्त PDF।",
  "lead": "आवेदन किसलिए है वह चुनें, खाते का विवरण भरें और पत्र डाउनलोड करें।",
  "body": [
   "बैंक में नया एटीएम कार्ड, स्टेटमेंट, मोबाइल नंबर या पता बदलने, नई पासबुक, खाता दूसरी शाखा में भेजने या खाता बंद करने के लिए लिखित आवेदन देना पड़ता है।",
   "आवेदन \"सेवा में, शाखा प्रबंधक महोदय\" से शुरू होता है। इसके बाद दिनांक, विषय, खाता संख्या के साथ अपना निवेदन, और अंत में नाम, हस्ताक्षर और मोबाइल नंबर लिखे जाते हैं। यहाँ कारण चुनते ही पूरा पत्र सही प्रारूप में बन जाता है।",
   "Choose the request in the list and the Hindi wording changes to match. Tap the letter to edit any line before downloading."
  ],
  "f": [
   [
    "बैंक मैनेजर को एप्लीकेशन कैसे लिखें?",
    "सेवा में, शाखा प्रबंधक महोदय, बैंक और शाखा का नाम लिखें। फिर दिनांक, विषय, अपना खाता नंबर और निवेदन लिखें। अंत में धन्यवाद, अपना नाम, हस्ताक्षर और मोबाइल नंबर लिखें।"
   ],
   [
    "एटीएम कार्ड के लिए आवेदन कैसे लिखें?",
    "सूची में \"नया एटीएम कार्ड\" चुनें। पत्र में पुराना कार्ड बंद करने और नया कार्ड जारी करने का निवेदन अपने आप लिख जाता है।"
   ],
   [
    "आवेदन के साथ कौन से दस्तावेज़ लगाएँ?",
    "पहचान पत्र की स्व-प्रमाणित प्रति, और पता बदलने के लिए पते का प्रमाण। मूल दस्तावेज़ साथ ले जाएँ।"
   ]
  ],
  "kw": [
   "bank application in hindi",
   "bank manager ko application",
   "बैंक मैनेजर को आवेदन पत्र",
   "bank application hindi mein",
   "बैंक एप्लीकेशन",
   "atm card ke liye application"
  ],
  "rel": [
   "application-to-bank-manager",
   "leave-application-in-hindi",
   "tc-application-in-hindi"
  ]
 },
 "application-for-atm-card": {
  "tool": "letter-maker",
  "h1": "Application for ATM Card",
  "t": "Application for ATM Card to Bank Manager | DocBrisk",
  "d": "Write an application to the bank manager for a new ATM or debit card: lost, damaged, expired or first card. Correct format, free PDF, nothing uploaded.",
  "lead": "Set to a new ATM card already. Fill in your account details and download the application.",
  "body": [
   "You need a written application when an ATM-cum-debit card is lost, damaged, blocked or expired, or when the account never had one. The branch uses it to block the old card and order a new one.",
   "If the card is lost or stolen, block it first through the bank's helpline, app or net banking, then hand in this application. Tap the letter to say in your own words how the card became unusable."
  ],
  "f": [
   [
    "How do I write an application for a new ATM card?",
    "Address the Branch Manager, give your account number, say that your card is lost, damaged or expired, and ask for the old card to be blocked and a new one issued."
   ],
   [
    "What should I do first if my ATM card is lost?",
    "Block the card straight away using the bank's helpline, mobile app or net banking. Then give a written application for a replacement."
   ],
   [
    "How long does a new ATM card take?",
    "It varies by bank. Many banks send a replacement card by post within one to two weeks, and some branches issue an instant card."
   ]
  ],
  "kw": [
   "application for atm card",
   "atm card application",
   "application for new atm card",
   "atm card lost application",
   "letter to bank manager for atm card",
   "atm card ke liye application"
  ],
  "rel": [
   "application-to-bank-manager",
   "bank-application-in-hindi",
   "bank-statement-application"
  ]
 },
 "bank-statement-application": {
  "tool": "letter-maker",
  "h1": "Application for Bank Statement",
  "t": "Application for Bank Statement: Letter Format | DocBrisk",
  "d": "Write an application to the bank manager for an account statement for 3 months, 6 months or a year. Ready format, edit any line, free PDF.",
  "lead": "Set to a bank statement already. Fill in your account details and download the application.",
  "body": [
   "A bank statement is asked for with loan applications, visa files, income tax returns and scholarship forms. Most banks let you download one from net banking, but a stamped statement from the branch needs a written request.",
   "The application gives your account number and the period you need. The default wording asks for the last six months; tap the letter to change it to three months, a financial year or exact dates."
  ],
  "f": [
   [
    "How do I write an application for a bank statement?",
    "Address the Branch Manager, mention your account number, state the period (for example 1 April 2025 to 31 March 2026) and the reason, and sign with your name and mobile number."
   ],
   [
    "Can I get a bank statement without visiting the branch?",
    "Usually yes, through net banking, the mobile app or an email statement. A statement with the bank's stamp and signature has to be collected from the branch."
   ],
   [
    "Is there a charge for a bank statement?",
    "Banks may charge for printed or duplicate statements. Ask the branch; statements by email or app are normally free."
   ]
  ],
  "kw": [
   "application for bank statement",
   "bank statement application",
   "bank statement request letter",
   "letter to bank manager for statement",
   "bank statement ke liye application",
   "statement application format"
  ],
  "rel": [
   "application-to-bank-manager",
   "bank-application-in-hindi",
   "remove-password-from-bank-statement-pdf"
  ]
 },
 "mobile-number-change-application-bank": {
  "tool": "letter-maker",
  "h1": "Application to Change Mobile Number in Bank",
  "t": "Application to Change Mobile Number in Bank | DocBrisk",
  "d": "Write an application to the bank manager to change or update the mobile number linked to your account. Correct format, free PDF.",
  "lead": "Set to a mobile number change already. Enter your new number and account details, then download.",
  "body": [
   "The mobile number on your account receives OTPs and transaction alerts, so banks change it only on a signed request with identity proof. Some banks also let you update it at an ATM or through net banking when the old number still works.",
   "The letter states your account number and the new number to be registered. Attach a self-attested copy of your identity proof and carry the original."
  ],
  "f": [
   [
    "How do I write an application to change my mobile number in the bank?",
    "Address the Branch Manager, give your account number, state the new mobile number clearly, ask for it to be registered for alerts and OTPs, and attach an identity proof."
   ],
   [
    "Can I change the number online?",
    "Some banks allow it through net banking, the mobile app or an ATM, usually when you still have the old number. Otherwise visit the branch with this application."
   ],
   [
    "How long does it take to update?",
    "It depends on the bank. Many update the number within one or two working days."
   ]
  ],
  "kw": [
   "mobile number change application in bank",
   "application to change mobile number in bank",
   "bank mobile number change letter",
   "mobile number update application bank",
   "bank me mobile number change application",
   "link mobile number to bank account application"
  ],
  "rel": [
   "application-to-bank-manager",
   "bank-application-in-hindi",
   "application-for-atm-card"
  ]
 },
 "bank-account-closing-application": {
  "tool": "letter-maker",
  "h1": "Bank Account Closing Application",
  "t": "Bank Account Closing Application: Letter Format | DocBrisk",
  "d": "Write an application to the bank manager to close a savings or current account, with the balance transfer and return of cheque book and card. Free PDF.",
  "lead": "Set to account closure already. Fill in your account details and download the application.",
  "body": [
   "To close an account, banks ask for a signed request from every account holder, along with the unused cheque leaves, the passbook and the debit card. Some also have their own closure form, which this letter can accompany.",
   "Before you apply, move standing instructions, EMIs and automatic payments to another account, and download your old statements. The letter asks for the remaining balance to be paid in cash or transferred; tap it to add the other account's details."
  ],
  "f": [
   [
    "How do I write an application to close a bank account?",
    "Address the Branch Manager, give the account number, say that you want to close it, state how the balance should be paid, and list what you are returning: passbook, cheque leaves and ATM card."
   ],
   [
    "Are there charges for closing an account?",
    "Banks may charge a fee when an account is closed within a set period after opening. Ask your branch."
   ],
   [
    "Do all joint holders need to sign?",
    "Yes. A joint account is closed only on the signature of all holders."
   ]
  ],
  "kw": [
   "bank account closing application",
   "application for closing bank account",
   "account close application",
   "bank account close letter",
   "khata band karne ke liye application",
   "account closure letter format"
  ],
  "rel": [
   "application-to-bank-manager",
   "bank-application-in-hindi",
   "bank-statement-application"
  ]
 },
 "tc-application": {
  "tool": "letter-maker",
  "h1": "TC Application (Transfer Certificate)",
  "t": "TC Application: Transfer Certificate Letter Format | DocBrisk",
  "d": "Write an application for a Transfer Certificate from school or college in the correct format. Add your class, roll number and reason. Free PDF.",
  "lead": "Fill in the student details and the reason, then download the TC application.",
  "body": [
   "A Transfer Certificate (TC), also called a school leaving certificate, is needed to take admission in another school or college. The school issues it on a written request, after dues are cleared and library books returned.",
   "The application is addressed to the Principal and gives the student's name, class, roll number and the reason for leaving, such as a parent's transfer, moving to another city or completing the course. For a school student, a parent or guardian should also sign."
  ],
  "f": [
   [
    "How do I write an application for TC?",
    "Address the Principal, write the subject \"Application for issue of Transfer Certificate\", give your name, class and roll number, state the reason, and request the TC and character certificate."
   ],
   [
    "Who should sign a TC application?",
    "A college student signs it. For a school student, the parent or guardian normally signs as well."
   ],
   [
    "What documents are given with a TC?",
    "Usually the transfer certificate, a character certificate and the marksheets. Schools issue them after the fee and library dues are cleared."
   ]
  ],
  "kw": [
   "tc application",
   "application for tc",
   "application for transfer certificate",
   "tc application for school",
   "tc application for college",
   "school leaving certificate application"
  ],
  "rel": [
   "tc-application-in-hindi",
   "bonafide-certificate-application",
   "leave-application-for-school"
  ]
 },
 "tc-application-in-hindi": {
  "tool": "letter-maker",
  "h1": "TC Application in Hindi (टी.सी. के लिए प्रार्थना पत्र)",
  "t": "TC Application in Hindi: टी.सी. प्रार्थना पत्र | DocBrisk",
  "d": "विद्यालय या कॉलेज से टी.सी. (स्थानांतरण प्रमाण-पत्र) लेने के लिए हिन्दी में प्रार्थना पत्र लिखें। सही प्रारूप, मुफ़्त PDF।",
  "lead": "नाम, कक्षा और कारण भरें, फिर प्रार्थना पत्र डाउनलोड करें।",
  "body": [
   "दूसरे विद्यालय या कॉलेज में प्रवेश लेने के लिए स्थानांतरण प्रमाण-पत्र (टी.सी.) ज़रूरी होता है। विद्यालय यह प्रमाण-पत्र लिखित प्रार्थना पत्र मिलने और शुल्क जमा होने के बाद देता है।",
   "प्रार्थना पत्र प्रधानाचार्य को लिखा जाता है। इसमें छात्र का नाम, कक्षा, अनुक्रमांक और विद्यालय छोड़ने का कारण लिखें, जैसे पिताजी का स्थानांतरण या दूसरे शहर जाना।",
   "The Hindi letter follows the standard order: सेवा में, दिनांक, विषय, महोदय, the request, and the closing. Tap the letter to edit any line."
  ],
  "f": [
   [
    "टी.सी. के लिए एप्लीकेशन कैसे लिखें?",
    "सेवा में प्रधानाचार्य महोदय लिखकर विद्यालय का नाम लिखें। विषय में \"स्थानांतरण प्रमाण-पत्र हेतु प्रार्थना-पत्र\" लिखें, फिर अपना नाम, कक्षा, अनुक्रमांक और कारण बताकर टी.सी. देने का निवेदन करें।"
   ],
   [
    "टी.सी. के आवेदन पर किसके हस्ताक्षर होने चाहिए?",
    "छात्र के साथ माता-पिता या अभिभावक के हस्ताक्षर भी होने चाहिए।"
   ],
   [
    "TC का पूरा नाम क्या है?",
    "Transfer Certificate, यानी स्थानांतरण प्रमाण-पत्र।"
   ]
  ],
  "kw": [
   "tc application in hindi",
   "tc ke liye application",
   "टीसी के लिए प्रार्थना पत्र",
   "tc ke liye prathna patra",
   "स्थानांतरण प्रमाण पत्र हेतु आवेदन",
   "school se tc lene ke liye application"
  ],
  "rel": [
   "tc-application",
   "leave-application-in-hindi",
   "fee-concession-application-in-hindi"
  ]
 },
 "bonafide-certificate-application": {
  "tool": "letter-maker",
  "h1": "Application for Bonafide Certificate",
  "t": "Application for Bonafide Certificate: Format & PDF | DocBrisk",
  "d": "Write an application for a bonafide certificate from school or college for a scholarship, bank account, passport or travel pass. Free PDF.",
  "lead": "Fill in your course, roll number and what the certificate is for, then download the application.",
  "body": [
   "A bonafide certificate confirms that you are a student of a school or college for a given session. It is asked for with scholarship forms, education loans, bank accounts, passport applications and concession passes.",
   "The application is addressed to the Principal and states your course, roll number, session and what the certificate is needed for. Mention the purpose exactly, because many institutions print it on the certificate."
  ],
  "f": [
   [
    "How do I write an application for a bonafide certificate?",
    "Address the Principal, give your name, course, roll number and session, state the purpose, and request the certificate."
   ],
   [
    "What is a bonafide certificate used for?",
    "As proof of being a student: for scholarships, education loans, opening a bank account, a passport, hostel admission and travel concession passes."
   ],
   [
    "How long does it take to get one?",
    "It depends on the institution. Many issue it within a few working days of the application."
   ]
  ],
  "kw": [
   "application for bonafide certificate",
   "bonafide certificate application",
   "bonafide application for college",
   "bonafide certificate letter",
   "bonafide certificate request letter",
   "bonafide application for scholarship"
  ],
  "rel": [
   "tc-application",
   "self-declaration-format",
   "leave-application-for-school"
  ]
 },
 "fee-concession-application-in-hindi": {
  "tool": "letter-maker",
  "h1": "Fee Concession Application in Hindi (फीस माफी के लिए प्रार्थना पत्र)",
  "t": "फीस माफी के लिए प्रार्थना पत्र (Fee Concession) | DocBrisk",
  "d": "प्रधानाचार्य को फीस माफी (शुल्क मुक्ति) के लिए हिन्दी में प्रार्थना पत्र लिखें। नाम, कक्षा और कारण भरें और PDF डाउनलोड करें। मुफ़्त।",
  "lead": "नाम, कक्षा और कारण भरें, फिर प्रार्थना पत्र डाउनलोड करें।",
  "body": [
   "जिन विद्यार्थियों के परिवार की आर्थिक स्थिति कमज़ोर होती है, वे प्रधानाचार्य को प्रार्थना पत्र लिखकर शुल्क माफ़ करने या कम करने का निवेदन कर सकते हैं।",
   "पत्र में अपना नाम और कक्षा, परिवार की स्थिति का सच्चा और छोटा विवरण, और पढ़ाई जारी रखने की इच्छा लिखें। विद्यालय आय प्रमाण-पत्र माँग सकता है, इसलिए उसकी प्रति साथ लगाएँ।",
   "The letter is written in the standard Hindi format and can be edited line by line before you download it."
  ],
  "f": [
   [
    "फीस माफी के लिए प्रार्थना पत्र कैसे लिखें?",
    "सेवा में प्रधानाचार्य महोदय लिखें, विषय में \"शुल्क माफी हेतु प्रार्थना-पत्र\" लिखें, फिर अपनी कक्षा, परिवार की आर्थिक स्थिति और शुल्क माफ़ करने का निवेदन लिखें।"
   ],
   [
    "प्रार्थना पत्र के साथ क्या लगाना चाहिए?",
    "परिवार का आय प्रमाण-पत्र और पिछली कक्षा की अंकतालिका की प्रति लगाना अच्छा रहता है।"
   ],
   [
    "प्रार्थना पत्र किसे संबोधित करें?",
    "विद्यालय के प्रधानाचार्य को। कॉलेज में प्राचार्य या संबंधित विभागाध्यक्ष को संबोधित करें।"
   ]
  ],
  "kw": [
   "fees mafi ke liye application",
   "फीस माफी के लिए प्रार्थना पत्र",
   "fee concession application in hindi",
   "shulk mukti ke liye prarthna patra",
   "शुल्क मुक्ति हेतु प्रार्थना पत्र",
   "fees maaf karne ke liye application"
  ],
  "rel": [
   "leave-application-in-hindi",
   "tc-application-in-hindi",
   "bank-application-in-hindi"
  ]
 },
 "lost-mobile-application-to-police": {
  "tool": "letter-maker",
  "h1": "Application to Police for Lost Mobile or Documents",
  "t": "Lost Mobile Application to Police Station: Format | DocBrisk",
  "d": "Write an application to the police station for a lost mobile phone, wallet, Aadhaar, PAN or certificates. Correct format, free PDF, nothing uploaded.",
  "lead": "Fill in what was lost, when and where, then download the application.",
  "body": [
   "A lost-article report from the police is needed to get a duplicate SIM, to block a phone by its IMEI, and to apply for duplicate documents such as a marksheet, driving licence or passbook. Many states also accept lost-article reports online.",
   "The application is addressed to the Station House Officer and states who you are, what was lost, when and where, and a description such as the phone model and IMEI number or the document number. Ask for an acknowledged copy and keep it safely."
  ],
  "f": [
   [
    "How do I write an application to the police for a lost mobile?",
    "Address the Station House Officer, give your name and address, state the phone model, IMEI number, and the date and place it was lost, and request that the report be registered."
   ],
   [
    "Where do I find the IMEI number?",
    "On the phone's box and on the purchase bill."
   ],
   [
    "Can I block a lost phone?",
    "Yes. After a police report, a lost phone can be blocked by its IMEI through the government's CEIR service on the Sanchar Saathi portal."
   ]
  ],
  "kw": [
   "application for lost mobile phone",
   "lost mobile application to police station",
   "mobile lost application",
   "lost document application to police",
   "application to police for lost phone",
   "mobile kho jane par application"
  ],
  "rel": [
   "application-for-atm-card",
   "self-declaration-format",
   "authorization-letter-format"
  ]
 },
 "relieving-letter-format": {
  "tool": "letter-maker",
  "h1": "Relieving Letter Format",
  "t": "Relieving Letter Format: Free PDF for Employers | DocBrisk",
  "d": "A relieving letter format with employee name, designation, joining and relieving dates, on your letterhead. Edit any line and download a PDF. Free.",
  "lead": "Fill in the employee and company details, then download the relieving letter.",
  "body": [
   "A relieving letter is issued by an employer on an employee's last working day. It confirms that the resignation was accepted, that the employee has handed over their work and company property, and that they are free to join elsewhere.",
   "New employers ask for it during background verification, along with the experience certificate. The letter states the designation, the joining date and the relieving date, and is signed by HR or a manager on the company letterhead."
  ],
  "f": [
   [
    "What is the difference between a relieving letter and an experience letter?",
    "A relieving letter confirms that the employee has been released from duties on a given date. An experience letter describes the period worked, the role and the conduct. Many companies issue both."
   ],
   [
    "When is a relieving letter given?",
    "On or after the last working day, once the notice period is served and the handover and clearance are complete."
   ],
   [
    "Who signs a relieving letter?",
    "An authorised person from HR or the management, on the company letterhead, with the company stamp if the company uses one."
   ]
  ],
  "kw": [
   "relieving letter format",
   "relieving letter",
   "relieving letter sample",
   "relieving letter format in word",
   "employee relieving letter",
   "relieving letter pdf"
  ],
  "rel": [
   "experience-certificate-format",
   "resignation-letter-format",
   "salary-certificate-format"
  ]
 },
 "offer-letter-format": {
  "tool": "letter-maker",
  "h1": "Offer Letter Format",
  "t": "Offer Letter Format: Free Job Offer Letter PDF | DocBrisk",
  "d": "An offer letter format with position, CTC in figures and words, joining date, probation and notice period. Add your letterhead and download a PDF.",
  "lead": "Fill in the position, salary and joining date, then download the offer letter.",
  "body": [
   "An offer letter tells a selected candidate the position, the salary, the joining date and the main terms of employment. The candidate signs a copy to accept it.",
   "The format on this page covers the points candidates and HR teams look for: date of joining, annual CTC in figures and words, probation, notice period, working hours and confidentiality. Tap the letter to add a salary break-up or any clause specific to your company."
  ],
  "f": [
   [
    "What should an offer letter include?",
    "The position, work location, joining date, CTC, probation period, notice period, and a request to sign and return a copy as acceptance."
   ],
   [
    "Is an offer letter the same as an appointment letter?",
    "No. An offer letter invites the candidate to join on stated terms. An appointment letter is issued on or after joining and confirms the employment. Switch \"Letter type\" to make either."
   ],
   [
    "Can a small business issue an offer letter?",
    "Yes. Any employer can, and it helps avoid disputes about salary and notice later. Print it on your letterhead and sign it."
   ]
  ],
  "kw": [
   "offer letter format",
   "job offer letter format",
   "offer letter sample",
   "simple offer letter format",
   "offer letter format for small company",
   "offer letter pdf"
  ],
  "rel": [
   "appointment-letter-format",
   "joining-letter-format",
   "salary-slip-format"
  ]
 },
 "appointment-letter-format": {
  "tool": "letter-maker",
  "h1": "Appointment Letter Format",
  "t": "Appointment Letter Format: Free PDF Maker | DocBrisk",
  "d": "An appointment letter format with designation, salary, joining date, probation and notice period on your letterhead. Edit any line, free PDF.",
  "lead": "Set to an appointment letter already. Fill in the details and download.",
  "body": [
   "An appointment letter confirms that a person has been appointed to a post. It is issued by the employer on or after the joining date and is the document employees keep as proof of employment.",
   "It names the designation and place of work and sets out the salary, probation, notice period, working hours and confidentiality terms. Both the employer and the employee sign it."
  ],
  "f": [
   [
    "What is the format of an appointment letter?",
    "Company letterhead, date, the employee's name and address, a line appointing them to the post, numbered terms and conditions, and the signatures of the employer and the employee."
   ],
   [
    "Is an appointment letter proof of employment?",
    "Yes. Along with salary slips, it is commonly accepted as proof of employment."
   ],
   [
    "When should it be issued?",
    "On the day of joining or shortly after, once the candidate has accepted the offer and reported for duty."
   ]
  ],
  "kw": [
   "appointment letter format",
   "appointment letter",
   "appointment letter sample",
   "job appointment letter format",
   "appointment letter for employee",
   "appointment letter pdf"
  ],
  "rel": [
   "offer-letter-format",
   "joining-letter-format",
   "salary-certificate-format"
  ]
 },
 "joining-letter-format": {
  "tool": "letter-maker",
  "h1": "Joining Letter Format",
  "t": "Joining Letter Format: Joining Report for a New Job | DocBrisk",
  "d": "Write a joining letter or joining report to HR in the correct format, with your post, offer letter date and joining date. Free PDF.",
  "lead": "Fill in your post and joining date, then download the joining letter.",
  "body": [
   "A joining letter, also called a joining report, is the letter a new employee gives on the first day to say they have accepted the post and reported for duty. Government offices, schools and many companies ask for one.",
   "It refers to the offer or appointment letter by date, states the post and the joining date, and lists the documents enclosed, such as certificates, identity proof and the relieving letter from the previous employer."
  ],
  "f": [
   [
    "How do I write a joining letter?",
    "Address HR or the head of the office, refer to the appointment letter and its date, state that you are reporting for duty on the joining date, list the enclosed documents and sign."
   ],
   [
    "What is the difference between a joining letter and an appointment letter?",
    "The employer issues the appointment letter. The employee writes the joining letter to accept it and report for duty."
   ],
   [
    "Which documents go with a joining report?",
    "Usually educational certificates, identity and address proof, photographs, and the relieving and experience letters from the previous employer."
   ]
  ],
  "kw": [
   "joining letter format",
   "joining letter",
   "joining report format",
   "joining letter for teacher",
   "joining letter for new employee",
   "joining application"
  ],
  "rel": [
   "offer-letter-format",
   "appointment-letter-format",
   "relieving-letter-format"
  ]
 },
 "salary-certificate-format": {
  "tool": "letter-maker",
  "h1": "Salary Certificate Format",
  "t": "Salary Certificate Format: Free PDF for Employers | DocBrisk",
  "d": "A salary certificate format stating designation, joining date, gross and net monthly salary in figures and words, on your letterhead. Free PDF.",
  "lead": "Fill in the employee and salary details, then download the certificate.",
  "body": [
   "A salary certificate is a letter from an employer confirming an employee's designation, date of joining and salary. Banks ask for it with loan and credit card applications, and embassies with visa files.",
   "It is addressed \"To whom it may concern\", states the gross and net monthly salary in figures and words, and says what it is issued for. It should be printed on the company letterhead and signed by HR or the employer."
  ],
  "f": [
   [
    "What is the difference between a salary certificate and a salary slip?",
    "A salary slip is the monthly record of earnings and deductions. A salary certificate is a one-time letter confirming the salary and employment, issued on request."
   ],
   [
    "Who can issue a salary certificate?",
    "The employer: HR, the accounts head or the proprietor, signing on the letterhead."
   ],
   [
    "Should it mention gross or net salary?",
    "Both is best. Banks usually look at the net monthly salary when working out loan eligibility."
   ]
  ],
  "kw": [
   "salary certificate format",
   "salary certificate",
   "salary certificate letter",
   "salary certificate for bank loan",
   "salary certificate sample",
   "salary certificate format in word"
  ],
  "rel": [
   "salary-slip-format",
   "experience-certificate-format",
   "relieving-letter-format"
  ]
 },
 "internship-certificate-format": {
  "tool": "letter-maker",
  "h1": "Internship Certificate Format",
  "t": "Internship Certificate Format: Free PDF Maker | DocBrisk",
  "d": "An internship certificate format with the intern's name, college, role, dates and work done, on your letterhead. Edit any line, download a PDF.",
  "lead": "Fill in the intern, the role and the dates, then download the certificate.",
  "body": [
   "An internship certificate confirms that a student completed an internship with an organisation. Colleges ask for it for credits, and students attach it to job and higher-study applications.",
   "It names the student, the course and college, the role, the start and end dates and the work done, with a line on performance. Print it on the organisation's letterhead with the signature of the supervisor or HR."
  ],
  "f": [
   [
    "What should an internship certificate include?",
    "The intern's name, course and college, the role, the internship period, a short description of the work and the signature of an authorised person."
   ],
   [
    "Who issues an internship certificate?",
    "The organisation where the internship was done, usually HR or the project supervisor."
   ],
   [
    "How do I make certificates for many interns?",
    "Use the bulk certificate generator: one template and a spreadsheet of names produce a certificate for each intern."
   ]
  ],
  "kw": [
   "internship certificate format",
   "internship certificate",
   "internship completion certificate",
   "internship certificate sample",
   "internship letter format",
   "internship certificate pdf"
  ],
  "rel": [
   "experience-certificate-format",
   "offer-letter-format"
  ]
 },
 "authorization-letter-format": {
  "tool": "letter-maker",
  "h1": "Authorization Letter Format",
  "t": "Authorization Letter Format: Free Letter Maker | DocBrisk",
  "d": "Write an authorization letter to let someone collect documents, a cheque book, a parcel or a certificate on your behalf. Correct format, free PDF.",
  "lead": "Fill in who you are authorising and for what, then download the letter.",
  "body": [
   "An authorisation letter allows another person to act for you in one specific matter, such as collecting a cheque book, a certificate, a parcel or a passport. The office hands the item over only when the letter and the identity proofs match.",
   "A good letter names the person, says exactly what they may do, and gives a date until which it is valid. Both of you sign it, and the person carries a copy of your identity proof and their own original."
  ],
  "f": [
   [
    "How do I write an authorization letter?",
    "Address the office, state your name and address, name the person you are authorising and what they may collect or do, give a validity date, and sign. Add the authorised person's signature beside yours."
   ],
   [
    "What should the authorised person carry?",
    "The signed letter in original, a copy of your identity proof and their own original identity proof."
   ],
   [
    "Is an authorization letter the same as a power of attorney?",
    "No. An authorisation letter is for a simple, one-time task. A power of attorney is a stamped legal document for wider or continuing powers."
   ]
  ],
  "kw": [
   "authorization letter format",
   "authorization letter",
   "authority letter format",
   "authorization letter to collect documents",
   "authorization letter for bank",
   "authorisation letter sample"
  ],
  "rel": [
   "self-declaration-format",
   "application-to-bank-manager"
  ]
 },
 "self-declaration-format": {
  "tool": "letter-maker",
  "h1": "Self Declaration Format",
  "t": "Self Declaration Format: Free Form Maker (PDF) | DocBrisk",
  "d": "Make a self-declaration for income, address, gap year, unemployment or any other purpose in the standard format. Edit any line and download a PDF.",
  "lead": "Fill in your details and what you are declaring, then download the self-declaration.",
  "body": [
   "A self-declaration is a signed statement in which you declare a fact about yourself and take responsibility for its truth. Many government services now accept a self-declaration in place of an affidavit for income, residence, a gap in studies and similar facts.",
   "The format states your name, parent's or husband's name, age and address, then the declaration in numbered points, and ends with the place, date and your signature. Use the wording the department asks for where it gives one."
  ],
  "f": [
   [
    "How do I write a self-declaration?",
    "Begin with \"I, (name), son or daughter of (name), aged (age), resident of (address), do hereby declare that\", list the facts in numbered points, add that they are true to the best of your knowledge, and sign with the place and date."
   ],
   [
    "Is a self-declaration the same as an affidavit?",
    "No. An affidavit is sworn before a notary or magistrate on stamp paper. A self-declaration is signed only by you. Use an affidavit when the form specifically asks for one."
   ],
   [
    "What happens if a self-declaration is false?",
    "A false declaration can lead to the benefit being cancelled and to legal action, which is why the format includes a line accepting that."
   ]
  ],
  "kw": [
   "self declaration format",
   "self declaration form",
   "self declaration letter",
   "self declaration format for income",
   "self declaration for gap year",
   "self declaration pdf"
  ],
  "rel": [
   "authorization-letter-format",
   "bonafide-certificate-application"
  ]
 },
 "one-day-leave-application": {
  "tool": "letter-maker",
  "h1": "One Day Leave Application",
  "t": "One Day Leave Application: Office & School Format | DocBrisk",
  "d": "Write a one day leave application for office, school or college in the correct format. Add the date and reason, edit any line, download a PDF.",
  "lead": "Set to a single day already. Pick the date, add your reason and download.",
  "body": [
   "A one-day leave application is short: who you are, the date you need off, and the reason in a line. Give it a day or two in advance when the leave is planned, or on the day you return if it was sudden.",
   "Common reasons are a medical appointment, a family function, a visit to a bank or government office, or an urgent matter at home. Keep the reason true and brief; one sentence is enough."
  ],
  "f": [
   [
    "How do I write a one day leave application?",
    "Address your manager, class teacher or principal, write \"Application for one day's leave\" with the date as the subject, give the reason in one sentence, and request that the leave be granted."
   ],
   [
    "Can I apply for one day leave after taking it?",
    "Yes. If the absence was sudden, hand in the application on the day you return and mention the date you were absent."
   ],
   [
    "What is a good reason for one day leave?",
    "Whatever is true: a doctor's appointment, a family function, urgent personal work or travel. Short, honest reasons are accepted most easily."
   ]
  ],
  "kw": [
   "one day leave application",
   "one day leave application for office",
   "one day leave application for school",
   "leave application for one day",
   "1 day leave application",
   "ek din ki chutti ke liye application"
  ],
  "rel": [
   "leave-application-for-office",
   "leave-application-for-school",
   "leave-application-for-urgent-work"
  ]
 },
 "leave-application-for-marriage": {
  "tool": "letter-maker",
  "h1": "Leave Application for Marriage",
  "t": "Leave Application for Marriage: Format & PDF | DocBrisk",
  "d": "Write a leave application for your own, your sister's or your brother's marriage, for office, school or college. Correct format, free PDF.",
  "lead": "Set the dates, change whose marriage it is, and download the application.",
  "body": [
   "Leave for a wedding is usually planned, so apply two to four weeks ahead and mention the exact dates, including travel days. Attach the invitation card if your office asks for proof.",
   "In the reason, say whose marriage it is and why you are needed, for example \"my elder sister's marriage, for which I have to help my family with the arrangements\". Offer to hand over your work before you leave."
  ],
  "f": [
   [
    "How do I write a leave application for my sister's marriage?",
    "State that your sister's marriage is on a given date, that you need to be present and help with the arrangements, and give the first and last day of the leave."
   ],
   [
    "How many days of leave can I take for my own marriage?",
    "It depends on your employer's leave policy and your leave balance. Check with HR before you apply."
   ],
   [
    "Should I attach the wedding card?",
    "It is not always required, but attaching the invitation makes approval easier, especially for a long leave."
   ]
  ],
  "kw": [
   "leave application for marriage",
   "leave application for sister marriage",
   "leave application for own marriage",
   "marriage leave application for office",
   "leave letter for marriage",
   "shadi ke liye chutti ki application"
  ],
  "rel": [
   "leave-application-for-office",
   "one-day-leave-application",
   "leave-application-in-hindi"
  ]
 },
 "leave-application-for-urgent-work": {
  "tool": "letter-maker",
  "h1": "Leave Application for Urgent Piece of Work",
  "t": "Leave Application for Urgent Piece of Work | DocBrisk",
  "d": "Write a leave application for an urgent piece of work at home, for school, college or office. Ready format in English, edit any line, free PDF.",
  "lead": "Set to \"an urgent piece of work\" already. Pick the date and download.",
  "body": [
   "\"Urgent piece of work\" is the phrase students and employees use when leave is needed for a personal matter they would rather not describe in detail. It is accepted for short leave of a day or two.",
   "For longer leave, or if your school or office asks, say a little more, such as \"to accompany my father to the hospital\" or \"to attend to property registration work\". Tap the letter to change the wording."
  ],
  "f": [
   [
    "How do I write a leave application for urgent work?",
    "Address the principal, class teacher or manager, state that you have an urgent piece of work at home on the given date, and request leave for that day."
   ],
   [
    "Is \"urgent piece of work\" a valid reason?",
    "For a day or two, yes. For longer leave, give a clearer reason so the request is not sent back."
   ],
   [
    "Can a parent write this application for a child?",
    "Yes. For school students a parent can sign the same letter. Change the name at the bottom and write \"my son\" or \"my daughter\" in the body."
   ]
  ],
  "kw": [
   "leave application for urgent piece of work",
   "application for urgent piece of work",
   "urgent work leave application",
   "leave application for urgent work at home",
   "urgent piece of work application for school",
   "urgent kaam ke liye application"
  ],
  "rel": [
   "one-day-leave-application",
   "leave-application-for-school",
   "sick-leave-application"
  ]
 },
 "marriage-biodata-format-in-marathi": {
  "tool": "biodata-maker",
  "h1": "Marriage Biodata Format in Marathi (मराठी बायोडाटा)",
  "t": "Marriage Biodata in Marathi: मराठी बायोडाटा मेकर | DocBrisk",
  "d": "लग्नासाठी मराठी बायोडाटा बनवा: फोटो, कौटुंबिक माहिती आणि आकर्षक डिझाइन. Make a Marathi marriage biodata and download a PDF. Free.",
  "lead": "मराठी भाषा निवडलेली आहे. माहिती भरा आणि PDF डाउनलोड करा.",
  "body": [
   "लग्नाच्या बायोडाटामध्ये वैयक्तिक माहिती (नाव, जन्म तारीख, जन्म वेळ, उंची, शिक्षण, नोकरी), कौटुंबिक माहिती आणि संपर्क लिहिला जातो. गोत्र, रास, नक्षत्र आणि मंगळ यांची माहिती हवी असल्यास भरा.",
   "This page opens the biodata maker in Marathi: every heading and label is in Marathi, and you can type the details in Marathi or English. Choose from ten designs, add a photo, and share the PDF on WhatsApp."
  ],
  "f": [
   [
    "मराठी बायोडाटा कसा बनवायचा?",
    "या पानावर माहिती भरा, डिझाइन निवडा, फोटो जोडा आणि Download PDF दाबा. बायोडाटा A4 आकारात तयार होतो."
   ],
   [
    "Can I type in English and keep Marathi headings?",
    "Yes. The headings and labels stay in Marathi, and each value appears exactly as you type it."
   ],
   [
    "बायोडाटामध्ये काय लिहावे?",
    "नाव, जन्म तारीख आणि वेळ, उंची, शिक्षण, नोकरी, उत्पन्न, आई-वडिलांची माहिती, भावंडे, मूळ गाव आणि संपर्क क्रमांक."
   ]
  ],
  "kw": [
   "marriage biodata format in marathi",
   "marathi biodata maker",
   "lagna biodata marathi",
   "मराठी बायोडाटा",
   "biodata for marriage in marathi",
   "marathi biodata format pdf"
  ],
  "rel": [
   "marriage-biodata-format-in-hindi",
   "marriage-biodata-format-in-gujarati",
   "marriage-biodata-format"
  ],
  "lang": "mr-IN"
 },
 "marriage-biodata-format-in-gujarati": {
  "tool": "biodata-maker",
  "h1": "Marriage Biodata Format in Gujarati (ગુજરાતી બાયોડેટા)",
  "t": "Marriage Biodata in Gujarati: ગુજરાતી બાયોડેટા | DocBrisk",
  "d": "લગ્ન માટે ગુજરાતી બાયોડેટા બનાવો: ફોટો, પરિવારની વિગતો અને સુંદર ડિઝાઇન. Make a Gujarati marriage biodata and download a PDF. Free.",
  "lead": "ગુજરાતી ભાષા પસંદ કરેલી છે. વિગતો ભરો અને PDF ડાઉનલોડ કરો.",
  "body": [
   "લગ્નના બાયોડેટામાં વ્યક્તિગત વિગતો (નામ, જન્મ તારીખ, જન્મ સમય, ઊંચાઈ, અભ્યાસ, વ્યવસાય), પરિવારની વિગતો અને સંપર્ક લખવામાં આવે છે. ગોત્ર, રાશિ અને નક્ષત્ર જેવી વિગતો જરૂર હોય તો ભરો.",
   "This page opens the biodata maker in Gujarati: every heading and label is in Gujarati, and you can type the details in Gujarati or English. Choose from ten designs, add a photo, and share the PDF on WhatsApp."
  ],
  "f": [
   [
    "ગુજરાતી બાયોડેટા કેવી રીતે બનાવવો?",
    "આ પેજ પર વિગતો ભરો, ડિઝાઇન પસંદ કરો, ફોટો ઉમેરો અને Download PDF દબાવો. બાયોડેટા A4 સાઇઝમાં તૈયાર થાય છે."
   ],
   [
    "Can I type in English and keep Gujarati headings?",
    "Yes. The headings and labels stay in Gujarati, and each value appears exactly as you type it."
   ],
   [
    "બાયોડેટામાં શું લખવું જોઈએ?",
    "નામ, જન્મ તારીખ અને સમય, ઊંચાઈ, અભ્યાસ, વ્યવસાય, આવક, માતા-પિતાની વિગતો, ભાઈ-બહેન, મૂળ વતન અને સંપર્ક નંબર."
   ]
  ],
  "kw": [
   "marriage biodata format in gujarati",
   "gujarati biodata maker",
   "lagna biodata gujarati",
   "ગુજરાતી બાયોડેટા",
   "biodata for marriage in gujarati",
   "gujarati biodata format pdf"
  ],
  "rel": [
   "marriage-biodata-format-in-hindi",
   "marriage-biodata-format-in-marathi",
   "marriage-biodata-format"
  ],
  "lang": "gu-IN"
 },
 "biodata-format-for-job": {
  "tool": "cv-studio",
  "h1": "Biodata Format for Job",
  "t": "Biodata Format for Job: Free Resume Maker (PDF) | DocBrisk",
  "d": "Make a biodata for a job application with personal details, education, experience and skills. ATS-friendly templates, download a PDF.",
  "lead": "Fill in your details in a template and download a job biodata as a PDF.",
  "body": [
   "In India, \"biodata\" for a job means a one or two page summary of who you are: name and contact details, education, work experience, skills and a few personal details such as date of birth and languages known.",
   "Employers today read it as a resume. Put the most recent job and qualification first, keep to one page if you are a fresher, and leave out details such as religion or father's name unless the employer's form asks for them. The builder also checks the result against applicant tracking systems (ATS)."
  ],
  "f": [
   [
    "What is the difference between biodata, resume and CV?",
    "A biodata focuses on personal details and was the traditional format in India. A resume is a short, job-focused summary of skills and experience. A CV is longer and lists a full academic and work history."
   ],
   [
    "What should a fresher write in a job biodata?",
    "Contact details, a two-line objective, education with marks, projects or internships, skills, and languages known. Keep it to one page."
   ],
   [
    "Should I add a photo to a job biodata?",
    "Only if the employer asks for one. Most private companies do not need a photo on a resume."
   ]
  ],
  "kw": [
   "biodata format for job",
   "bio data for job",
   "simple biodata format for job",
   "biodata format for job fresher",
   "biodata format pdf",
   "job biodata maker"
  ],
  "rel": [
   "resume-for-freshers",
   "marriage-biodata-format"
  ]
 },
 "rotate-pdf": {
  "tool": "organize-pdf",
  "h1": "Rotate PDF Pages",
  "t": "Rotate PDF Pages Online and Save Permanently | DocBrisk",
  "d": "Rotate one page or every page of a PDF and save it that way permanently. Fix sideways or upside-down scans. Free, and nothing is uploaded.",
  "lead": "Open your PDF, turn the pages that are sideways, and save.",
  "body": [
   "Scanned and phone-camera PDFs often come out sideways or upside down. Rotating them in a viewer only changes how you see the page; the file itself stays the same and opens sideways again for the next person.",
   "Here the rotation is saved into the PDF. Rotate a single page with its button, or select several pages, or all of them, and press \"Rotate selected\". Each press turns a page 90 degrees, so press twice for a page that is upside down."
  ],
  "f": [
   [
    "How do I rotate a PDF and save it permanently?",
    "Open the PDF here, rotate the pages and press \"Export rebuilt PDF\". The rotation is stored in the file, so it opens the right way up everywhere."
   ],
   [
    "Can I rotate only one page?",
    "Yes. Rotate a single page, a selection, or every page."
   ],
   [
    "Does rotating reduce quality?",
    "No. The page content is not re-encoded; only its orientation changes."
   ]
  ],
  "kw": [
   "rotate pdf",
   "rotate pdf pages",
   "rotate pdf and save",
   "rotate pdf online free",
   "pdf rotate permanently",
   "pdf ko seedha kaise kare"
  ],
  "rel": [
   "delete-pages-from-pdf",
   "extract-pages-from-pdf",
   "merge-pdf-on-mobile"
  ]
 },
 "delete-pages-from-pdf": {
  "tool": "organize-pdf",
  "h1": "Delete Pages from PDF",
  "t": "Delete Pages from PDF Online, Free (No Upload) | DocBrisk",
  "d": "Remove unwanted or blank pages from a PDF: mark the pages to delete, then save a new file. Free, no watermark, and the PDF never leaves your device.",
  "lead": "Open your PDF, mark the pages you do not want, and export the rest.",
  "body": [
   "A scanned file often carries blank backs of pages, a cover sheet or a page with details you do not want to share. Removing them also makes the PDF smaller, which helps when a portal has an upload limit.",
   "Every page is shown as a thumbnail. Press the bin on a page to remove it, or select several and press \"Remove selected\". A removed page can be restored until you export, and your original file is never changed."
  ],
  "f": [
   [
    "How do I delete a page from a PDF for free?",
    "Open the PDF on this page, press the bin on each page you want to remove and press \"Export rebuilt PDF\"."
   ],
   [
    "Can I delete several pages at once?",
    "Yes. Tap the pages to select them, then press \"Remove selected\"."
   ],
   [
    "Will the remaining pages lose quality?",
    "No. The pages you keep are copied as they are, with text still selectable."
   ]
  ],
  "kw": [
   "delete pages from pdf",
   "remove pages from pdf",
   "pdf page remover",
   "delete pdf pages online free",
   "remove blank pages from pdf",
   "pdf se page kaise hataye"
  ],
  "rel": [
   "extract-pages-from-pdf",
   "rotate-pdf",
   "compress-pdf-to-200kb"
  ]
 },
 "extract-pages-from-pdf": {
  "tool": "organize-pdf",
  "h1": "Extract Pages from PDF",
  "t": "Extract Pages from PDF: Save Selected Pages | DocBrisk",
  "d": "Save only the pages you need from a PDF as a new file, or split every page into its own PDF in a ZIP. Free, private, nothing uploaded.",
  "lead": "Open your PDF, keep the pages you need, and export them as a new file.",
  "body": [
   "Forms often want one page out of a long document: a single marksheet from a consolidated file, the signature page of an agreement, or one month from a statement.",
   "Open the PDF, remove the pages you do not need and export the rest as a new PDF. To get every page as its own file, use \"Split into ZIP of single pages\". Reorder pages with the arrows before exporting if the order matters."
  ],
  "f": [
   [
    "How do I extract one page from a PDF?",
    "Open the PDF, press \"Select all\", tap the page you need to unselect it, press \"Remove selected\" and export. The new file contains only that page."
   ],
   [
    "How do I save each page as a separate PDF?",
    "Press \"Split into ZIP of single pages\". You get a ZIP with one PDF per page."
   ],
   [
    "Can I change the page order while extracting?",
    "Yes. Use the arrows on each thumbnail to move a page earlier or later before you export."
   ]
  ],
  "kw": [
   "extract pages from pdf",
   "extract pdf pages",
   "save one page of pdf",
   "separate pdf pages",
   "split pdf pages online free",
   "pdf page extractor"
  ],
  "rel": [
   "delete-pages-from-pdf",
   "rotate-pdf",
   "merge-pdf-on-mobile"
  ]
 },
 "compress-pdf-to-300kb": {
  "tool": "compress-pdf",
  "h1": "Compress PDF to 300 KB",
  "t": "Compress PDF to 300 KB Online Free | DocBrisk",
  "d": "Reduce PDF size to under 300 KB for exam, admission and government portals. Text stays sharp and selectable. Free, and nothing is uploaded.",
  "lead": "Set to 300 KB already. Choose your PDF and download it inside the limit.",
  "body": [
   "300 KB is a frequent limit for multi-page uploads such as a set of marksheets, an experience letter with annexures, or a certificate with its attachments.",
   "At 300 KB, three or four scanned pages usually stay readable. If your file has more pages, scan in grayscale at 150 DPI, or remove pages the form does not ask for before compressing."
  ],
  "f": [
   [
    "How do I compress a PDF to 300 KB?",
    "Choose the PDF on this page. The target is already set to 300 KB, so press the button and download the result."
   ],
   [
    "How many pages fit in 300 KB?",
    "Many pages of typed text, or about three to four scanned pages at readable quality."
   ],
   [
    "What if the result is still above 300 KB?",
    "The tool shows the smallest size it reached. Removing extra pages or rescanning in grayscale usually closes the gap."
   ]
  ],
  "kw": [
   "compress pdf to 300kb",
   "reduce pdf size to 300kb",
   "pdf compressor 300kb",
   "compress pdf below 300kb",
   "pdf size 300kb",
   "pdf ko 300kb kaise kare"
  ],
  "rel": [
   "compress-pdf-to-200kb",
   "compress-pdf-to-500kb",
   "delete-pages-from-pdf"
  ]
 },
 "compress-pdf-to-2mb": {
  "tool": "compress-pdf",
  "h1": "Compress PDF to 2 MB",
  "t": "Compress PDF to 2 MB Online Free | DocBrisk",
  "d": "Reduce a large PDF to under 2 MB for email, job portals, e-filing systems and university uploads. Keeps text selectable. Free, nothing uploaded.",
  "lead": "Set to 2 MB already. Choose your PDF and download it inside the limit.",
  "body": [
   "2 MB is a common ceiling for attachments on office mail, job portals, tender and e-filing systems, and university document uploads.",
   "A scanned file of 20 or 30 pages can be 15 MB or more straight from a scanner app. Compression re-encodes the page images and usually brings such a file under 2 MB while keeping it readable; typed PDFs often need no visible change at all."
  ],
  "f": [
   [
    "How do I reduce a PDF to 2 MB?",
    "Choose the PDF on this page; the target is already 2 MB. Download the result and check the size shown."
   ],
   [
    "Will a 20 MB scan fit in 2 MB?",
    "Usually, yes, for text documents. Colour photographs in the file lose some detail at that ratio, so check the pages that matter."
   ],
   [
    "Can I split the file instead?",
    "Yes. If the portal accepts several files, split the PDF into parts under 2 MB each with the Split by Size tool."
   ]
  ],
  "kw": [
   "compress pdf to 2mb",
   "reduce pdf size to 2mb",
   "pdf compressor 2mb",
   "compress pdf under 2mb",
   "pdf size 2mb",
   "pdf 2mb se kam kaise kare"
  ],
  "rel": [
   "compress-pdf-to-1mb",
   "compress-pdf-to-500kb",
   "extract-pages-from-pdf"
  ]
 }
});
/* ---------- v4.7: loan, SIP, deposit and tax landing pages ---------- */
Object.assign(LANDINGS, {
 "home-loan-emi-calculator": {
  "tool": "emi-calculator",
  "h1": "Home Loan EMI Calculator",
  "t": "Home Loan EMI Calculator with Prepayment & Schedule | DocBrisk",
  "d": "Calculate your home loan EMI, total interest and year-wise amortisation schedule. Add part payments to see the interest and years you save. Free.",
  "lead": "Set to a home loan already. Enter your loan amount, rate and tenure.",
  "body": [
   "A home loan EMI is worked out on the reducing balance: each month's interest is charged only on what you still owe. A ₹30 lakh loan at 8.5% for 20 years has an EMI of ₹26,035, and you pay about ₹32.5 lakh in interest over the loan, more than the amount borrowed.",
   "The tenure changes the cost far more than the EMI suggests. The same ₹30 lakh over 15 years costs ₹29,542 a month but about ₹23.2 lakh in interest, roughly ₹9 lakh less. Prepaying even one extra EMI a year has a similar effect."
  ],
  "f": [
   [
    "What is the EMI for a ₹50 lakh home loan?",
    "At 8.5% for 20 years it is ₹43,391 a month. At 9% it rises to about ₹44,986."
   ],
   [
    "How can I reduce my home loan interest?",
    "Choose a shorter tenure, prepay whenever you can, especially in the first few years, and ask your bank to move you to its current lower rate if your loan is on an older benchmark."
   ],
   [
    "Can I claim tax benefits on a home loan?",
    "In the old regime, up to ₹2 lakh of interest on a self-occupied house and up to ₹1.5 lakh of principal under 80C. The new regime does not allow these for a self-occupied house."
   ]
  ],
  "kw": [
   "home loan emi calculator",
   "housing loan emi calculator",
   "home loan calculator",
   "home loan interest calculator",
   "sbi home loan emi calculator",
   "home loan emi calculator with prepayment"
  ],
  "rel": [
   "home-loan-prepayment-calculator",
   "car-loan-emi-calculator",
   "personal-loan-emi-calculator"
  ]
 },
 "car-loan-emi-calculator": {
  "tool": "emi-calculator",
  "h1": "Car Loan EMI Calculator",
  "t": "Car Loan EMI Calculator: Monthly EMI & Interest | DocBrisk",
  "d": "Work out the EMI on a new or used car loan, the total interest and the schedule. Compare 3, 5 and 7 year tenures in seconds. Free and private.",
  "lead": "Set to a car loan already. Enter the loan amount, rate and tenure.",
  "body": [
   "Car loans usually run for 1 to 7 years. On an ₹8 lakh loan at 9.5%, the EMI is ₹16,801 for 5 years, with about ₹2.08 lakh of interest in all.",
   "Most banks lend up to 80 to 90% of the on-road price. A larger down payment lowers both the EMI and the interest, and a shorter tenure keeps the interest down even though the EMI is higher."
  ],
  "f": [
   [
    "What is the EMI on a ₹10 lakh car loan?",
    "At 9.5% for 5 years it is about ₹21,000 a month. For 7 years it falls to about ₹16,340, but you pay much more interest."
   ],
   [
    "Is a 7-year car loan a good idea?",
    "It lowers the EMI, but the car loses value faster than the loan is repaid, and the total interest is much higher. Five years or less is usually wiser."
   ],
   [
    "Can I prepay a car loan?",
    "Usually yes, though fixed-rate car loans often carry a foreclosure charge of a few percent. Check your loan agreement, then add the prepayment above to see the saving."
   ]
  ],
  "kw": [
   "car loan emi calculator",
   "car loan calculator",
   "auto loan emi calculator",
   "used car loan emi calculator",
   "car emi calculator",
   "vehicle loan emi calculator"
  ],
  "rel": [
   "home-loan-emi-calculator",
   "personal-loan-emi-calculator"
  ]
 },
 "personal-loan-emi-calculator": {
  "tool": "emi-calculator",
  "h1": "Personal Loan EMI Calculator",
  "t": "Personal Loan EMI Calculator: EMI, Interest & Schedule | DocBrisk",
  "d": "Calculate the EMI and total interest on a personal loan for 1 to 5 years, with the month-wise schedule. Compare offers before you apply. Free.",
  "lead": "Set to a personal loan already. Enter the amount, rate and tenure.",
  "body": [
   "Personal loans are unsecured, so their rates are higher, often 10.5% to 24% a year. On ₹5 lakh at 12% for 3 years the EMI is ₹16,607 and the interest about ₹97,900.",
   "When you compare offers, look at the processing fee as well as the rate: a 2% fee on ₹5 lakh is ₹10,000 taken at the start. Keep the EMIs of all your loans under about 40 to 50% of your take-home pay."
  ],
  "f": [
   [
    "What is the EMI on a ₹2 lakh personal loan?",
    "At 12% for 2 years it is about ₹9,415 a month; for 3 years about ₹6,643."
   ],
   [
    "How do I get a lower personal loan rate?",
    "A credit score above 750, a stable job with a large employer and an existing relationship with the bank usually bring the best offers."
   ],
   [
    "Is it better to take a longer tenure?",
    "Only if you need the lower EMI. A longer tenure means paying interest for longer, so the total cost rises."
   ]
  ],
  "kw": [
   "personal loan emi calculator",
   "personal loan calculator",
   "personal loan interest calculator",
   "personal loan emi",
   "emi calculator personal loan",
   "instant loan emi calculator"
  ],
  "rel": [
   "car-loan-emi-calculator",
   "home-loan-emi-calculator"
  ]
 },
 "home-loan-prepayment-calculator": {
  "tool": "emi-calculator",
  "h1": "Home Loan Prepayment Calculator",
  "t": "Home Loan Prepayment Calculator: Interest Saved | DocBrisk",
  "d": "See how much interest and how many EMIs a part payment or an extra monthly amount saves on your home loan, with the new schedule. Free and private.",
  "lead": "A ₹5 lakh part payment after the first year is filled in. Change it to your own figures.",
  "body": [
   "A prepayment goes straight to the principal, so every later EMI carries less interest. On a ₹30 lakh loan at 8.5% for 20 years, paying ₹5 lakh after the twelfth EMI ends the loan 73 EMIs early and saves about ₹14.1 lakh of interest.",
   "Small, regular amounts work too. Adding a twelfth of an EMI every month, which equals one extra EMI a year, cuts the same loan by about 41 EMIs and saves about ₹6.5 lakh. Keep the EMI the same and let the tenure fall; that saves the most."
  ],
  "f": [
   [
    "Should I reduce the EMI or the tenure after prepaying?",
    "Reducing the tenure saves more interest. Reduce the EMI only if you need room in your monthly budget."
   ],
   [
    "Is there a penalty for prepaying a home loan?",
    "Not on a floating-rate home loan taken by an individual: RBI rules do not allow it. Fixed-rate loans may carry a charge."
   ],
   [
    "When is the best time to prepay?",
    "As early as possible. In the first years most of each EMI is interest, so money you prepay then saves the most."
   ]
  ],
  "kw": [
   "home loan prepayment calculator",
   "loan prepayment calculator",
   "part payment calculator",
   "emi calculator with prepayment",
   "home loan part payment calculator",
   "prepayment of home loan benefits"
  ],
  "rel": [
   "home-loan-emi-calculator"
  ]
 },
 "lumpsum-calculator": {
  "tool": "sip-calculator",
  "h1": "Lumpsum Calculator",
  "t": "Lumpsum Calculator: One-Time Mutual Fund Returns | DocBrisk",
  "d": "Find out what a one-time mutual fund investment could grow to at the return you expect, with a year-by-year table and inflation. Free and private.",
  "lead": "Set to lumpsum already. Enter the amount, the return and the years.",
  "body": [
   "A lumpsum grows by compounding once a year: FV = P × (1 + r ÷ 100)^years. ₹1 lakh at 12% for 10 years becomes about ₹3.1 lakh, and for 20 years about ₹9.6 lakh.",
   "A lumpsum puts all your money in at one price. If markets are high, many investors spread it over a few months through an STP or SIP instead; switch to the SIP tab to compare."
  ],
  "f": [
   [
    "What will ₹5 lakh become in 10 years?",
    "At an assumed 12% a year, about ₹15.5 lakh."
   ],
   [
    "Is a lumpsum better than a SIP?",
    "If the market rises steadily, a lumpsum earns more because all the money is invested for longer. A SIP spreads the risk of investing at a peak."
   ],
   [
    "Are the returns guaranteed?",
    "No. Mutual fund returns vary, and the rate you enter is only an assumption."
   ]
  ],
  "kw": [
   "lumpsum calculator",
   "lump sum calculator",
   "mutual fund lumpsum calculator",
   "one time investment calculator",
   "lumpsum return calculator",
   "compound interest calculator"
  ],
  "rel": [
   "step-up-sip-calculator",
   "sip-for-1-crore"
  ]
 },
 "step-up-sip-calculator": {
  "tool": "sip-calculator",
  "h1": "Step-up SIP Calculator",
  "t": "Step-up SIP Calculator: Yearly Top-up SIP Returns | DocBrisk",
  "d": "See how raising your SIP by a fixed percentage every year grows your wealth compared with a flat SIP, with a year-by-year table. Free.",
  "lead": "Set to a ₹10,000 SIP raised 10% a year for 20 years. Change any figure.",
  "body": [
   "A step-up (or top-up) SIP raises the monthly amount by a set percentage once a year, usually to match a salary rise. ₹10,000 a month raised 10% every year for 20 years at 12% grows to about ₹1.99 crore, against ₹99.9 lakh for a flat ₹10,000 SIP.",
   "Most fund houses let you set the step-up when you start the SIP, either as a percentage or a fixed rupee amount, so the increase happens without you having to remember."
  ],
  "f": [
   [
    "What step-up percentage should I choose?",
    "Something you can keep up, often 5 to 10% a year, close to your expected pay rise."
   ],
   [
    "Does a step-up SIP need a new mandate every year?",
    "No. You choose the step-up once and the fund house raises the instalment each year on its own."
   ],
   [
    "Can I find the step-up SIP for a goal?",
    "Yes. Use the goal planner tab and enter a step-up percentage; it shows the starting SIP you need."
   ]
  ],
  "kw": [
   "step up sip calculator",
   "top up sip calculator",
   "sip with annual increase calculator",
   "step up sip",
   "increasing sip calculator",
   "sip step up returns"
  ],
  "rel": [
   "sip-for-1-crore",
   "lumpsum-calculator"
  ]
 },
 "sip-for-1-crore": {
  "tool": "sip-calculator",
  "h1": "How Much SIP for ₹1 Crore?",
  "t": "SIP for 1 Crore: Monthly SIP Needed in 10, 15, 20 Years | DocBrisk",
  "d": "Find the monthly SIP needed to reach ₹1 crore in 10, 15 or 20 years at the return you expect, with or without a yearly step-up. Free goal planner.",
  "lead": "The goal planner is set to ₹1 crore in 20 years. Change the years and the return.",
  "body": [
   "At an assumed 12% a year, reaching ₹1 crore takes about ₹10,000 a month for 20 years, ₹19,800 a month for 15 years or ₹43,000 a month for 10 years. Time does most of the work: the 20-year plan invests only ₹24 lakh of your own money.",
   "With a 10% step-up every year you can start lower, at roughly ₹5,000 a month for 20 years. Remember inflation too: at 6% a year, ₹1 crore in 20 years will buy about what ₹31 lakh buys today."
  ],
  "f": [
   [
    "How much SIP for 1 crore in 10 years?",
    "About ₹43,000 a month at 12% a year."
   ],
   [
    "How much SIP for 1 crore in 15 years?",
    "About ₹19,800 a month at 12% a year."
   ],
   [
    "How much SIP for 1 crore in 20 years?",
    "About ₹10,000 a month at 12% a year."
   ]
  ],
  "kw": [
   "sip for 1 crore",
   "how much sip for 1 crore",
   "sip calculator 1 crore",
   "1 crore in 10 years sip",
   "1 crore in 15 years sip",
   "goal sip calculator"
  ],
  "rel": [
   "step-up-sip-calculator",
   "lumpsum-calculator"
  ]
 },
 "rd-calculator": {
  "tool": "fd-calculator",
  "h1": "RD Calculator (Recurring Deposit)",
  "t": "RD Calculator: Recurring Deposit Maturity & Interest | DocBrisk",
  "d": "Calculate the maturity amount and interest of a bank or Post Office recurring deposit with quarterly compounding. Any monthly amount and tenure. Free.",
  "lead": "Set to a recurring deposit already. Enter the monthly amount, rate and months.",
  "body": [
   "In a recurring deposit you put in the same amount every month. Banks add interest every quarter, and each instalment earns it only for the months it is in the account. ₹5,000 a month for 24 months at 7% matures at about ₹1,29,100.",
   "RD interest is taxed as income, and TDS applies when your total interest from the bank crosses ₹50,000 in a year (₹1 lakh for senior citizens)."
  ],
  "f": [
   [
    "What is the maturity of ₹2,000 a month for 5 years?",
    "At 7% a year, about ₹1,43,900 on ₹1,20,000 deposited."
   ],
   [
    "Is RD better than SIP?",
    "An RD gives a fixed, guaranteed return. A SIP in an equity fund can earn more over long periods but its value moves with the market."
   ],
   [
    "What happens if I miss an RD instalment?",
    "Banks usually charge a small penalty for a late instalment, and several missed instalments can lead to the RD being closed early."
   ]
  ],
  "kw": [
   "rd calculator",
   "recurring deposit calculator",
   "rd interest calculator",
   "post office rd calculator",
   "sbi rd calculator",
   "rd maturity calculator"
  ],
  "rel": [
   "ppf-calculator"
  ]
 },
 "ppf-calculator": {
  "tool": "fd-calculator",
  "h1": "PPF Calculator",
  "t": "PPF Calculator 2026: Maturity at 7.1% for 15+ Years | DocBrisk",
  "d": "Calculate your PPF maturity amount and tax-free interest at 7.1%, for 15 years or extended in 5-year blocks, with a year-by-year table. Free.",
  "lead": "Set to PPF already. Enter your yearly deposit.",
  "body": [
   "The PPF rate is 7.1% for October to December 2026. Depositing ₹1.5 lakh every year for 15 years builds about ₹40.68 lakh: ₹22.5 lakh of your money and about ₹18.18 lakh of interest, all tax-free.",
   "After 15 years you can extend the account in 5-year blocks, with or without new deposits. Keep depositing ₹1.5 lakh and it reaches about ₹66.6 lakh at 20 years and ₹1.03 crore at 25."
  ],
  "f": [
   [
    "What is the maximum PPF deposit?",
    "₹1,50,000 in a financial year, in one go or in instalments. The minimum is ₹500."
   ],
   [
    "When should I deposit in PPF?",
    "Before the 5th of the month, and ideally before 5 April, so the deposit earns interest for the whole year."
   ],
   [
    "Is PPF interest taxable?",
    "No. PPF is tax-free at every stage: deposits qualify for 80C in the old regime, and the interest and maturity are exempt."
   ]
  ],
  "kw": [
   "ppf calculator",
   "ppf interest calculator",
   "ppf maturity calculator",
   "public provident fund calculator",
   "ppf calculator 2026",
   "ppf return calculator"
  ],
  "rel": [
   "rd-calculator"
  ]
 },
 "tax-on-12-lakh-salary": {
  "tool": "income-tax-calculator",
  "h1": "Income Tax on ₹12 Lakh Salary",
  "t": "Income Tax on 12 Lakh Salary: New vs Old Regime 2026-27 | DocBrisk",
  "d": "How much tax on a ₹12 lakh salary in FY 2026-27? Nil in the new regime thanks to the ₹12 lakh rebate. See the old regime figure and your own numbers.",
  "lead": "Set to a ₹12 lakh salary. Add your own income and deductions.",
  "body": [
   "A ₹12 lakh salary pays no income tax in the new regime. After the ₹75,000 standard deduction, the taxable income is ₹11.25 lakh, and the rebate for taxable income up to ₹12 lakh cancels the ₹52,500 of slab tax. In fact any salary up to ₹12.75 lakh is tax-free.",
   "In the old regime the same salary pays ₹1,63,800 with no deductions, or about ₹1,01,400 with ₹2.25 lakh of 80C, 80D and NPS. The new regime wins unless you have very large deductions."
  ],
  "f": [
   [
    "Is a 12 lakh salary tax-free?",
    "Yes, in the new regime, for a resident individual whose only income is the salary."
   ],
   [
    "What if I also have interest income?",
    "It is added to your income. If the taxable total goes over ₹12 lakh, tax applies, with marginal relief so the tax never exceeds the amount above ₹12 lakh."
   ],
   [
    "Will my employer still deduct TDS?",
    "If you choose the new regime and your projected taxable income stays within ₹12 lakh, there should be no TDS on salary."
   ]
  ],
  "kw": [
   "income tax on 12 lakh salary",
   "12 lakh salary tax",
   "12 lakh income tax new regime",
   "tax on 12.75 lakh salary",
   "12 lakh tax free",
   "12 lakh salary tax calculation"
  ],
  "rel": [
   "tax-on-15-lakh-salary",
   "tax-on-20-lakh-salary"
  ]
 },
 "tax-on-15-lakh-salary": {
  "tool": "income-tax-calculator",
  "h1": "Income Tax on ₹15 Lakh Salary",
  "t": "Income Tax on 15 Lakh Salary: New vs Old Regime 2026-27 | DocBrisk",
  "d": "Tax on a ₹15 lakh salary in FY 2026-27 is ₹97,500 in the new regime. Compare it with the old regime and your own deductions. Free calculator.",
  "lead": "Set to a ₹15 lakh salary. Add your own income and deductions.",
  "body": [
   "On a ₹15 lakh salary the new regime tax is ₹97,500 including cess. The taxable income is ₹14.25 lakh after the ₹75,000 standard deduction: nil up to ₹4 lakh, ₹20,000 on the next ₹4 lakh, ₹40,000 on the next ₹4 lakh and ₹33,750 on the last ₹2.25 lakh, plus 4% cess.",
   "In the old regime the same salary pays ₹2,57,400 with no deductions and about ₹1,87,200 with ₹2.25 lakh of deductions. You would need roughly ₹5.45 lakh of old-regime deductions for the two to break even."
  ],
  "f": [
   [
    "How much is the monthly tax on 15 lakh?",
    "About ₹8,125 a month in the new regime."
   ],
   [
    "Can HRA make the old regime better at 15 lakh?",
    "Only if HRA, 80C, 80D, home loan interest and other deductions together come to roughly ₹5.45 lakh or more. Enter yours to check."
   ],
   [
    "Is the employer's NPS contribution allowed in the new regime?",
    "Yes, up to 14% of basic pay. It lowers the taxable income in both regimes."
   ]
  ],
  "kw": [
   "income tax on 15 lakh salary",
   "15 lakh salary tax new regime",
   "tax on 15 lakh income",
   "15 lakh salary tax calculation",
   "15 lakh ctc tax",
   "tax for 15 lakh package"
  ],
  "rel": [
   "tax-on-12-lakh-salary",
   "tax-on-20-lakh-salary"
  ]
 },
 "tax-on-20-lakh-salary": {
  "tool": "income-tax-calculator",
  "h1": "Income Tax on ₹20 Lakh Salary",
  "t": "Income Tax on 20 Lakh Salary: New vs Old Regime 2026-27 | DocBrisk",
  "d": "Tax on a ₹20 lakh salary in FY 2026-27 is ₹1,92,400 in the new regime. Compare it with the old regime, slab by slab, with your deductions.",
  "lead": "Set to a ₹20 lakh salary. Add your own income and deductions.",
  "body": [
   "A ₹20 lakh salary pays ₹1,92,400 in the new regime, including cess: the taxable income is ₹19.25 lakh after the standard deduction, and the slabs charge 5%, 10%, 15% and then 20% on the part above ₹16 lakh.",
   "In the old regime it is ₹4,13,400 with no deductions, and still about ₹2,96,400 with ₹3.75 lakh of deductions including a home loan. At this income the old regime only wins with very large HRA and home loan claims."
  ],
  "f": [
   [
    "What is the monthly tax on 20 lakh?",
    "About ₹16,033 a month in the new regime."
   ],
   [
    "Which tax slab is a 20 lakh salary in?",
    "In the new regime the top slab reached is 20% (₹16 to 20 lakh). In the old regime it is 30% (above ₹10 lakh)."
   ],
   [
    "Does surcharge apply at 20 lakh?",
    "No. Surcharge starts only when income is above ₹50 lakh."
   ]
  ],
  "kw": [
   "income tax on 20 lakh salary",
   "20 lakh salary tax new regime",
   "tax on 20 lakh income",
   "20 lakh ctc tax",
   "20 lakh salary tax calculation",
   "tax for 20 lakh package"
  ],
  "rel": [
   "tax-on-15-lakh-salary",
   "tax-on-12-lakh-salary"
  ]
 }
});
/* ---------- v5.0: dashboard landing pages ---------- */
Object.assign(LANDINGS, {
 "sales-dashboard-excel": {
  "tool": "excel-dashboard",
  "h1": "Sales Dashboard from Excel, Made Automatically",
  "t": "Sales Dashboard in Excel: Make One Automatically from Your Data | DocBrisk",
  "d": "Upload your sales sheet and get revenue, growth, profit, top products, regions and sales reps as a ready dashboard. Download as a live Excel dashboard, HTML or PDF. Free.",
  "lead": "Upload a sales export with dates, products, regions and amounts: the KPIs and charts are picked for you.",
  "body": [
   "A good sales dashboard answers four questions at a glance: how much did we sell, is it growing, where does it come from, and who or what is driving it. DocBrisk finds the revenue, cost and quantity columns in your sheet and builds exactly those views: total revenue and profit with growth against last month, a monthly trend, region and channel breakdowns, and the top products and sales reps.",
   "The Excel download is a real dashboard, not a picture: the KPI cards and charts are formulas and native Excel charts over a Data sheet, so next month you paste the new rows and it updates."
  ],
  "f": [
   [
    "What columns does a sales dashboard need?",
    "A date, an amount (revenue or sales), and at least one category such as product, region, channel or sales rep. Cost and units add profit, margin and price per unit."
   ],
   [
    "Can I filter by region or month?",
    "Yes. Filters for the main categories and a date range are added automatically, in the preview and in the HTML dashboard."
   ],
   [
    "Does it work with Tally or Zoho exports?",
    "Yes. Export the sales register to Excel and upload it. A title block above the header row is skipped automatically."
   ]
  ],
  "kw": [
   "sales dashboard in excel",
   "excel sales dashboard",
   "sales dashboard maker",
   "sales report dashboard",
   "sales dashboard template",
   "monthly sales dashboard"
  ],
  "rel": [
   "kpi-dashboard-generator",
   "mis-report-dashboard"
  ]
 },
 "kpi-dashboard-generator": {
  "tool": "excel-dashboard",
  "h1": "KPI Dashboard Generator",
  "t": "KPI Dashboard Generator: Suggested KPIs from Your Excel Data | DocBrisk",
  "d": "Upload a spreadsheet and get the right KPIs suggested for it: totals, growth, margins, completion rates and top performers. Pick them and download the dashboard. Free.",
  "lead": "Not sure which KPIs to track? Upload your data and DocBrisk suggests them, with the formula for each.",
  "body": [
   "Choosing KPIs is the hard part of any dashboard. DocBrisk reads each column's name and values to work out what it means: money, quantities, dates, regions, products, people or statuses. From that it proposes headline numbers, trends, breakdowns and rankings, and derived KPIs such as profit, profit margin, target achievement and completion rate.",
   "Every suggestion shows how it is calculated, and you tick only the ones you want. The dashboard is rebuilt instantly as you choose."
  ],
  "f": [
   [
    "What is a KPI dashboard?",
    "A one-page view of the few numbers that show how a business or team is doing, such as revenue, growth, margin and target achievement, with charts that explain them."
   ],
   [
    "How are the KPIs chosen?",
    "From the column names and the data: amounts become totals and averages, a date adds growth and trends, categories add breakdowns, and pairs such as revenue and cost add profit and margin."
   ],
   [
    "Can I change a column's meaning?",
    "Yes. Each column shows how it was read (date, number, category, name, ID); change any that are wrong and the suggestions update."
   ]
  ],
  "kw": [
   "kpi dashboard generator",
   "kpi dashboard",
   "kpi dashboard in excel",
   "kpi dashboard template",
   "kpi report maker",
   "business kpi dashboard"
  ],
  "rel": [
   "sales-dashboard-excel",
   "mis-report-dashboard"
  ]
 },
 "mis-report-dashboard": {
  "tool": "excel-dashboard",
  "h1": "MIS Report Dashboard from Excel",
  "t": "MIS Report Dashboard: Turn Excel MIS into Charts and KPIs | DocBrisk",
  "d": "Make a monthly MIS report dashboard from your Excel data in minutes: KPIs with month-on-month change, trends, breakdowns and written insights. Download as PDF or a live Excel workbook.",
  "lead": "Upload the month's MIS data and get a management-ready dashboard with month-on-month change and written insights.",
  "body": [
   "A monthly MIS report usually takes hours of pivot tables and copy-pasted charts. Upload the raw data instead: DocBrisk builds the KPI cards with change against last month, the trend charts and the breakdowns by branch, product or department, and writes the key insights in plain English.",
   "Send the PDF to management, keep the Excel workbook as next month's template, or share the HTML dashboard that anyone can open and filter."
  ],
  "f": [
   [
    "What is an MIS dashboard?",
    "A management information system report in visual form: the period's key numbers, how they changed, and where they came from."
   ],
   [
    "Can I make the MIS report every month?",
    "Yes. Keep the downloaded Excel dashboard, paste next month's rows into its Data sheet and recalculate, or upload the new file here."
   ],
   [
    "Are the insights written automatically?",
    "Yes: growth against the previous period, the best period, the biggest contributors and how concentrated the results are."
   ]
  ],
  "kw": [
   "mis report in excel",
   "mis report dashboard",
   "mis report format",
   "monthly mis report",
   "mis dashboard",
   "management report dashboard"
  ],
  "rel": [
   "sales-dashboard-excel",
   "kpi-dashboard-generator"
  ]
 },
 "power-bi-dashboard-from-excel": {
  "tool": "excel-dashboard",
  "h1": "Power BI Dashboard from Excel: Free Starter Kit",
  "t": "Power BI Dashboard from Excel: Free Kit with DAX Measures & Theme | DocBrisk",
  "d": "Upload Excel and get a Power BI starter kit: clean data, ready DAX measures, a date table, a matching theme file and a step-by-step visual build guide. Looker Studio kit too.",
  "lead": "Upload your Excel file, pick the KPIs, and download the Power BI kit: data, DAX measures, theme and build guide.",
  "body": [
   "Building a Power BI report from a spreadsheet means cleaning the data, writing DAX measures, creating a date table and choosing a layout. The kit does that groundwork: data.csv with clean headers and proper dates, measures.dax with a measure for every KPI (and month-on-month growth), a date table formula, a theme.json in your chosen colours, and a guide listing each visual and its fields.",
   "The same file also exports a Looker Studio kit with calculated fields, and an HTML dashboard that shows the finished layout before you build it."
  ],
  "f": [
   [
    "Does it create a .pbix file?",
    "No: a .pbix can only be saved by Power BI Desktop. The kit gives you everything to build it in about 15 minutes: data, measures, theme and a step-by-step guide."
   ],
   [
    "Which DAX measures are included?",
    "A measure for every KPI you picked: SUM, AVERAGE, COUNTROWS, DISTINCTCOUNT, DIVIDE-based margins and achievement, plus month-on-month change using a date table."
   ],
   [
    "Is there a Looker Studio version?",
    "Yes. The Looker Studio kit has the clean data, calculated-field formulas and a build guide."
   ]
  ],
  "kw": [
   "power bi dashboard from excel",
   "excel to power bi",
   "power bi dashboard template",
   "dax measures for sales",
   "looker studio dashboard from excel",
   "power bi starter kit"
  ],
  "rel": [
   "kpi-dashboard-generator",
   "excel-to-html-dashboard"
  ]
 },
 "excel-to-html-dashboard": {
  "tool": "excel-dashboard",
  "h1": "Interactive HTML Dashboard from Excel",
  "t": "Excel to HTML Dashboard: Interactive Charts in One File | DocBrisk",
  "d": "Convert an Excel sheet into an interactive HTML, CSS and JavaScript dashboard with filters and charts in a single file that works offline. Free, no coding.",
  "lead": "Upload Excel and download a single HTML file: an interactive dashboard with filters that opens in any browser.",
  "body": [
   "The HTML dashboard is one self-contained file: your data, the charts and the filters are all inside it. Open it on a laptop or phone, email it, or put it on any web host or intranet. It needs no internet connection, no login and no Power BI licence.",
   "Charts are crisp SVG, the layout adapts to small screens, and the filters for region, product or month recalculate every card and chart instantly."
  ],
  "f": [
   [
    "Do I need to know coding?",
    "No. Pick the KPIs and a theme; the HTML, CSS and JavaScript are written for you."
   ],
   [
    "Can I host it on my website?",
    "Yes. Upload the single .html file to any web host, Google Drive or an intranet."
   ],
   [
    "Does it work offline?",
    "Yes. Everything, including the data, is inside the file."
   ]
  ],
  "kw": [
   "excel to html dashboard",
   "html dashboard from excel",
   "interactive dashboard html",
   "javascript dashboard from excel",
   "dashboard in html css js",
   "offline dashboard"
  ],
  "rel": [
   "power-bi-dashboard-from-excel",
   "sales-dashboard-excel"
  ]
 }
});
// A search owned by a landing page is not claimed by its tool page as well.
for (const L of Object.values(LANDINGS)) {
  if (KW[L.tool]) KW[L.tool] = KW[L.tool].filter((q) => L.kw.indexOf(q) === -1);
}
// Short URLs that match a tool exactly go to the tool, so one page ranks.
const REDIRECTS = { '/excel-dashboard': '/tool/excel-dashboard', '/dashboard-maker': '/tool/excel-dashboard', '/income-tax-calculator': '/tool/income-tax-calculator', '/emi-calculator': '/tool/emi-calculator', '/sip-calculator': '/tool/sip-calculator', '/fd-calculator': '/tool/fd-calculator', '/jpg-to-pdf': '/tool/image-to-pdf', '/pdf-to-jpg': '/tool/pdf-to-image', '/passport-size-photo-maker': '/tool/photo-studio' };

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

const GROUPS = [["excel-dashboard", "sheet-to-pdf", "extract-tables", "pdf-to-excel", "mail-merge", "invoice-maker"], ["income-tax-calculator","emi-calculator","sip-calculator","fd-calculator","salary-slip","rent-receipt","gst-calculator"], ["biodata-maker", "letter-maker", "cv-studio", "salary-slip", "rent-receipt", "invoice-maker", "id-card"], ["gst-calculator", "gstin-validator", "invoice-maker", "amount-in-words", "pan-aadhaar-validator", "salary-slip", "rent-receipt"], ["age-calculator", "cgpa-calculator", "exam-photo", "image-compressor", "cv-studio", "letter-maker"], ["photo-studio", "exam-photo", "image-compressor", "doc-scanner", "id-card", "cv-studio", "ocr-pdf", "image-to-pdf"], ["pdf-editor", "sign-pdf", "redact-pdf", "smart-redact", "clean-metadata", "unlock-pdf", "protect-pdf", "watermark-pdf", "remove-watermark", "number-pdf", "doc-integrity"], ["merge-pdf", "split-by-size", "organize-pdf", "compress-pdf", "resize-pdf", "impose-pdf", "clean-scan", "batch-process", "compare-pdf"], ["pdf-to-word", "word-to-pdf", "pdf-to-excel", "extract-tables", "sheet-to-pdf", "pdf-to-image", "image-to-pdf", "pdf-to-ppt", "extract-images", "translate-pdf", "ocr-pdf"], ["qr-maker", "qr-stamp", "invoice-maker", "mail-merge", "sheet-to-pdf"]];

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
  'security': ['Security | DocBrisk', 'How DocBrisk keeps your documents and your account secure.', 'Security'],
  'guides':   ['Guides: Ready Formats, Sizes & How-tos | DocBrisk', 'Ready formats and step-by-step guides: leave and bank applications, biodata, GST, salary slips, and photo and PDF sizes for forms. Free tools.', 'Guides and ready formats']
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
  // Each group is a <details>, so phones get a short, tappable directory. Search engines still read closed details.
  const group = (title, items) => '<details class="dir-group"><summary><h2>' + esc(title) + ' <span class="n">' + items.length + '</span></h2></summary>' +
    '<ul>' + items.join('') + '</ul></details>';
  return '<section class="prose" id="all-tools" style="margin-top:32px">' +
    group('All DocBrisk tools', Object.keys(TOOLS).map((s) => '<li>' + toolLink(s) + '</li>')) +
    group('Photo and signature size by exam', Object.keys(EXAMS).map((s) => '<li><a href="/exam/' + s + '">' + esc(examH1(EXAMS[s])) + '</a></li>')) +
    group('Popular guides', Object.keys(LANDINGS).map((s) => '<li><a href="/' + s + '">' + esc(LANDINGS[s].h1) + '</a></li>')) +
    '</section>';
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
  } else if (t.calc) {
    list.push(['Is what I type sent to a server?', 'No. ' + t.t + ' runs as JavaScript inside your own browser tab. Nothing you type is transmitted, and it keeps working without internet once the page has loaded.']);
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
/* v4.6: guides for the new tools, and for three tools that already rank. */
Object.assign(GUIDES, {
 "image-compressor": {
  "title": "How to reduce image size to 20 KB, 50 KB or 100 KB",
  "intro": [
   "Online forms rarely accept a photo straight from a phone camera. A camera picture is 2 to 8 MB, while a recruitment, scholarship or admission portal usually wants something between 10 KB and 200 KB, and many print the limit as a range such as \"20 KB to 50 KB\". The compressor works to the number you type, on your own device."
  ],
  "sections": [
   {
    "h": "What decides the size of a photo",
    "body": [
     {
      "ul": [
       "Pixel size. A 4000 × 3000 picture holds 12 million pixels; a form photo of 200 × 230 holds 46,000. Fewer pixels means a smaller file.",
       "JPG quality. Lower quality drops fine detail the eye barely notices. This is where most of the saving comes from.",
       "Format. JPG is right for photos. PNG keeps every pixel and stays large, so use it only for logos, screenshots and transparent backgrounds."
      ]
     }
    ]
   },
   {
    "h": "How the compressor reaches your target",
    "body": [
     {
      "ol": [
       "It lowers JPG quality step by step and keeps the best quality that fits your limit.",
       "If quality alone cannot get there, it makes the picture a little smaller, tries again, and shows the final pixel size.",
       "If you set a minimum as well and the file comes out below it, the JPG is padded inside the file, so the picture itself does not change."
      ]
     }
    ]
   },
   {
    "h": "Sizes that forms commonly ask for",
    "body": [
     "A passport-style photo is usually 3.5 × 4.5 cm; at 200 DPI that is 276 × 354 pixels. Signatures are often 10 KB to 20 KB. For a specific exam, the [exam photo and signature resizer](/tool/exam-photo) has the sizes for SSC, Railway, IBPS, UPSC, NEET and JEE built in. To put certificates into one file, use [Image to PDF](/tool/image-to-pdf), then [compress the PDF](/tool/compress-pdf) to the portal's limit."
    ]
   }
  ],
  "hi": {
   "title": "फ़ोटो का साइज़ 20 KB, 50 KB या 100 KB कैसे करें",
   "body": [
    "ऑनलाइन फ़ॉर्म में फ़ोन से खींची गई फ़ोटो सीधे अपलोड नहीं होती, क्योंकि वह कई MB की होती है और फ़ॉर्म 20 KB, 50 KB या 100 KB जैसी सीमा माँगता है।",
    {
     "ol": [
      "अपनी फ़ोटो चुनें। एक साथ कई फ़ोटो भी चुन सकते हैं।",
      "जितने KB चाहिए वह लिखें, या 20, 50, 100 KB का बटन दबाएँ। फ़ॉर्म में न्यूनतम सीमा भी हो तो दूसरा खाना भरें।",
      "ज़रूरत हो तो चौड़ाई और ऊँचाई पिक्सल या सेंटीमीटर में डालें।",
      "Compress दबाएँ और फ़ोटो डाउनलोड करें। फ़ोटो आपके फ़ोन से बाहर नहीं जाती।"
     ]
    }
   ]
  }
 },
 "gst-calculator": {
  "title": "How GST is calculated, with the current slabs",
  "intro": [
   "GST is charged on the taxable value of a sale. If you know the price before tax, you add GST. If you only know the final price, you work backwards to find how much of it is tax. The calculator does both and shows the split you need on an invoice."
  ],
  "sections": [
   {
    "h": "The two formulas",
    "body": [
     {
      "ul": [
       "Adding GST: tax = price × rate ÷ 100, and total = price + tax. For ₹1,000 at 18%, the tax is ₹180 and the total is ₹1,180.",
       "Removing GST: price = total ÷ (1 + rate ÷ 100). For a total of ₹1,180 at 18%, the price is ₹1,000 and the tax is ₹180."
      ]
     },
     "A common mistake is to take 18% off the total. 18% of ₹1,180 is ₹212.40, which is too much; the tax inside ₹1,180 is ₹180."
    ]
   },
   {
    "h": "CGST, SGST and IGST",
    "body": [
     "For a sale inside one state the tax is split equally into CGST and SGST, so 18% becomes 9% + 9%. For a sale to another state the whole amount is charged as IGST. The total is the same either way. The first two digits of a GSTIN are the state code; the [GSTIN validator](/tool/gstin-validator) decodes it, and the full [GST state code list](/gst-state-code-list) has every code."
    ]
   },
   {
    "h": "GST rates from 22 September 2025",
    "body": [
     "The GST Council replaced the old four-slab structure with two main rates. Most goods and services now fall under 5% or 18%, and a 40% rate applies to a short list of luxury and sin goods. Special rates such as 3% on gold and silver continue, and many essentials are exempt. The 12% and 28% buttons are kept for bills dated before the change. Always confirm the rate for your product's HSN or SAC code on the official GST portal. When you are ready to bill, the [GST invoice maker](/tool/invoice-maker) builds the invoice with a UPI QR."
    ]
   }
  ],
  "hi": {
   "title": "GST कैसे निकालें",
   "body": [
    "GST जोड़ने के लिए: कीमत × दर ÷ 100। जैसे ₹1,000 पर 18% GST ₹180 होता है और कुल रकम ₹1,180।",
    "GST हटाने (रिवर्स GST) के लिए: कुल रकम ÷ (1 + दर ÷ 100)। जैसे ₹1,180 में से 18% GST हटाने पर मूल कीमत ₹1,000 आती है।",
    "राज्य के अंदर बिक्री पर GST आधा CGST और आधा SGST में बँटता है। दूसरे राज्य में बिक्री पर पूरा IGST लगता है। 22 सितंबर 2025 से ज़्यादातर सामान और सेवाओं पर 5% या 18% GST है।"
   ]
  }
 },
 "age-calculator": {
  "title": "How age is counted for exam and job forms",
  "intro": [
   "A recruitment notice does not ask how old you are today. It fixes a cut-off date, often called the crucial date, and your age on that one day decides whether you can apply. The cut-off is printed in the notification, for example \"age as on 1 August 2026\"."
  ],
  "sections": [
   {
    "h": "Minimum and maximum age",
    "body": [
     "Most central government notices say a candidate must have attained the minimum age and must not have attained the maximum age on the cut-off date. With limits of 18 to 27 years on 1 August 2026, you must have turned 18 on or before that day, and you must not yet have turned 27. Notices express the same thing as a date-of-birth range, such as \"born not earlier than 2 August 1999 and not later than 1 August 2008\". The calculator shows this range so you can compare it with the notice."
    ]
   },
   {
    "h": "Age relaxation",
    "body": [
     "Relaxation is added to the upper limit only. It varies by exam and category: many central government exams give 3 years to OBC (non-creamy layer), 5 years to SC and ST, and 10 years to persons with benchmark disabilities, with separate rules for ex-servicemen and for state exams. Enter the years your notice gives in the Relaxation box."
    ]
   },
   {
    "h": "Getting the date of birth right",
    "body": [
     {
      "ul": [
       "Use the date of birth printed on your Class 10 certificate. That is the one commissions accept.",
       "A wrong date of birth in the form is a common reason for rejection at document verification.",
       "Once the form is filled, prepare the uploads with the [exam photo and signature resizer](/tool/exam-photo)."
      ]
     }
    ]
   }
  ],
  "hi": {
   "title": "फ़ॉर्म के लिए उम्र कैसे निकालें",
   "body": [
    "सरकारी नौकरी और परीक्षा के फ़ॉर्म में आपकी उम्र आज की तारीख़ से नहीं, बल्कि नोटिफ़िकेशन में दी गई कट-ऑफ़ तारीख़ से गिनी जाती है, जैसे \"1 अगस्त 2026 को आयु\"।",
    {
     "ol": [
      "अपनी जन्म तिथि डालें (10वीं के प्रमाण-पत्र वाली)।",
      "\"Age as on\" में नोटिफ़िकेशन की कट-ऑफ़ तारीख़ डालें।",
      "न्यूनतम और अधिकतम आयु तथा छूट (OBC, SC/ST आदि) के साल भरें।",
      "नतीजे में आपकी उम्र साल, महीने और दिन में दिखेगी, और यह भी कि आप आयु सीमा में हैं या नहीं।"
     ]
    }
   ]
  }
 },
 "salary-slip": {
  "title": "What goes on a salary slip",
  "intro": [
   "A salary slip, or payslip, is the monthly record an employer gives an employee showing what was earned, what was deducted and what was paid. Banks ask for the last three months' slips for loans and credit cards, and a new employer may ask for them at joining."
  ],
  "sections": [
   {
    "h": "Earnings",
    "body": [
     {
      "ul": [
       "Basic pay: the fixed core of the salary, on which provident fund and gratuity are calculated.",
       "House Rent Allowance (HRA): paid towards rent, and partly tax-exempt under the old tax regime if you pay rent.",
       "Conveyance, special and other allowances: the remaining fixed components.",
       "Bonus, overtime or incentives, when they are paid in that month."
      ]
     }
    ]
   },
   {
    "h": "Deductions",
    "body": [
     {
      "ul": [
       "Provident Fund (PF): the employee's contribution, normally 12% of basic pay plus dearness allowance.",
       "Professional tax: a state tax, so the amount depends on the state and the salary slab.",
       "Income tax (TDS): tax deducted by the employer on salary.",
       "ESI, loan instalments or advances, where they apply."
      ]
     },
     "Net pay is total earnings minus total deductions. It should match the amount credited to the bank account."
    ]
   },
   {
    "h": "For employers without payroll software",
    "body": [
     "Fill the slip once and the details stay on your device, so next month you change only the month and any amounts that differ. Issue slips only for salary that was actually paid. For a formal proof of income, also give a [salary certificate](/salary-certificate-format) on the company letterhead. Employees claiming HRA can make their [rent receipts](/tool/rent-receipt) the same way."
    ]
   }
  ],
  "hi": {
   "title": "सैलरी स्लिप कैसे बनाएँ",
   "body": [
    "सैलरी स्लिप (वेतन पर्ची) में महीने की कमाई, कटौती और हाथ में आने वाला वेतन लिखा होता है। बैंक लोन और क्रेडिट कार्ड के लिए पिछले तीन महीनों की स्लिप माँगते हैं।",
    {
     "ol": [
      "कंपनी का नाम, महीना और कर्मचारी का विवरण भरें।",
      "कमाई (बेसिक, HRA, भत्ते) और कटौती (PF, प्रोफ़ेशनल टैक्स, TDS) की रकम डालें। कोई भी पंक्ति जोड़ या बदल सकते हैं।",
      "नेट वेतन अपने आप निकलता है और शब्दों में भी लिखा जाता है।",
      "Download PDF दबाकर A4 साइज़ की स्लिप डाउनलोड करें।"
     ]
    }
   ]
  }
 },
 "rent-receipt": {
  "title": "Rent receipts for an HRA claim: what your employer needs",
  "intro": [
   "If House Rent Allowance is part of your salary and you live in a rented home, you can claim an exemption on it under the old tax regime. Your employer asks for proof before reducing the tax deducted from your salary, and that proof is a set of rent receipts, usually collected between December and February."
  ],
  "sections": [
   {
    "h": "What a rent receipt should contain",
    "body": [
     {
      "ul": [
       "The tenant's name and the landlord's name.",
       "The address of the rented home.",
       "The rent amount, the period it covers and the date of the receipt.",
       "The landlord's signature.",
       "The landlord's PAN, if the rent is more than ₹1,00,000 a year.",
       "A revenue stamp, if more than ₹5,000 was paid in cash against that receipt."
      ]
     }
    ]
   },
   {
    "h": "Rules worth knowing",
    "body": [
     {
      "ul": [
       "The HRA exemption is not available under the new tax regime. Check with your employer which regime you have chosen.",
       "If the yearly rent is above ₹1,00,000 and the landlord has no PAN, employers ask for a signed declaration from the landlord instead.",
       "Pay rent by bank transfer or UPI where you can. The bank entry backs up the receipt if the tax department asks.",
       "Keep a rent agreement as well. You can prepare one with the [rent agreement format](/rent-agreement-format)."
      ]
     }
    ]
   },
   {
    "h": "Monthly or quarterly?",
    "body": [
     "Most employers accept one receipt per month, and some accept one per quarter. The generator makes a receipt for every month you choose, three to an A4 page, numbered in order. Print them, have the landlord sign each one, and submit copies with your investment declaration."
    ]
   }
  ],
  "hi": {
   "title": "HRA के लिए किराये की रसीद कैसे बनाएँ",
   "body": [
    "अगर आपके वेतन में HRA मिलता है और आप किराये के मकान में रहते हैं, तो पुरानी टैक्स व्यवस्था में HRA पर छूट मिल सकती है। इसके लिए कंपनी किराये की रसीदें माँगती है।",
    {
     "ol": [
      "किरायेदार और मकान मालिक का नाम, मकान का पता और मासिक किराया भरें।",
      "पहला महीना और कुल महीने चुनें, जैसे अप्रैल से 12 महीने।",
      "साल का किराया ₹1,00,000 से ज़्यादा हो तो मकान मालिक का PAN ज़रूर लिखें।",
      "PDF डाउनलोड करके प्रिंट करें और हर रसीद पर मकान मालिक के हस्ताक्षर करवाएँ। ₹5,000 से ज़्यादा नकद भुगतान पर रेवेन्यू स्टाम्प लगाएँ।"
     ]
    }
   ]
  }
 },
 "biodata-maker": {
  "title": "How to write a marriage biodata that reads well",
  "intro": [
   "A marriage biodata is usually the first thing two families share, often as a PDF on WhatsApp. One clear page with the right details works better than three crowded ones."
  ],
  "sections": [
   {
    "h": "What to include",
    "body": [
     {
      "ul": [
       "Personal details: full name, date, time and place of birth, height, education, occupation and income.",
       "Family details: parents' names and occupations, brothers and sisters, and the native place.",
       "Horoscope details such as gotra, rashi, nakshatra and manglik status, if your family looks at them. Leave them blank and they do not appear.",
       "Contact details of the person families should call, usually a parent.",
       "One good photo: recent, well lit, with a plain background."
      ]
     }
    ]
   },
   {
    "h": "Tips",
    "body": [
     {
      "ul": [
       "Keep it to one page. Empty fields are left out automatically, so the layout stays balanced.",
       "Write education and work plainly: degree, institute, role, employer and city.",
       "Check every phone number and spelling before sharing. The PDF will be forwarded many times.",
       "Choose the language the other family reads most easily: Hindi, English, Marathi or Gujarati."
      ]
     }
    ]
   },
   {
    "h": "Photo and file size",
    "body": [
     "For the photo, the [passport photo maker](/tool/photo-studio) can clean up the background first. If a matrimonial site limits the upload size, [compress the PDF](/tool/compress-pdf) or [reduce the photo](/tool/image-compressor) to the size it asks for."
    ]
   }
  ],
  "hi": {
   "title": "शादी का बायोडाटा कैसे बनाएँ",
   "body": [
    "शादी के बायोडाटा में व्यक्तिगत विवरण (नाम, जन्म तिथि, जन्म समय और स्थान, कद, शिक्षा, व्यवसाय), पारिवारिक विवरण और संपर्क विवरण लिखे जाते हैं। गोत्र, राशि, नक्षत्र और मांगलिक जैसी जानकारी ज़रूरत हो तो भरें, नहीं तो ख़ाली छोड़ दें।",
    {
     "ol": [
      "भाषा चुनें: हिन्दी, English, मराठी या ગુજરાતી।",
      "डिज़ाइन चुनें और फ़ोटो लगाएँ।",
      "विवरण भरें। जो खाने ख़ाली छोड़ेंगे वे बायोडाटा में नहीं दिखेंगे।",
      "Download PDF दबाएँ और WhatsApp पर भेजें या प्रिंट करें।"
     ]
    }
   ]
  }
 },
 "letter-maker": {
  "title": "How to write a formal application or letter",
  "intro": [
   "Schools, offices and banks expect applications in a fixed order. Get the order right and the letter is read; miss the subject line or the date and it may be sent back."
  ],
  "sections": [
   {
    "h": "The standard format",
    "body": [
     {
      "ol": [
       "Who it is addressed to: the designation, the organisation and the city.",
       "The date.",
       "A one-line subject that says what you want.",
       "The salutation, such as Respected Sir/Madam.",
       "The body: who you are, what you need and why, in two or three short paragraphs.",
       "The closing: Thanking you, Yours faithfully or Yours obediently, then your name and details."
      ]
     }
    ]
   },
   {
    "h": "Formats ready to fill",
    "body": [
     "Each of these opens with the right format already chosen: [leave application for school](/leave-application-for-school), [leave application in Hindi](/leave-application-in-hindi), [application to a bank manager](/application-to-bank-manager), [TC application](/tc-application), [resignation letter](/resignation-letter-format), [experience certificate](/experience-certificate-format), [relieving letter](/relieving-letter-format), [offer letter](/offer-letter-format), [authorisation letter](/authorization-letter-format) and [rent agreement](/rent-agreement-format)."
    ]
   },
   {
    "h": "Before you hand it in",
    "body": [
     {
      "ul": [
       "Tap the letter to change any sentence so it matches your situation.",
       "Print it, sign it by hand, and attach any proof the letter mentions.",
       "Keep a copy or a photo of the signed letter for your records."
      ]
     }
    ]
   }
  ],
  "hi": {
   "title": "आवेदन पत्र कैसे लिखें",
   "body": [
    "औपचारिक आवेदन पत्र का एक तय क्रम होता है: सेवा में (किसे लिख रहे हैं), दिनांक, विषय, संबोधन (महोदय), मुख्य भाग, धन्यवाद और अंत में आपका नाम।",
    {
     "ol": [
      "पत्र का प्रकार चुनें, जैसे छुट्टी के लिए आवेदन, बैंक मैनेजर को आवेदन या टी.सी. के लिए प्रार्थना पत्र।",
      "अपना नाम, तारीख़ और कारण भरें।",
      "पत्र पर टैप करके कोई भी पंक्ति बदल सकते हैं।",
      "Download PDF दबाएँ, फिर प्रिंट करके हस्ताक्षर करें।"
     ]
    }
   ]
  }
 },
 "gstin-validator": {
  "title": "How to read a GST number",
  "intro": [
   "A GSTIN is a 15-character number. Every part of it means something, which is why a typing mistake can be caught before you file a return or raise an invoice."
  ],
  "sections": [
   {
    "h": "The 15 characters",
    "body": [
     {
      "ul": [
       "Characters 1 and 2: the state code, such as 27 for Maharashtra or 07 for Delhi.",
       "Characters 3 to 12: the PAN of the business.",
       "Character 13: the registration number of that PAN within the state (1 to 9, then A to Z).",
       "Character 14: Z by default.",
       "Character 15: a check digit calculated from the first 14 characters."
      ]
     }
    ]
   },
   {
    "h": "What a format check can and cannot tell you",
    "body": [
     "A correct check digit means the number was typed correctly. It does not mean the registration is active, or that it belongs to the business named on the invoice. Before you claim input tax credit on a large invoice, search the GSTIN on the official GST portal and compare the legal name. The full [GST state code list](/gst-state-code-list) is on its own page, and the [GST calculator](/tool/gst-calculator) splits tax into CGST, SGST or IGST."
    ]
   }
  ],
  "hi": {
   "title": "GST नंबर कैसे जाँचें",
   "body": [
    "GSTIN 15 अक्षरों का होता है: पहले दो अंक राज्य का कोड, अगले दस अक्षर PAN, तेरहवाँ पंजीकरण क्रमांक, चौदहवाँ Z और आख़िरी अंक चेक डिजिट।",
    "यह टूल बताता है कि नंबर सही ढंग से बना है या टाइप करने में गलती हुई है। नंबर चालू (Active) है या नहीं, यह GST पोर्टल पर जाँचें।"
   ]
  }
 }
});
/* ---------- v4.7: guides for the money calculators ---------- */
Object.assign(GUIDES, {
 "income-tax-calculator": {
  "title": "How income tax is calculated in FY 2026-27",
  "intro": [
   "Your tax depends on your taxable income, which is your gross income minus the deductions your regime allows, and on the slab rates of the regime you choose. The new regime is the default; salaried people can still pick the old one each year when they file their return."
  ],
  "sections": [
   {
    "h": "New regime slabs",
    "body": [
     {
      "ul": [
       "Up to ₹4 lakh: nil",
       "₹4 to 8 lakh: 5%",
       "₹8 to 12 lakh: 10%",
       "₹12 to 16 lakh: 15%",
       "₹16 to 20 lakh: 20%",
       "₹20 to 24 lakh: 25%",
       "Above ₹24 lakh: 30%"
      ]
     },
     "Salaried people and pensioners get a ₹75,000 standard deduction. If taxable income is ₹12 lakh or less, a rebate of up to ₹60,000 wipes out the tax, so a salary of ₹12.75 lakh pays nothing. Most other deductions, such as 80C, HRA and home loan interest on a self-occupied house, are not allowed; the employer's NPS contribution is."
    ]
   },
   {
    "h": "Old regime slabs",
    "body": [
     "Nil up to ₹2.5 lakh (₹3 lakh from 60 to 79 years, ₹5 lakh at 80 and above), 5% up to ₹5 lakh, 20% from ₹5 to 10 lakh and 30% above ₹10 lakh. The standard deduction is ₹50,000 and the rebate makes taxable income up to ₹5 lakh tax-free. In return you can claim deductions: 80C up to ₹1.5 lakh, 80D for health insurance, HRA, home loan interest up to ₹2 lakh, ₹50,000 more for NPS and others."
    ]
   },
   {
    "h": "Worked examples",
    "body": [
     {
      "ul": [
       "Salary ₹10 lakh: nil in the new regime; ₹1,06,600 in the old regime with no deductions, or ₹59,800 with ₹2.25 lakh of deductions.",
       "Salary ₹15 lakh: ₹97,500 in the new regime; ₹1,87,200 in the old regime with ₹2.25 lakh of deductions.",
       "Salary ₹20 lakh: ₹1,92,400 in the new regime; ₹2,96,400 in the old regime even with ₹3.75 lakh of deductions."
      ]
     },
     "All figures include the 4% cess. Use the [salary slip generator](/tool/salary-slip) to lay out the monthly pay and the [rent receipt generator](/tool/rent-receipt) for an HRA claim."
    ]
   },
   {
    "h": "Surcharge and cess",
    "body": [
     "A surcharge of 10% applies above ₹50 lakh of income, 15% above ₹1 crore and 25% above ₹2 crore (and 37% above ₹5 crore in the old regime only), with marginal relief at each step. A 4% health and education cess is then added to the tax and surcharge."
    ]
   }
  ],
  "hi": {
   "title": "इनकम टैक्स कैसे निकालें (FY 2026-27)",
   "body": [
    "नई टैक्स व्यवस्था में ₹4 लाख तक कोई टैक्स नहीं, ₹4–8 लाख पर 5%, ₹8–12 लाख पर 10%, ₹12–16 लाख पर 15%, ₹16–20 लाख पर 20%, ₹20–24 लाख पर 25% और ₹24 लाख से ऊपर 30% टैक्स है।",
    "₹12 लाख तक की टैक्सेबल आय पर ₹60,000 तक की छूट (रिबेट) मिलती है, इसलिए वेतनभोगी लोगों के लिए ₹75,000 की स्टैंडर्ड डिडक्शन के साथ ₹12.75 लाख तक की सैलरी टैक्स-फ्री है।",
    "पुरानी व्यवस्था में 80C, HRA, 80D और होम लोन ब्याज जैसी छूट मिलती है। कैलकुलेटर दोनों व्यवस्थाओं का टैक्स साथ-साथ दिखाता है और बताता है कि कौन सी सस्ती है।"
   ]
  }
 },
 "emi-calculator": {
  "title": "How a loan EMI is worked out, and how prepayment saves interest",
  "intro": [
   "An EMI (equated monthly instalment) is the same amount every month, but what it pays for changes. Early EMIs are mostly interest; later ones are mostly principal. That is why a part payment in the early years saves so much."
  ],
  "sections": [
   {
    "h": "The EMI formula",
    "body": [
     "EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), where P is the loan amount, r is the monthly rate (the annual rate ÷ 12 ÷ 100) and n is the number of months. Banks call this the reducing-balance method: each month's interest is charged only on the balance still owed."
    ]
   },
   {
    "h": "Typical EMIs",
    "body": [
     {
      "ul": [
       "Home loan ₹30 lakh at 8.5% for 20 years: ₹26,035 a month, about ₹32.5 lakh of interest.",
       "Home loan ₹50 lakh at 8.5% for 20 years: ₹43,391 a month.",
       "Car loan ₹8 lakh at 9.5% for 5 years: ₹16,801 a month.",
       "Personal loan ₹5 lakh at 12% for 3 years: ₹16,607 a month.",
       "Education loan ₹10 lakh at 10% for 7 years: ₹16,601 a month."
      ]
     }
    ]
   },
   {
    "h": "Prepayment",
    "body": [
     "A part payment is taken off the principal at once. If the EMI stays the same, the loan simply ends earlier. On the ₹30 lakh loan above, paying ₹5 lakh after the twelfth EMI ends the loan 73 EMIs early and saves about ₹14.1 lakh of interest. RBI rules do not let banks charge a prepayment penalty on floating-rate loans to individuals."
    ]
   },
   {
    "h": "Tax benefits on a home loan",
    "body": [
     "In the old regime you can claim up to ₹2 lakh of interest on a self-occupied house and up to ₹1.5 lakh of principal under 80C. The new regime does not allow these for a self-occupied house. The [income tax calculator](/tool/income-tax-calculator) shows which regime works out cheaper with your loan."
    ]
   }
  ],
  "hi": {
   "title": "EMI कैसे निकालें",
   "body": [
    "EMI = P × r × (1 + r)^n ÷ ((1 + r)^n − 1), जहाँ P लोन की रकम, r मासिक ब्याज दर (सालाना दर ÷ 12 ÷ 100) और n महीनों की संख्या है।",
    "₹30 लाख के होम लोन पर 8.5% ब्याज और 20 साल की अवधि पर EMI ₹26,035 होती है।",
    "बीच में कुछ रकम जमा (प्रीपेमेंट) करने से मूलधन घटता है और लोन जल्दी खत्म होता है, जिससे ब्याज की बड़ी बचत होती है।"
   ]
  }
 },
 "sip-calculator": {
  "title": "How SIP returns are calculated",
  "intro": [
   "A SIP (systematic investment plan) puts a fixed amount into a mutual fund every month. Each instalment buys units at that day's price and then compounds for the time it stays invested, so the early instalments do most of the growing."
  ],
  "sections": [
   {
    "h": "The formula",
    "body": [
     "FV = P × ((1 + i)^n − 1) ÷ i × (1 + i). P is the monthly amount, i is the expected yearly return ÷ 12 ÷ 100, and n is the number of months. For a lumpsum, FV = P × (1 + r ÷ 100)^years."
    ]
   },
   {
    "h": "Examples at an assumed 12% a year",
    "body": [
     {
      "ul": [
       "₹5,000 a month for 10 years: about ₹11.6 lakh on ₹6 lakh invested.",
       "₹10,000 a month for 20 years: about ₹99.9 lakh on ₹24 lakh invested.",
       "₹10,000 a month raised 10% every year for 20 years: about ₹1.99 crore on ₹68.7 lakh invested.",
       "₹1 lakh invested once for 20 years: about ₹9.6 lakh."
      ]
     }
    ]
   },
   {
    "h": "Reaching ₹1 crore",
    "body": [
     "At 12% a year you need about ₹10,000 a month for 20 years, ₹19,800 for 15 years or ₹43,000 for 10 years. Starting earlier matters more than the amount: five extra years roughly halve the monthly SIP you need."
    ]
   },
   {
    "h": "Returns are not guaranteed",
    "body": [
     "Equity fund returns swing from year to year, and the long-run average can turn out lower than you assume. Try a cautious rate such as 8 to 10% as well, and remember the effect of inflation: at 6% inflation, ₹1 crore in 20 years buys what about ₹31 lakh buys today."
    ]
   }
  ],
  "hi": {
   "title": "SIP रिटर्न कैसे निकालें",
   "body": [
    "SIP में हर महीने एक तय रकम म्यूचुअल फंड में लगती है। FV = P × ((1 + i)^n − 1) ÷ i × (1 + i), जहाँ i = सालाना रिटर्न ÷ 12 ÷ 100।",
    "12% सालाना रिटर्न मानकर ₹10,000 महीना 20 साल तक लगाने पर लगभग ₹1 करोड़ बनते हैं।",
    "म्यूचुअल फंड का रिटर्न तय नहीं होता, इसलिए कम रिटर्न मानकर भी हिसाब देख लें।"
   ]
  }
 },
 "fd-calculator": {
  "title": "How FD, RD and PPF interest is calculated",
  "intro": [
   "Fixed deposits, recurring deposits and PPF all pay compound interest, but they add it at different intervals. That interval, more than the headline rate, decides how much you end up with."
  ],
  "sections": [
   {
    "h": "Fixed deposit",
    "body": [
     "Most banks compound FD interest every quarter: maturity = P × (1 + r ÷ 400)^(4 × years). ₹1 lakh at 7% for a year becomes ₹1,07,186, an effective yield of 7.19%. If you take the interest out monthly or quarterly instead, it is paid as simple interest and does not compound. Banks deduct TDS once the interest from one bank passes ₹50,000 a year (₹1 lakh for senior citizens), unless you file Form 15G or 15H."
    ]
   },
   {
    "h": "Recurring deposit",
    "body": [
     "In an RD you deposit the same amount every month. Each instalment earns quarterly compounded interest for the months it stays in, so the first instalment earns the most and the last the least. ₹5,000 a month for 24 months at 7% matures at about ₹1,29,100 on ₹1,20,000 deposited."
    ]
   },
   {
    "h": "PPF",
    "body": [
     "The Public Provident Fund runs for 15 years and can be extended in blocks of 5 years. You can deposit ₹500 to ₹1,50,000 a year. Interest is worked out on the lowest balance between the 5th and the end of each month and added once a year, so deposit before 5 April to earn for the whole year. The rate is 7.1% for October to December 2026. Deposits qualify for 80C in the old regime, and the interest and maturity are tax-free."
    ]
   },
   {
    "h": "PPF maturity at 7.1%",
    "body": [
     {
      "ul": [
       "₹1 lakh a year for 15 years: about ₹27.1 lakh.",
       "₹1.5 lakh a year for 15 years: about ₹40.7 lakh.",
       "₹1.5 lakh a year for 20 years: about ₹66.6 lakh.",
       "₹1.5 lakh a year for 25 years: about ₹1.03 crore."
      ]
     }
    ]
   }
  ],
  "hi": {
   "title": "FD, RD और PPF का ब्याज कैसे निकालें",
   "body": [
    "ज़्यादातर बैंक FD पर हर तिमाही ब्याज जोड़ते हैं। ₹1 लाख की FD 7% पर एक साल में ₹1,07,186 हो जाती है।",
    "RD में हर महीने की किस्त पर तिमाही चक्रवृद्धि ब्याज मिलता है।",
    "PPF 15 साल का खाता है जिसमें सालाना ₹500 से ₹1,50,000 तक जमा कर सकते हैं। अक्टूबर–दिसंबर 2026 के लिए ब्याज दर 7.1% है और ब्याज टैक्स-फ्री है।"
   ]
  }
 }
});

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
    'applicationCategory': t.fin ? 'FinanceApplication' : 'BusinessApplication',
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

/* Reference tables a landing page can show (L.tbl), e.g. the GST state codes. */
const LANDING_TABLES = { GST_STATES: { caption: 'GST state codes', head: ['Code', 'State or union territory'], rows: [["01", "Jammu and Kashmir"], ["02", "Himachal Pradesh"], ["03", "Punjab"], ["04", "Chandigarh"], ["05", "Uttarakhand"], ["06", "Haryana"], ["07", "Delhi"], ["08", "Rajasthan"], ["09", "Uttar Pradesh"], ["10", "Bihar"], ["11", "Sikkim"], ["12", "Arunachal Pradesh"], ["13", "Nagaland"], ["14", "Manipur"], ["15", "Mizoram"], ["16", "Tripura"], ["17", "Meghalaya"], ["18", "Assam"], ["19", "West Bengal"], ["20", "Jharkhand"], ["21", "Odisha"], ["22", "Chhattisgarh"], ["23", "Madhya Pradesh"], ["24", "Gujarat"], ["25", "Daman and Diu"], ["26", "Dadra and Nagar Haveli and Daman and Diu"], ["27", "Maharashtra"], ["28", "Andhra Pradesh (old)"], ["29", "Karnataka"], ["30", "Goa"], ["31", "Lakshadweep"], ["32", "Kerala"], ["33", "Tamil Nadu"], ["34", "Puducherry"], ["35", "Andaman and Nicobar Islands"], ["36", "Telangana"], ["37", "Andhra Pradesh"], ["38", "Ladakh"], ["97", "Other Territory"], ["99", "Centre Jurisdiction"]] } };
function landingTableHtml(L) {
  const T = L.tbl && LANDING_TABLES[L.tbl];
  if (!T) return '';
  const cell = 'style="text-align:left;padding:7px 10px;border-bottom:1px solid #e2e8f0"';
  return '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.92rem">' +
    '<caption style="text-align:left;font-weight:700;padding:6px 0">' + esc(T.caption) + '</caption>' +
    '<thead><tr>' + T.head.map((h) => '<th ' + cell + '>' + esc(h) + '</th>').join('') + '</tr></thead>' +
    '<tbody>' + T.rows.map((r) => '<tr>' + r.map((c) => '<td ' + cell + '>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
}

/* ---------- landing pages (v4.4) ---------- */
function landingFaq(slug) {
  const L = LANDINGS[slug], t = TOOLS[L.tool];
  if (t.calc) return L.f.concat([['Is it free, and is what I type sent anywhere?', 'Yes, it is free, with no sign-up. Everything is worked out inside your browser, so nothing you type is sent to a server.']]);
  const free = t.pro
    ? 'It is part of DocBrisk Pro (₹' + PRO_PRICE + ' a month)' + (TRIALS[L.tool] ? ', and every free account can use it ' + TRIALS[L.tool] + ' times first' : '') + '. '
    : 'Yes, it is free, with no sign-up and no watermark. ';
  return L.f.concat([['Is it free, and is my file uploaded?', free + 'Your file is processed inside your browser and is never uploaded to a server.']]);
}

function landingAboutHtml(slug) {
  const L = LANDINGS[slug], t = TOOLS[L.tool];
  const faq = landingFaq(slug).map((f) => '<details><summary>' + esc(f[0]) + '</summary><p>' + esc(f[1]) + '</p></details>').join('');
  const rel = L.rel.filter((s) => LANDINGS[s]).map((s) => '<li><a href="/' + s + '">' + esc(LANDINGS[s].h1) + '</a></li>').join('');
  return '<div id="seo-about" class="wrap seo-landing">' +
    '<section class="prose" id="tool-about" style="margin-top:56px">' +
      '<h2>About ' + esc(L.h1.replace(/\s*\(.*\)$/, '')) + '</h2>' +
      L.body.map((p) => '<p>' + esc(p) + '</p>').join('') + landingTableHtml(L) +
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
      'inLanguage': L.lang || (/[\u0900-\u097F]/.test(L.t + L.d) ? 'hi-IN' : 'en-IN'), 'keywords': L.kw.join(', '),
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

/* The shell the app replaces on load. It carries the same breadcrumb row, icon
   box and heading as the real tool page and reserves a screen of height, so
   the guide underneath starts below the fold and does not jump when the app
   renders. */
function toolShell(h1, intro, crumb) {
  return (crumb ? '<div class="crumb-row"><div class="breadcrumb"><a href="/">All tools</a><span>›</span>' + esc(crumb) + '</div></div>' : '') +
    '<div class="tool-shell" style="min-height:calc(100vh - 170px)"><div class="tool-head">' +
    (crumb ? '<div class="card-icon t-indigo"></div>' : '') +
    '<h1>' + esc(h1) + '</h1><p>' + esc(intro) + '</p></div></div>';
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
    name: 'DocBrisk — Free PDF, Photo & Document Tools',
    short_name: 'DocBrisk',
    description: 'Compress PDFs and photos to an exact size, edit and sign PDFs, make a biodata, letters, salary slips and GST invoices. Files never leave your device.',
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
      ['Compress PDF', 'compress-pdf'], ['Compress Photo', 'image-compressor'],
      ['Biodata Maker', 'biodata-maker'], ['GST Calculator', 'gst-calculator']
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
   Everything lives in ONE store: a KV namespace bound as ADDINS_KV (free, no
   card) or an R2 bucket bound as ADDINS (see "storage" below). Keys:
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
const ADDINS_API_VERSION = 2;   // the app checks this to tell an outdated Worker from a working one

/* ---------- storage: R2 bucket OR Workers KV ----------
   Bind ONE of these to this Worker (wrangler.toml):
     ADDINS_KV  a Workers KV namespace. Free plan, no card needed.
                Files up to 25 MB, 1,000 saves a day, 1 GB in total.
     ADDINS     an R2 bucket. Needs a card on file to activate (free up to
                10 GB). Files up to 100 MB, resumable downloads.
   If both are bound, R2 is used. */
const KV_MAX_BYTES = 25 * 1024 * 1024;
function addinStore(env) {
  if (env && env.ADDINS && typeof env.ADDINS.head === 'function') {
    const b = env.ADDINS;
    return {
      kind: 'r2', maxBytes: ADDIN_MAX_BYTES, verifies: true, ranges: true,
      async getJson(key) {
        const o = await b.get(key);
        return o ? { value: await o.json(), etag: o.etag } : null;
      },
      async putJson(key, obj, etag) {
        const opts = { httpMetadata: { contentType: 'application/json' } };
        if (etag) opts.onlyIf = { etagMatches: etag };
        return !!(await b.put(key, JSON.stringify(obj), opts));
      },
      async headFile(key) {
        const h = await b.head(key);
        return h ? { size: h.size, etag: h.httpEtag } : null;
      },
      async getFile(key, request) {
        const wants = !!(request && request.headers.has('Range'));
        const o = await b.get(key, wants ? { range: request.headers } : undefined);
        if (!o) return null;
        return { body: o.body, size: o.size, etag: o.httpEtag,
          range: wants && o.range && typeof o.range.offset === 'number' ? o.range : null };
      },
      async putFile(key, body, m) {
        // R2 recomputes SHA-256 and rejects the upload if a single byte differs.
        const o = await b.put(key, body, {
          sha256: m.sha256,
          httpMetadata: { contentType: 'application/octet-stream', contentDisposition: 'attachment; filename="' + m.name + '"' },
          customMetadata: { sha256: m.sha256, version: m.version }
        });
        return { size: o.size };
      },
      async listKeys(prefix, max) {
        const out = []; let cursor;
        do {
          const l = await b.list({ prefix, cursor, limit: 1000 });
          l.objects.forEach((o) => out.push(o.key));
          cursor = l.truncated ? l.cursor : undefined;
        } while (cursor && out.length < (max || 1e6));
        return out;
      },
      async del(keys) { if (keys.length) await b.delete(keys); },
      async ping() { await b.head(CATALOG_KEY); },
      async putRecord(key, obj, meta) {
        const cm = {};
        if (meta) Object.keys(meta).forEach(k => { cm[k] = String(meta[k]); });
        await b.put(key, JSON.stringify(obj), { httpMetadata: { contentType: 'application/json' }, customMetadata: cm });
      },
      async listEntries(prefix) {
        const out = []; let cursor;
        do {
          const l = await b.list({ prefix, cursor, limit: 1000, include: ['customMetadata'] });
          l.objects.forEach(o => out.push({ key: o.key, meta: o.customMetadata || {} }));
          cursor = l.truncated ? l.cursor : undefined;
        } while (cursor);
        return out;
      }
    };
  }
  if (env && env.ADDINS_KV && typeof env.ADDINS_KV.getWithMetadata === 'function') {
    const kv = env.ADDINS_KV;
    const ver = (meta) => String((meta && meta.v) || 0);
    return {
      kind: 'kv', maxBytes: KV_MAX_BYTES, verifies: false, ranges: false,
      async getJson(key) {
        const r = await kv.getWithMetadata(key, { type: 'json' });
        return r && r.value != null ? { value: r.value, etag: ver(r.metadata) } : null;
      },
      // KV has no conditional write, so compare a version number kept in metadata.
      async putJson(key, obj, etag) {
        let current = 0;
        const r = await kv.getWithMetadata(key, { type: 'stream' });
        if (r && r.value) { r.value.cancel().catch(() => {}); current = +ver(r.metadata); }
        if (etag != null && String(current) !== String(etag)) return false;
        await kv.put(key, JSON.stringify(obj), { metadata: { v: current + 1 } });
        return true;
      },
      async headFile(key) {
        const r = await kv.getWithMetadata(key, { type: 'stream' });
        if (!r || !r.value) return null;
        r.value.cancel().catch(() => {});
        return { size: (r.metadata && r.metadata.size) || 0, etag: '"' + ((r.metadata && r.metadata.sha256) || 'kv').slice(0, 32) + '"' };
      },
      async getFile(key) {
        const r = await kv.getWithMetadata(key, { type: 'stream' });
        if (!r || !r.value) return null;
        return { body: r.value, size: (r.metadata && r.metadata.size) || 0,
          etag: '"' + ((r.metadata && r.metadata.sha256) || 'kv').slice(0, 32) + '"', range: null };
      },
      // KV cannot check the hash itself; the admin page reads the file back and compares.
      async putFile(key, body, m) {
        await kv.put(key, body, { metadata: { size: m.size, sha256: m.sha256, version: m.version } });
        return { size: m.size };
      },
      async listKeys(prefix, max) {
        const out = []; let cursor;
        do {
          const l = await kv.list({ prefix, cursor, limit: 1000 });
          l.keys.forEach((k) => out.push(k.name));
          cursor = l.list_complete ? undefined : l.cursor;
        } while (cursor && out.length < (max || 1e6));
        return out;
      },
      async del(keys) { await Promise.all(keys.map((k) => kv.delete(k))); },
      async ping() { await kv.get(CATALOG_KEY); },
      async putRecord(key, obj, meta) {
        await kv.put(key, JSON.stringify(obj), meta ? { metadata: meta } : undefined);
      },
      async listEntries(prefix) {
        const out = []; let cursor;
        do {
          const l = await kv.list({ prefix, cursor, limit: 1000 });
          l.keys.forEach(k => out.push({ key: k.name, meta: k.metadata || {} }));
          cursor = l.list_complete ? undefined : l.cursor;
        } while (cursor);
        return out;
      }
    };
  }
  return null;
}

/* Same site: the page's own origin (docbrisk.com, www, or a workers.dev preview). */
function sameSite(request, url) {
  const o = request.headers.get('Origin');
  return !!o && (o === SITE || o === url.origin || o === 'https://www.docbrisk.com');
}
function adminKeyState(env) {
  const k = env && env.ADDINS_ADMIN_KEY ? String(env.ADDINS_ADMIN_KEY) : '';
  return !k ? 'missing' : k.length < 24 ? 'too-short' : 'set';
}
async function storageState(env) {
  const st = addinStore(env);
  if (!st) return 'missing';
  try { await st.ping(); return 'ok'; } catch (e) { return 'error'; }
}

const jsonRes = (obj, status, extra) => new Response(JSON.stringify(obj), {
  status: status || 200,
  headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, SECURITY_HEADERS, extra || {})
});

async function readCatalogRaw(env) {
  const st = addinStore(env);
  if (st) {
    let r = null;
    try { r = await st.getJson(CATALOG_KEY); } catch (e) { r = null; }
    if (r && r.value && r.value.items) return { cat: r.value, etag: r.etag };
  }
  return { cat: { items: JSON.parse(JSON.stringify(ADDIN_DEFAULTS)), updated: '' }, etag: null };
}
async function readCatalog(env) {
  try { return (await readCatalogRaw(env)).cat; } catch (e) { return { items: ADDIN_DEFAULTS, updated: '' }; }
}
/* Write only if nobody else saved in between (two admin tabs, for example). */
async function writeCatalog(env, cat, etag) {
  cat.updated = new Date().toISOString();
  return addinStore(env).putJson(CATALOG_KEY, cat, etag);
}

function sortedSlugs(items) {
  return Object.keys(items).sort((a, b) => ((items[a].order || 99) - (items[b].order || 99)) || a.localeCompare(b));
}
function publicAddin(slug, a, env) {
  const downloadable = !!(a.ready && a.free && a.file && addinStore(env));
  return {
    slug, name: a.name || slug, tagline: a.tagline || '', blurb: a.blurb || '',
    features: Array.isArray(a.features) ? a.features : [], needs: a.needs || '',
    free: !!a.free, ready: !!a.ready, buy: a.ready && !a.free ? (a.buy || '') : '',
    noKey: !!a.noKey,
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

/* Downloads stream straight from storage. With R2, range requests work, so
   download managers and resumed downloads work too. */
async function addinDownload(request, slug, env) {
  const st = addinStore(env);
  if (!st) return unavailable();
  const cat = await readCatalog(env);
  const a = cat.items[slug];
  if (!a || a.listed === false || !a.ready || !a.free || !a.file) return notFound();
  const fname = a.file.split('/').pop().replace(/[^A-Za-z0-9._-]/g, '_');
  const base = Object.assign({
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment; filename="' + fname + '"',
    'Accept-Ranges': st.ranges ? 'bytes' : 'none',
    'Cache-Control': 'public, max-age=300',
    'X-Download-Options': 'noopen'
  }, SECURITY_HEADERS);
  if (request.method === 'HEAD') {
    const h = await st.headFile(a.file);
    if (!h) return notFound();
    return new Response(null, { headers: Object.assign({}, base, h.size ? { 'Content-Length': String(h.size) } : {}, { 'ETag': h.etag }) });
  }
  const obj = await st.getFile(a.file, request);
  if (!obj) return notFound();
  const headers = Object.assign({}, base, { 'ETag': obj.etag });
  if (obj.range) {
    const start = obj.range.offset, len = obj.range.length != null ? obj.range.length : obj.size - start;
    headers['Content-Range'] = 'bytes ' + start + '-' + (start + len - 1) + '/' + obj.size;
    headers['Content-Length'] = String(len);
    return new Response(obj.body, { status: 206, headers });
  }
  if (obj.size) headers['Content-Length'] = String(obj.size);
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
  out.noKey = input.noKey === undefined ? !!p.noKey : !!input.noKey;   // true = this add-in works without a licence key
  ['version', 'file', 'size', 'sha256', 'updated'].forEach((k) => { if (out[k] === undefined) out[k] = k === 'size' ? 0 : ''; });
  return out;
}

async function listRequests(env) {
  const out = [];
  const st = addinStore(env);
  const keys = (await st.listKeys('_requests/', 1000)).sort().reverse().slice(0, 100);
  await Promise.all(keys.map(async (k) => {
    try { const r = await st.getJson(k); if (r && r.value) out.push(Object.assign({ id: k.slice('_requests/'.length, -5) }, r.value)); } catch (e) { /* skip */ }
  }));
  return out.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

/* ---------- public: custom add-in request ---------- */
async function addinRequest(request, env, ctx, url) {
  if (!sameSite(request, url)) return jsonRes({ error: 'Please send the request from the DocBrisk website.', code: 'origin' }, 403);
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
  try {
    if (await caches.default.match(rlKey)) return jsonRes({ error: 'Request already received. Please wait a minute before sending another.', code: 'rate' }, 429);
    ctx.waitUntil(caches.default.put(rlKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=60' } })).catch(() => {}));
  } catch (e) { /* the rate limit is best-effort; never block a real request over it */ }
  const at = new Date().toISOString();
  const id = at.replace(/[^0-9]/g, '').slice(0, 14) + '-' + crypto.randomUUID().slice(0, 8);
  try {
    await addinStore(env).putJson('_requests/' + id + '.json', {
      at, name, contact, need, addin: clip(b.addin, 40), country: (request.cf && request.cf.country) || ''
    });
  } catch (e) {
    return jsonRes({ error: 'We could not save your request just now.', code: 'no_storage' }, 503);
  }
  return jsonRes({ ok: true });
}

/* ---------- License keys (DBK1): a new signed key for every request ----------
   The website signs; the add-in only verifies, offline, with the public key.

   Key bytes  = payload || signature
   payload    = [0] version 1
                [1] tier: 'F' (0x46) free, 'P' (0x50) pro
                [2..3] issued day, uint16 big-endian, days since 2026-01-01 UTC
                [4..5] expiry day, same unit, 0 = never expires
                [6..11] key id, 6 random bytes (makes every key different)
                [12..] licensee name, UTF-8, at most 24 bytes
   signature  = ECDSA P-256 over the payload with SHA-256, 64 bytes r||s
                (Web Crypto's format; .NET ECDsa.VerifyData uses the same)
   text       = "DBK1-" + Crockford base32 of the bytes, in groups of 5

   Secrets on this Worker (Settings -> Variables and Secrets -> type Secret):
     LICENSE_PRIVATE_KEY  the private JWK from docbrisk-keypair-maker.html
     TURNSTILE_SECRET     optional: Cloudflare Turnstile secret (CAPTCHA)
   Stored: _lic/<time>-<id>.json (record; name, email, tier, date in metadata)
           _liccount/<email hash>/<date> (keys issued per email per day) */
const LIC_EPOCH = Date.UTC(2026, 0, 1);
const LIC_PER_EMAIL_PER_DAY = 5;
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';   // Crockford: no I, L, O, U

function b32encode(bytes) {
  let out = '', bits = 0, value = 0;
  for (const b of bytes) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
    value &= (1 << bits) - 1;
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function b32decode(text) {
  const s = String(text).toUpperCase().replace(/[^0-9A-Z]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
  const out = []; let bits = 0, value = 0;
  for (const ch of s) {
    const v = B32.indexOf(ch);
    if (v < 0) return null;
    value = (value << 5) | v; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; value &= (1 << bits) - 1; }
  }
  return new Uint8Array(out);
}
function formatKey(bytes) {
  return 'DBK1-' + b32encode(bytes).match(/.{1,5}/g).join('-');
}
function parseKeyText(text) {
  const t = String(text || '').trim().toUpperCase();
  if (!t.startsWith('DBK1-')) return null;
  const bytes = b32decode(t.slice(5));
  return bytes && bytes.length >= 12 + 64 ? bytes : null;
}
/* Trim a name to at most 24 UTF-8 bytes without cutting a character in half. */
function nameBytes(name) {
  const enc = new TextEncoder();
  let s = String(name || '').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  while (enc.encode(s).length > 24) s = Array.from(s).slice(0, -1).join('');
  return enc.encode(s);
}

let licKeyCache = { raw: null, sign: null, verify: null, pub: null };
async function licenseKeys(env) {
  const raw = env && env.LICENSE_PRIVATE_KEY ? String(env.LICENSE_PRIVATE_KEY).trim() : '';
  if (!raw) return null;
  if (licKeyCache.raw === raw) return licKeyCache;
  const jwk = JSON.parse(raw);
  if (jwk.kty !== 'EC' || jwk.crv !== 'P-256' || !jwk.d) throw new Error('LICENSE_PRIVATE_KEY is not a P-256 private key');
  const alg = { name: 'ECDSA', namedCurve: 'P-256' };
  const sign = await crypto.subtle.importKey('jwk', jwk, alg, false, ['sign']);
  const pub = { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y };
  const verify = await crypto.subtle.importKey('jwk', pub, alg, false, ['verify']);
  licKeyCache = { raw, sign, verify, pub };
  return licKeyCache;
}
async function licenseKeyState(env) {
  if (!env || !env.LICENSE_PRIVATE_KEY) return 'missing';
  try { await licenseKeys(env); return 'set'; } catch (e) { return 'invalid'; }
}

async function issueLicense(env, tier, name, expiryDay) {
  const keys = await licenseKeys(env);
  const nb = nameBytes(name);
  const day = Math.floor((Date.now() - LIC_EPOCH) / 86400000);
  const payload = new Uint8Array(12 + nb.length);
  payload[0] = 1;
  payload[1] = tier === 'P' ? 0x50 : 0x46;
  payload[2] = (day >> 8) & 255; payload[3] = day & 255;
  payload[4] = ((expiryDay || 0) >> 8) & 255; payload[5] = (expiryDay || 0) & 255;
  crypto.getRandomValues(payload.subarray(6, 12));
  payload.set(nb, 12);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.sign, payload));
  const all = new Uint8Array(payload.length + sig.length);
  all.set(payload); all.set(sig, payload.length);
  const id = Array.from(payload.subarray(6, 12), b => b.toString(16).padStart(2, '0')).join('');
  return { key: formatKey(all), id, day };
}

/* Decode and check a key (the same rules the add-in follows). */
async function checkLicense(env, text) {
  const bytes = parseKeyText(text);
  if (!bytes) return { valid: false, reason: 'Not a DocBrisk key (it should start with DBK1-).' };
  const payload = bytes.subarray(0, bytes.length - 64), sig = bytes.subarray(bytes.length - 64);
  const keys = await licenseKeys(env);
  const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, keys.verify, sig, payload);
  const dayToDate = (d) => new Date(LIC_EPOCH + d * 86400000).toISOString().slice(0, 10);
  const issued = (payload[2] << 8) | payload[3], expiry = (payload[4] << 8) | payload[5];
  return {
    valid: ok && payload[0] === 1,
    reason: ok ? '' : 'The signature does not match: the key was mistyped or changed.',
    tier: payload[1] === 0x50 ? 'Pro' : payload[1] === 0x46 ? 'Free' : 'Unknown',
    name: new TextDecoder().decode(payload.subarray(12)),
    issued: dayToDate(issued), expires: expiry ? dayToDate(expiry) : 'never',
    id: Array.from(payload.subarray(6, 12), b => b.toString(16).padStart(2, '0')).join('')
  };
}

async function sha256Hex(text) {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(h), b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyTurnstile(env, token, ip) {
  const body = new FormData();
  body.append('secret', String(env.TURNSTILE_SECRET));
  body.append('response', String(token || ''));
  if (ip) body.append('remoteip', ip);
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const j = await r.json();
    return !!(j && j.success);
  } catch (e) { return false; }
}

/* POST /addins-api/license  { name, email, token }: a NEW free key every time. */
async function licenseRequest(request, env, ctx, url, store) {
  if (!sameSite(request, url)) return jsonRes({ error: 'Please request your key from the DocBrisk website.', code: 'origin' }, 403);
  if (!/^application\/json/i.test(request.headers.get('Content-Type') || '')) return jsonRes({ error: 'Send JSON.' }, 415);
  if (+(request.headers.get('Content-Length') || 0) > 6000) return jsonRes({ error: 'Request too large.' }, 413);
  let b;
  try { b = await request.json(); } catch (e) { return jsonRes({ error: 'Could not read the form.' }, 400); }
  if (b && b.website) return jsonRes({ ok: true });                       // honeypot
  const name = clip(b.name, 60), email = clip(b.email, 120).toLowerCase();
  if (name.length < 2) return jsonRes({ error: 'Please enter your name.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return jsonRes({ error: 'Please enter a valid email address.' }, 400);
  if (await licenseKeyState(env) !== 'set') return jsonRes({ error: 'Free keys are not available yet. Please try again later.', code: 'no_license_key' }, 503);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  if (env.TURNSTILE_SECRET && !(await verifyTurnstile(env, b.token, ip))) {
    return jsonRes({ error: 'The "I am human" check failed. Please try it again.', code: 'captcha' }, 403);
  }
  // A short pause per visitor stops double clicks and scripts. The IP is not stored.
  const rlKey = new Request(SITE + '/__rl/license/' + encodeURIComponent(ip || 'x'));
  try {
    if (await caches.default.match(rlKey)) return jsonRes({ error: 'Please wait a few seconds before asking for another key.', code: 'rate' }, 429);
    ctx.waitUntil(caches.default.put(rlKey, new Response('1', { headers: { 'Cache-Control': 'public, max-age=10' } })).catch(() => {}));
  } catch (e) { /* best effort */ }

  const today = new Date().toISOString().slice(0, 10);
  const countKey = '_liccount/' + (await sha256Hex(email)).slice(0, 32) + '/' + today;
  const prev = await store.getJson(countKey);
  const used = prev && prev.value ? +prev.value.n || 0 : 0;
  if (used >= LIC_PER_EMAIL_PER_DAY) {
    return jsonRes({ error: 'This email has received ' + LIC_PER_EMAIL_PER_DAY + ' keys today. Please use one of those, or try again tomorrow.', code: 'limit' }, 429);
  }

  const lic = await issueLicense(env, 'F', name);
  const at = new Date().toISOString();
  const recKey = '_lic/' + at.replace(/[^0-9]/g, '').slice(0, 14) + '-' + lic.id + '.json';
  await store.putRecord(recKey, { id: lic.id, tier: 'Free', name, email, issued: at, country: (request.cf && request.cf.country) || '' },
    { n: name.slice(0, 60), e: email, t: 'F', d: at.slice(0, 19) + 'Z', id: lic.id });
  await store.putRecord(countKey, { n: used + 1 }, null);
  return jsonRes({ ok: true, key: lic.key, name: new TextDecoder().decode(nameBytes(name)), tier: 'Free' });
}

/* =====================================================================
   PRO KEYS: paid keys with an expiry date (the Smart Pro subscription)
   Uses the licence code above: issueLicense, checkLicense, licenseKeyState, nameBytes.

   Secrets to add on this Worker (Settings -> Variables and Secrets -> Secret):
     RAZORPAY_KEY_ID      rzp_live_...
     RAZORPAY_KEY_SECRET  the secret that belongs to that key id

   Flow:  GET  /addins-api/pro/plans   -> prices for the page, and whether payments are set up
          POST /addins-api/pro/order   -> creates a Razorpay order
          (the browser pays in Razorpay Checkout)
          POST /addins-api/pro/verify  -> checks the payment signature, issues the Pro key
   Stored: _proorder/<order id>.json  and the usual _lic/ record (tier Pro)
   ===================================================================== */

// CHANGE PRICES HERE (paise: 99900 = Rs 999). days = how long the key works.
const PRO_PLANS = {
  year:  { days: 365, paise: 99900, label: 'DocBrisk Excel Pro - 1 year' },
  month: { days: 31,  paise: 9900,  label: 'DocBrisk Excel Pro - 1 month' }
};

const licDayNow = () => Math.floor((Date.now() - LIC_EPOCH) / 86400000);
const licDayToDate = (d) => new Date(LIC_EPOCH + d * 86400000).toISOString().slice(0, 10);
const razorpayState = (env) => (env && env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET ? 'set' : 'missing');
function proPlansPublic() {
  const plans = {};
  Object.keys(PRO_PLANS).forEach((id) => { plans[id] = { label: PRO_PLANS[id].label, rupees: PRO_PLANS[id].paise / 100, days: PRO_PLANS[id].days }; });
  return plans;
}

async function hmacHex(secret, text) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
}
function sameText(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/* Signs a Pro key that works until expiryDay and saves the usual _lic/ record. */
async function issueProKey(env, store, name, email, expiryDay, extra) {
  const lic = await issueLicense(env, 'P', name, expiryDay);
  const at = new Date().toISOString();
  const expires = licDayToDate(expiryDay);
  await store.putRecord('_lic/' + at.replace(/[^0-9]/g, '').slice(0, 14) + '-' + lic.id + '.json',
    Object.assign({ id: lic.id, tier: 'Pro', name, email, issued: at, expires }, extra || {}),
    { n: String(name).slice(0, 60), e: email, t: 'P', d: at.slice(0, 19) + 'Z', id: lic.id, x: expires });
  return { key: lic.key, id: lic.id, expires, licensee: new TextDecoder().decode(nameBytes(name)), at };
}

/* POST /addins-api/pro/order  { name, email, plan: 'year' | 'month', current_key? } */
async function proOrder(request, env, ctx, url, store) {
  if (!sameSite(request, url)) return jsonRes({ error: 'Please buy from the DocBrisk website.', code: 'origin' }, 403);
  let b;
  try { b = await request.json(); } catch (e) { return jsonRes({ error: 'Could not read the form.' }, 400); }
  b = b || {};
  const name = clip(b.name, 60), email = clip(b.email, 120).toLowerCase();
  const plan = Object.prototype.hasOwnProperty.call(PRO_PLANS, b.plan) ? b.plan : '';
  if (name.length < 2) return jsonRes({ error: 'Please enter your name.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return jsonRes({ error: 'Please enter a valid email address.' }, 400);
  if (!plan) return jsonRes({ error: 'Please choose a plan.' }, 400);
  if ((await licenseKeyState(env)) !== 'set' || razorpayState(env) !== 'set') {
    return jsonRes({ error: 'Pro keys are not available yet. Please try again later.', code: 'not_ready' }, 503);
  }

  // Renewing early: the new period starts when the current Pro key ends, so no paid days are lost.
  let fromDay = 0;
  if (b.current_key) {
    try {
      const cur = await checkLicense(env, b.current_key);
      if (cur.valid && cur.tier === 'Pro' && cur.expires && cur.expires !== 'never') {
        fromDay = Math.round((Date.parse(cur.expires + 'T00:00:00Z') - LIC_EPOCH) / 86400000);
      }
    } catch (e) { /* an unreadable old key just means: start today */ }
  }

  const p = PRO_PLANS[plan];
  let r, o = null;
  try {
    r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Basic ' + btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET) },
      body: JSON.stringify({ amount: p.paise, currency: 'INR', receipt: 'pro-' + Date.now().toString(36), notes: { product: 'smart-pro', plan, email } })
    });
    o = await r.json();
  } catch (e) { o = null; }
  if (!r || !r.ok || !o || !o.id) return jsonRes({ error: 'The payment could not be started. Please try again.', code: 'razorpay' }, 502);

  await store.putRecord('_proorder/' + o.id + '.json',
    { order: o.id, name, email, plan, paise: p.paise, fromDay, created: new Date().toISOString(), status: 'created' },
    { e: email, s: 'created' });
  return jsonRes({ ok: true, order_id: o.id, amount: p.paise, currency: 'INR', key_id: env.RAZORPAY_KEY_ID, label: p.label, name, email });
}

/* POST /addins-api/pro/verify  { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   Razorpay signs "order_id|payment_id" with the key secret. Only a real, paid checkout has that signature. */
async function proVerify(request, env, ctx, url, store) {
  if (!sameSite(request, url)) return jsonRes({ error: 'Please finish the payment on the DocBrisk website.', code: 'origin' }, 403);
  let b;
  try { b = await request.json(); } catch (e) { return jsonRes({ error: 'Could not read the payment.' }, 400); }
  b = b || {};
  const orderId = clip(b.razorpay_order_id, 60), payId = clip(b.razorpay_payment_id, 60);
  const sig = clip(b.razorpay_signature, 128).toLowerCase();
  if (!/^order_[A-Za-z0-9]+$/.test(orderId) || !/^pay_[A-Za-z0-9]+$/.test(payId)) return jsonRes({ error: 'The payment details are incomplete.' }, 400);
  if ((await licenseKeyState(env)) !== 'set' || razorpayState(env) !== 'set') return jsonRes({ error: 'Pro keys are not available yet.', code: 'not_ready' }, 503);

  const expect = await hmacHex(env.RAZORPAY_KEY_SECRET, orderId + '|' + payId);
  if (!sameText(expect, sig)) {
    return jsonRes({ error: 'The payment could not be confirmed. If money was deducted, write to us with your payment ID ' + payId + '.', code: 'signature' }, 400);
  }
  const recKey = '_proorder/' + orderId + '.json';
  const got = await store.getJson(recKey);
  const ord = got && got.value;
  if (!ord) return jsonRes({ error: 'This order was not found. Write to us with your payment ID ' + payId + '.', code: 'order' }, 404);
  // the page asks twice (refresh, double click): the same key comes back, never a second one
  if (ord.key) return jsonRes({ ok: true, key: ord.key, tier: 'Pro', expires: ord.expires, name: ord.licensee });

  const plan = PRO_PLANS[ord.plan] || PRO_PLANS.year;
  const expiryDay = Math.max(licDayNow(), +ord.fromDay || 0) + plan.days;
  const k = await issueProKey(env, store, ord.name, ord.email, expiryDay, { plan: ord.plan, order: orderId, payment: payId });
  await store.putRecord(recKey,
    Object.assign({}, ord, { status: 'paid', payment: payId, key: k.key, expires: k.expires, licensee: k.licensee, paid: k.at }),
    { e: ord.email, s: 'paid' });
  return jsonRes({ ok: true, key: k.key, tier: 'Pro', expires: k.expires, name: k.licensee });
}

/* ADMIN ONLY: POST /addins-api/pro/issue  { name, email, days }
   A Pro key without online payment: cash, direct UPI, a gift, or a payment whose browser closed too early. */
async function proIssueManual(request, env, store) {
  let b;
  try { b = await request.json(); } catch (e) { return jsonRes({ error: 'Send JSON.' }, 400); }
  b = b || {};
  const name = clip(b.name, 60), email = clip(b.email, 120).toLowerCase();
  const days = Math.min(3660, Math.max(1, Math.round(+b.days || 365)));
  if (name.length < 2) return jsonRes({ error: 'Name is needed.' }, 400);
  if ((await licenseKeyState(env)) !== 'set') return jsonRes({ error: 'Set LICENSE_PRIVATE_KEY first.' }, 503);
  const k = await issueProKey(env, store, name, email, licDayNow() + days, { plan: 'manual', note: clip(b.note, 120) });
  return jsonRes({ ok: true, key: k.key, tier: 'Pro', expires: k.expires, name: k.licensee });
}

/* ---------------------------------------------------------------------
   WEBHOOK WAY: the same setup DocBrisk Pro uses. No Razorpay Key Secret is needed.
     1. Razorpay Dashboard > Webhooks > add  https://docbrisk.com/addins-api/pro/webhook
        event: payment.captured, secret: any long random text you make up.
     2. Put the same text on this Worker as Secret RAZORPAY_WEBHOOK_SECRET.
   The page pays with the public Key ID that is already in index.html (razorpayKeyId).
   Flow:  POST /addins-api/pro/start   -> a payment reference is saved (name, plan, price)
          (the browser pays in Razorpay Checkout, the reference travels in the payment notes)
          POST /addins-api/pro/webhook -> Razorpay confirms the payment, the Pro key is issued
          POST /addins-api/pro/claim   -> the page collects the key with its reference
   Used when RAZORPAY_KEY_SECRET is not set. Records: _proref/<reference>.json
   --------------------------------------------------------------------- */
const proMode = (env) => (razorpayState(env) === 'set' ? 'order' : (env && env.RAZORPAY_WEBHOOK_SECRET ? 'webhook' : 'off'));

function proRandomHex(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}

async function proStart(request, env, ctx, url, store) {
  if (!sameSite(request, url)) return jsonRes({ error: 'Please buy from the DocBrisk website.', code: 'origin' }, 403);
  let b;
  try { b = await request.json(); } catch (e) { return jsonRes({ error: 'Could not read the form.' }, 400); }
  b = b || {};
  const name = clip(b.name, 60), email = clip(b.email, 120).toLowerCase();
  const plan = Object.prototype.hasOwnProperty.call(PRO_PLANS, b.plan) ? b.plan : '';
  if (name.length < 2) return jsonRes({ error: 'Please enter your name.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return jsonRes({ error: 'Please enter a valid email address.' }, 400);
  if (!plan) return jsonRes({ error: 'Please choose a plan.' }, 400);
  if ((await licenseKeyState(env)) !== 'set' || proMode(env) !== 'webhook') {
    return jsonRes({ error: 'Pro keys are not available yet. Please try again later.', code: 'not_ready' }, 503);
  }
  let fromDay = 0;
  if (b.current_key) {
    try {
      const cur = await checkLicense(env, b.current_key);
      if (cur.valid && cur.tier === 'Pro' && cur.expires && cur.expires !== 'never') {
        fromDay = Math.round((Date.parse(cur.expires + 'T00:00:00Z') - LIC_EPOCH) / 86400000);
      }
    } catch (e) { /* an unreadable old key just means: start today */ }
  }
  const p = PRO_PLANS[plan];
  const ref = proRandomHex(16);
  await store.putRecord('_proref/' + ref + '.json',
    { ref, name, email, plan, paise: p.paise, fromDay, created: new Date().toISOString(), status: 'pending' },
    { e: email, s: 'pending' });
  return jsonRes({ ok: true, ref, amount: p.paise, currency: 'INR', label: p.label, name, email, key_id: (env && env.RAZORPAY_KEY_ID) || '' });
}

/* Called by Razorpay, not by a browser. The signature is HMAC-SHA256 of the raw body with the webhook secret. */
async function proWebhook(request, env, store) {
  const secret = env && env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return jsonRes({ error: 'The webhook is not set up.' }, 503);
  const raw = await request.text();
  const sig = String(request.headers.get('x-razorpay-signature') || '').trim().toLowerCase();
  if (!sig || !sameText(await hmacHex(secret, raw), sig)) return jsonRes({ error: 'Bad signature.' }, 401);
  let ev;
  try { ev = JSON.parse(raw); } catch (e) { return jsonRes({ error: 'Bad body.' }, 400); }
  const pay = ev && ev.payload && ev.payload.payment && ev.payload.payment.entity;
  // Anything that is not ours gets a 200, so Razorpay does not keep retrying it.
  if (!pay || ev.event !== 'payment.captured') return jsonRes({ ok: true, ignored: 'event' });
  const notes = pay.notes || {};
  if (notes.product !== 'smart-pro') return jsonRes({ ok: true, ignored: 'another product' });   // e.g. a DocBrisk Pro payment on the same account
  const ref = String(notes.ref || '');
  if (!/^[0-9a-f]{32}$/.test(ref)) return jsonRes({ ok: true, ignored: 'no reference' });
  const recKey = '_proref/' + ref + '.json';
  const got = await store.getJson(recKey);
  const ord = got && got.value;
  if (!ord) return jsonRes({ ok: true, ignored: 'unknown reference' });
  if (ord.key) return jsonRes({ ok: true, already: true });                                         // Razorpay repeats webhooks: one payment, one key
  const payId = clip(pay.id, 60);
  if (+pay.amount !== +ord.paise || String(pay.currency || 'INR').toUpperCase() !== 'INR') {
    await store.putRecord(recKey, Object.assign({}, ord, { status: 'amount_mismatch', payment: payId, paidPaise: +pay.amount || 0 }), { e: ord.email, s: 'mismatch' });
    return jsonRes({ ok: true, ignored: 'amount' });
  }
  const plan = PRO_PLANS[ord.plan] || PRO_PLANS.year;
  const expiryDay = Math.max(licDayNow(), +ord.fromDay || 0) + plan.days;
  const k = await issueProKey(env, store, ord.name, ord.email, expiryDay, { plan: ord.plan, payment: payId, ref });
  await store.putRecord(recKey,
    Object.assign({}, ord, { status: 'paid', payment: payId, key: k.key, expires: k.expires, licensee: k.licensee, paid: k.at }),
    { e: ord.email, s: 'paid' });
  return jsonRes({ ok: true });
}

/* POST /addins-api/pro/claim { ref }: the buyer's page asks for its key. The reference is known only to that browser. */
async function proClaim(request, env, ctx, url, store) {
  if (!sameSite(request, url)) return jsonRes({ error: 'Please finish the payment on the DocBrisk website.', code: 'origin' }, 403);
  let b;
  try { b = await request.json(); } catch (e) { return jsonRes({ error: 'Could not read the request.' }, 400); }
  const ref = String((b && b.ref) || '');
  if (!/^[0-9a-f]{32}$/.test(ref)) return jsonRes({ error: 'This payment reference is not valid.', code: 'order' }, 400);
  const got = await store.getJson('_proref/' + ref + '.json');
  const ord = got && got.value;
  if (!ord) return jsonRes({ error: 'This payment was not found.', code: 'order' }, 404);
  if (ord.key) return jsonRes({ ok: true, key: ord.key, tier: 'Pro', expires: ord.expires, name: ord.licensee });
  if (ord.status === 'amount_mismatch') {
    return jsonRes({ error: 'The amount paid does not match the plan. Write to us with your payment ID ' + (ord.payment || '') + '.', code: 'amount' }, 409);
  }
  return jsonRes({ ok: true, pending: true });
}

async function listLicenses(store) {
  const rows = (await store.listEntries('_lic/')).map(x => ({
    id: x.meta.id || '', name: x.meta.n || '', email: x.meta.e || '', tier: x.meta.t === 'P' ? 'Pro' : 'Free',
    issued: x.meta.d || '', expires: x.meta.x || '', key: x.key
  }));
  rows.sort((a, b) => b.key.localeCompare(a.key));
  return rows;
}
const csvCell = (v) => { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) || /^[=+\-@]/.test(s) ? '"' + s.replace(/"/g, '""').replace(/^([=+\-@])/, "'$1") + '"' : s; };

async function addinsApi(request, env, ctx, url) {
  const p = url.pathname.replace(/^\/api\/addins\//, '/addins-api/'), m = request.method;
  if (p === '/addins-api/status' && (m === 'GET' || m === 'HEAD')) {
    // Public on purpose: it only says whether setup is done, never what the key is.
    const s = addinStore(env);
    return jsonRes({ ok: true, api: ADDINS_API_VERSION, build: BUILD, storage: await storageState(env),
      storageType: s ? s.kind : '', maxMB: s ? Math.round(s.maxBytes / 1048576) : 0, adminKey: adminKeyState(env),
      licenseKey: await licenseKeyState(env), captcha: env && env.TURNSTILE_SECRET ? 'on' : 'off', payments: proMode(env) });
  }
  if (p === '/addins-api/pro/plans' && (m === 'GET' || m === 'HEAD')) {
    // Public: the page shows the Pro form only when payments, the signing key and storage are all ready.
    const mode = proMode(env);   // 'order' (Key Secret set), 'webhook' (webhook secret set) or 'off'
    return jsonRes({ ready: mode !== 'off' && (await licenseKeyState(env)) === 'set' && !!addinStore(env), mode, key_id: (env && env.RAZORPAY_KEY_ID) || '', plans: proPlansPublic() });
  }
  const store = addinStore(env);
  if (!store) {
    return jsonRes({ error: p === '/addins-api/request' ? 'We could not save your request just now.'
      : 'Storage is not connected: bind a KV namespace as ADDINS_KV (free) or an R2 bucket as ADDINS.', code: 'no_storage' }, 503);
  }
  if (p === '/addins-api/request' && m === 'POST') return addinRequest(request, env, ctx, url);
  if (p === '/addins-api/license' && m === 'POST') return licenseRequest(request, env, ctx, url, store);
  if (p === '/addins-api/pro/order' && m === 'POST') return proOrder(request, env, ctx, url, store);
  if (p === '/addins-api/pro/verify' && m === 'POST') return proVerify(request, env, ctx, url, store);
  if (p === '/addins-api/pro/start' && m === 'POST') return proStart(request, env, ctx, url, store);
  if (p === '/addins-api/pro/claim' && m === 'POST') return proClaim(request, env, ctx, url, store);
  if (p === '/addins-api/pro/webhook' && m === 'POST') return proWebhook(request, env, store);

  // Everything below is admin-only.
  if (!(await isAddinAdmin(request, env))) {
    const k = env.ADDINS_ADMIN_KEY ? String(env.ADDINS_ADMIN_KEY) : '';
    return jsonRes({ error: !k ? 'Set the ADDINS_ADMIN_KEY secret on the docbrisk-seo Worker first.'
      : k.length < 24 ? 'ADDINS_ADMIN_KEY must be at least 24 characters. Set a longer one.' : 'Wrong admin key.',
      code: !k ? 'no_key' : k.length < 24 ? 'short_key' : 'wrong_key' }, 401);
  }
  if (m !== 'GET' && request.headers.get('Origin') && !sameSite(request, url)) return jsonRes({ error: 'Not allowed.' }, 403);

  if (p === '/addins-api/admin' && m === 'GET') {
    const [{ cat }, requests] = await Promise.all([readCatalogRaw(env), listRequests(env)]);
    return jsonRes({ items: cat.items, order: sortedSlugs(cat.items), updated: cat.updated || '', requests,
      storageType: store.kind, maxBytes: store.maxBytes });
  }

  const item = p.match(/^\/addins-api\/item\/([a-z0-9-]+)$/);
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
        await store.del(await store.listKeys(slug + '/'));
      }
      return jsonRes({ ok: true });
    }
  }

  const file = p.match(/^\/addins-api\/file\/([a-z0-9-]+)$/);
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
    if (!len || len > store.maxBytes) return jsonRes({ error: 'Files must be under ' + Math.round(store.maxBytes / 1048576) + ' MB with this storage.' }, 413);
    const { cat } = await readCatalogRaw(env);
    if (!cat.items[slug]) return jsonRes({ error: 'Save the add-in details first, then upload the file.' }, 404);
    const key = slug + '/' + version + '/' + name;
    let obj;
    try {
      // R2 recomputes SHA-256 and rejects the upload if a single byte differs.
      obj = await store.putFile(key, request.body, { sha256: sha, name, version, size: len });
    } catch (e) {
      return jsonRes({ error: 'Upload failed the integrity check or was interrupted. Please try again.' }, 422);
    }
    // Re-read the catalogue after the (possibly long) upload so no other edit is lost.
    const fresh = await readCatalogRaw(env);
    const it = fresh.cat.items[slug];
    if (!it) return jsonRes({ error: 'The add-in was deleted during the upload.' }, 409);
    Object.assign(it, { version, file: key, size: obj.size, sha256: sha, updated: new Date().toISOString().slice(0, 10) });
    if (!(await writeCatalog(env, fresh.cat, fresh.etag))) return jsonRes({ error: 'Uploaded, but the list changed at the same time. Reload and upload again.' }, 409);
    return jsonRes({ ok: true, item: it, verified: store.verifies });
  }

  // Admin read-back of the current file, so the admin page can confirm a KV upload byte for byte.
  const back = p.match(/^\/addins-api\/file\/([a-z0-9-]+)$/);
  if (back && m === 'GET') {
    const { cat } = await readCatalogRaw(env);
    const it = cat.items[back[1]];
    const f = it && it.file ? await store.getFile(it.file) : null;
    if (!f) return jsonRes({ error: 'No file.' }, 404);
    return new Response(f.body, { headers: Object.assign({ 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store' }, SECURITY_HEADERS) });
  }

  if (p === '/addins-api/pro/issue' && m === 'POST') return proIssueManual(request, env, store);
  if (p === '/addins-api/licenses' && m === 'GET') {
    const rows = await listLicenses(store);
    return jsonRes({ total: rows.length, items: rows.slice(0, 200), licenseKey: await licenseKeyState(env), captcha: env.TURNSTILE_SECRET ? 'on' : 'off', payments: proMode(env) });
  }
  if (p === '/addins-api/licenses.csv' && m === 'GET') {
    const rows = await listLicenses(store);
    const csv = ['Issued (UTC),Name,Email,Tier,Key ID'].concat(rows.map(r => [r.issued, r.name, r.email, r.tier, r.id].map(csvCell).join(','))).join('\r\n');
    return new Response('\ufeff' + csv, { headers: Object.assign({ 'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="docbrisk-license-keys.csv"', 'Cache-Control': 'no-store' }, SECURITY_HEADERS) });
  }
  if (p === '/addins-api/license/check' && m === 'POST') {
    if (await licenseKeyState(env) !== 'set') return jsonRes({ error: 'Set LICENSE_PRIVATE_KEY first.' }, 503);
    let b; try { b = await request.json(); } catch (e) { return jsonRes({ error: 'Send JSON.' }, 400); }
    return jsonRes(await checkLicense(env, b && b.key));
  }

  const reqDel = p.match(/^\/addins-api\/request\/([0-9a-f-]{10,40})$/);
  if (reqDel && m === 'DELETE') {
    await store.del(['_requests/' + reqDel[1] + '.json']);
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
    {
      const u = new URL(request.url);
      if (u.pathname.startsWith('/addins-api/') || u.pathname.startsWith('/api/addins/')) return addinsApi(request, env, ctx, u);
    }
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
        view: toolShell(t.t, t.d, t.t), about: toolAboutHtml(slug), ld: toolSchema(slug)
      }) }));
    }

    const examMatch = path.match(/^\/exam\/([a-z0-9-]+)$/);
    if (examMatch && EXAMS[examMatch[1]]) {
      const e = EXAMS[examMatch[1]];
      return servePage(request, ctx, path, (html) => ({ body: build(html, {
        title: examTitle(e), desc: examDesc(e), url: SITE + path, path, keywords: e.kw.join(', '),
        view: toolShell(examH1(e), examDesc(e), examH1(e)), about: examAboutHtml(examMatch[1]), ld: examSchema(examMatch[1])
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
        view: toolShell(L.h1, L.lead, L.h1), about: landingAboutHtml(slug), ld: landingSchema(slug)
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
