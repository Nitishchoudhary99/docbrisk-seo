/* ==========================================================================
   DocBrisk — seo-content.js
   Long-form guides for the tool pages people search for most.

   seo-worker.js imports extraHtml() and places its output inside #seo-about,
   between "About <tool>" and the FAQ, so it is visible to visitors below the
   tool (not hidden text) and readable by crawlers without JavaScript.

   Mini-markup in the text: [label](/tool/slug) becomes an internal link.
   Only site-relative paths are turned into links.
   ========================================================================== */

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;')
  .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function inline(s) {
  return esc(s).replace(/\[([^\]]+)\]\((\/[a-z0-9\-\/]*)\)/g,
    (m, label, href) => '<a href="' + href + '">' + label + '</a>');
}

function blocks(body) {
  return body.map((b) => {
    if (typeof b === 'string') return '<p>' + inline(b) + '</p>';
    if (b.ul) return '<ul>' + b.ul.map((li) => '<li>' + inline(li) + '</li>').join('') + '</ul>';
    if (b.ol) return '<ol>' + b.ol.map((li) => '<li>' + inline(li) + '</li>').join('') + '</ol>';
    return '';
  }).join('');
}

const GUIDES = {

  /* ------------------------------------------------------------------ */
  'compress-pdf': {
    title: 'How to compress a PDF to 100KB, 200KB or 500KB',
    intro: [
      'Recruitment portals, exam applications, scholarship forms, university admissions and bank KYC pages often cap uploads at a fixed size: 100KB, 200KB, 500KB or 1MB. The limit is usually printed next to the upload button or in the form\'s instructions. Use that number as your target and DocBrisk works toward it on your own device.'
    ],
    sections: [
      { h: 'How DocBrisk gets a PDF under the limit', body: [
        'Compression runs in stages, and the size is checked against your target after each one:',
        { ol: [
          'Clean-up first. Duplicate objects, unused resources and embedded metadata are removed. Nothing you can see changes.',
          'Images next. Photos and scanned pages are re-encoded step by step, and the highest quality that still fits the target is kept.',
          'Page flattening only as a last resort. If the target can\'t be reached any other way, pages are turned into images and the text stops being selectable. If the portal allows it, a slightly larger target avoids this.'
        ] },
        'Because text stays as real text in the first two stages, it prints sharply and can still be searched and copied.'
      ] },
      { h: 'Why is my PDF still bigger than 100KB?', body: [
        'Almost all of a PDF\'s size comes from images. A document typed on a computer can usually go very small, but a multi-page scan made at high resolution may not fit 100KB and stay readable. These help:',
        { ul: [
          'Remove pages the form doesn\'t need, such as blank backs of pages, with [Organize PDF](/tool/organize-pdf), then compress again.',
          'Rescan at a lower resolution. 150 to 200 DPI is enough for most text documents; a 600 DPI scan is many times larger.',
          'Scan in grayscale or black and white when colour isn\'t required.',
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
          'फ़ॉर्म में लिखा साइज़ अपना टारगेट रखें।',
          'कम्प्रेस करें और नई फ़ाइल डाउनलोड करें।'
        ] },
        'आपकी फ़ाइल किसी सर्वर पर अपलोड नहीं होती। पूरा काम आपके फ़ोन या कंप्यूटर के ब्राउज़र में होता है।',
        'स्कैन की हुई PDF 100KB से नीचे न आए तो बेकार पेज हटाएँ, या स्कैन 150 से 200 DPI पर दोबारा करें।'
      ]
    }
  },

  /* ------------------------------------------------------------------ */
  'pdf-to-word': {
    title: 'Converting a PDF to an editable Word file',
    intro: [
      'A PDF records where each character sits on the page. It has no idea what a paragraph, a table or a heading is, so every converter has to rebuild that structure. How well it does that decides whether the Word file looks like your PDF or like a jumble.'
    ],
    sections: [
      { h: 'How DocBrisk keeps the original look', body: [
        'The page design, meaning backgrounds, borders, lines, logos and shading, stays in place. Each piece of text is put back where it was, with its font size, bold, italic, underline and colour. The Word file looks like the PDF, and the text can still be edited.',
        'This suits small, precise edits best: a name, a date, an amount, an address. If you plan to rewrite whole pages, copy the text into a fresh document instead, because text placed at fixed positions doesn\'t reflow the way normal paragraphs do.'
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
        'अपनी PDF चुनें, कन्वर्ट करें और .docx फ़ाइल डाउनलोड करें। डिज़ाइन, लाइनें और लोगो अपनी जगह पर रहते हैं और टेक्स्ट एडिट किया जा सकता है। फ़ाइल आपके डिवाइस से बाहर नहीं जाती।',
        'अगर PDF में टेक्स्ट सेलेक्ट नहीं होता, तो वह स्कैन की हुई फ़ाइल है। पहले [OCR](/tool/ocr-pdf) इस्तेमाल करें।',
        'पुराने हिंदी फ़ॉन्ट (जैसे Kruti Dev) में बनी PDF को कोई भी कन्वर्टर सही यूनिकोड हिंदी में नहीं बदल पाता, क्योंकि उनमें हिंदी अक्षर अंग्रेज़ी अक्षरों के कोड पर बने होते हैं। ऐसी फ़ाइल का मूल Word दस्तावेज़ मिल जाए तो वही सबसे अच्छा है।'
      ]
    }
  },

  /* ------------------------------------------------------------------ */
  'id-card': {
    title: 'Printing Aadhaar, PAN and other ID cards front and back on one page',
    intro: [
      'Banks, offices, schools and landlords often ask for one self-attested copy showing both sides of an ID. This tool places the front and back on a single page at the card\'s real size, 85.6 × 54 mm, with cut guides, one above the other or side by side.'
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
          'दोनों साइड ऊपर-नीचे या अगल-बगल रखें और PDF डाउनलोड करें।',
          'प्रिंट करते समय "Actual size" या 100% स्केल चुनें, "Fit to page" नहीं।'
        ] },
        'UIDAI से डाउनलोड किए e-Aadhaar का पासवर्ड आपके नाम के पहले चार अक्षर (कैपिटल में) और जन्म का साल होता है, जैसे SURE1990।'
      ]
    }
  },

  /* ------------------------------------------------------------------ */
  'photo-studio': {
    title: 'Passport size photos for applications, exams and visas',
    intro: [
      'Almost every application asks for a photo with a fixed size, a plain background and a file size limit. Getting any one of them wrong is a common reason forms are rejected. This tool removes the background, crops to standard passport and visa sizes and saves a file small enough for online uploads, without sending your photo anywhere.'
    ],
    sections: [
      { h: 'Common photo sizes', body: [
        { ul: [
          'India: 3.5 × 4.5 cm is what most people mean by "passport size".',
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
        'Online forms often give a file size range, such as 20KB to 50KB, along with pixel dimensions. Too large and the upload fails; squeezed too far and the face turns blocky. Save at the limit the form asks for, then zoom in on the saved photo to check the face is still sharp. A signature, if the form asks for one, is a separate image with its own limit.'
      ] },
      { h: 'Removing or changing the background', body: [
        'The background is detected and removed inside your browser, so your photo never leaves your phone or computer. Dark hair against a dark wall is the hardest case. Standing in front of a plain, light wall when you take the photo gives the cleanest edge.'
      ] }
    ],
    hi: {
      title: 'पासपोर्ट साइज़ फ़ोटो ऑनलाइन कैसे बनाएँ',
      body: [
        'फ़ोटो चुनें, बैकग्राउंड हटाकर सफ़ेद करें, साइज़ चुनें (भारत में आम तौर पर 3.5 × 4.5 सेमी) और फ़ाइल डाउनलोड करें।',
        'परीक्षा और नौकरी के फ़ॉर्म अक्सर फ़ोटो को तय KB में माँगते हैं, जैसे 20KB से 50KB। फ़ॉर्म के निर्देश ज़रूर देखें।',
        'अच्छी फ़ोटो के लिए सादी, हल्के रंग की दीवार के सामने खड़े हों और रोशनी सामने से आए।'
      ]
    }
  },

  /* ------------------------------------------------------------------ */
  'invoice-maker': {
    title: 'Making a GST invoice with a UPI payment QR',
    intro: [
      'A tax invoice under GST has to carry specific details, and a UPI QR on the same page lets the customer pay by scanning it. This generator lays out both, offers five templates, and keeps your business details and saved templates in your browser, so the next invoice takes a minute.'
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
        'A UPI QR means the customer doesn\'t have to type your UPI ID, which removes the most common payment mistake. It works with any UPI app. Before you send the first invoice, scan the QR yourself and check that the app shows the right payee name.'
      ] },
      { h: 'Repeat clients and recurring invoices', body: [
        'Save a named template for each regular client, add discounts per line as a percentage or a flat amount, and generate recurring invoices where the date and invoice number move forward on their own.'
      ] },
      { h: 'What this tool doesn\'t do', body: [
        'Businesses above the government\'s e-invoicing turnover threshold must register B2B invoices on the Invoice Registration Portal and print the IRN and signed QR code it returns. DocBrisk doesn\'t connect to that portal, so it suits businesses below the threshold, freelancers and small shops. E-way bills are also generated separately, on the government portal.'
      ] }
    ],
    hi: {
      title: 'GST बिल / इनवॉइस ऑनलाइन कैसे बनाएँ',
      body: [
        'अपनी दुकान या फ़र्म का नाम, पता और GSTIN डालें, ग्राहक और आइटम जोड़ें, और UPI QR के साथ इनवॉइस की PDF डाउनलोड करें।',
        'एक ही राज्य में बिक्री पर टैक्स CGST और SGST में आधा-आधा बँटता है (18% = 9% + 9%)। दूसरे राज्य में बिक्री पर पूरा टैक्स IGST के रूप में लगता है।',
        'आपका डेटा आपके ही ब्राउज़र में रहता है, किसी सर्वर पर नहीं जाता।'
      ]
    }
  },

  /* ------------------------------------------------------------------ */
  'unlock-pdf': {
    title: 'Removing the password from a PDF you can open',
    intro: [
      'Bank statements, credit card statements, salary slips, insurance policies and e-Aadhaar arrive as password-protected PDFs. Typing the password every time is tedious, and some upload portals reject protected files outright. Enter the password once here and save a copy that opens without it.'
    ],
    sections: [
      { h: 'You need the password', body: [
        'This tool removes a password you already know. It doesn\'t guess or crack passwords, and it is meant for documents that belong to you. If you\'ve forgotten a statement\'s password, the email it came with usually explains the format, or the bank can resend the statement.'
      ] },
      { h: 'Common password formats', body: [
        'Senders build the password from details they already hold, so the covering email or the sender\'s website is the place to check. Typical patterns:',
        { ul: [
          'e-Aadhaar from UIDAI: the first four letters of your name in capitals plus your year of birth, such as SURE1990.',
          'Bank and card statements: often part of your name, your date of birth, or the last digits of the account or card number.',
          'Other documents: often your PAN, customer ID or date of birth.'
        ] }
      ] },
      { h: 'Why is my password being rejected?', body: [
        { ul: [
          'Passwords are case-sensitive. Check whether the name part should be in capitals.',
          'Dates come in several forms: DDMMYYYY, DDMMYY and DDMM are all common.',
          'Copying the password from an email can bring along a hidden space at the end.'
        ] }
      ] },
      { h: 'Which encryption it handles', body: [
        'DocBrisk reads the standard PDF encryption methods, from older 40-bit and 128-bit RC4 to AES-128 and AES-256. The unlocked copy is created on your device, and neither the file nor the password is sent anywhere.'
      ] }
    ],
    hi: {
      title: 'PDF से पासवर्ड कैसे हटाएँ',
      body: [
        { ol: [
          'पासवर्ड वाली PDF चुनें।',
          'उसका सही पासवर्ड एक बार डालें।',
          'बिना पासवर्ड वाली कॉपी डाउनलोड करें।'
        ] },
        'यह टूल सिर्फ़ वही पासवर्ड हटाता है जो आपको पता है; यह पासवर्ड तोड़ता नहीं है। बैंक स्टेटमेंट का पासवर्ड अक्सर ईमेल में बताए फ़ॉर्मैट में होता है। e-Aadhaar का पासवर्ड नाम के पहले चार अक्षर (कैपिटल में) और जन्म का साल होता है।'
      ]
    }
  }
};

export const GUIDE_SLUGS = Object.keys(GUIDES);

/* Returns '' for tools without a guide, so every other page is unchanged. */
export function extraHtml(slug) {
  const g = GUIDES[slug];
  if (!g) return '';
  let html =
    '<section class="prose" id="tool-guide" style="margin-top:40px">' +
      '<h2>' + esc(g.title) + '</h2>' + blocks(g.intro) +
      g.sections.map((s) => '<h3>' + esc(s.h) + '</h3>' + blocks(s.body)).join('') +
    '</section>';
  if (g.hi) {
    html +=
      '<section class="prose" id="tool-hindi" lang="hi" style="margin-top:32px">' +
        '<h2>' + esc(g.hi.title) + '</h2>' + blocks(g.hi.body) +
      '</section>';
  }
  return html;
}
