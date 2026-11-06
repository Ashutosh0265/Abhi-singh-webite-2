const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'assets', 'downloads');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

function createSimplePdf(title, subtitle, author = 'Abhi Singh') {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>
endobj
4 0 obj
<< /Length 420 >>
stream
BT
/F1 28 Tf
50 720 Td
(${title}) Tj
ET
BT
/F2 14 Tf
50 680 Td
(${subtitle}) Tj
ET
BT
/F2 12 Tf
50 640 Td
(Author: ${author} | Eat. Lift. Run. x) Tj
ET
BT
/F2 11 Tf
50 590 Td
(Thank you for downloading your official E.L.R.x training guide.) Tj
ET
BT
/F2 11 Tf
50 560 Td
(Visit abhisingh.me for updates, new kettlebell protocols, and coaching.) Tj
ET
BT
/F2 10 Tf
50 500 Td
(Copyright 2026 Abhi Singh. All rights reserved.) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000715 00000 n 
0000000786 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
851
%%EOF`;

  return Buffer.from(content, 'utf-8');
}

const pdfs = [
  {
    fileName: 'habits-for-physical-and-mental-strength.pdf',
    title: 'Habits for Physical and Mental Strength',
    subtitle: 'A 3-Day Primer on Physical Discipline and Habit Architecture'
  },
  {
    fileName: '24-boring-basics-peak-fitness.pdf',
    title: '24 Boring Basics for Peak Fitness',
    subtitle: 'Tactical Evidence-Based Fundamentals That Move The Needle'
  },
  {
    fileName: 'abhis-10-kettlebell-complexes.pdf',
    title: 'Abhis 10 Kettlebell Complexes',
    subtitle: 'Field-Tested Complexes for Strength, Muscle and Endurance'
  }
];

for (const p of pdfs) {
  const filePath = path.join(targetDir, p.fileName);
  fs.writeFileSync(filePath, createSimplePdf(p.title, p.subtitle));
  console.log(`Generated: ${filePath}`);
}

