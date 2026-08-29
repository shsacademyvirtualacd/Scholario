const fs = require('fs');

let pdfGen = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

// Fix GState instantiation properly
pdfGen = pdfGen.replace(
  'doc.setGState((doc as any).GState || doc.GState({ opacity: 0.10 }));',
  'doc.setGState(new (doc as any).GState({ opacity: 0.10 }));'
);

pdfGen = pdfGen.replace(
  'doc.setGState((doc as any).GState || doc.GState({ opacity: 1 }));',
  'doc.setGState(new (doc as any).GState({ opacity: 1 }));'
);

fs.writeFileSync('src/lib/pdfGenerator.ts', pdfGen);
