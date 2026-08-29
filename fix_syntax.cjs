const fs = require('fs');

// Fix pdfGenerator.ts
let pdfGen = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');
pdfGen = pdfGen.replace(/\\\`\\\$?\\{pageNum\\}\\\`/g, '`Page ${pageNum}`');
pdfGen = pdfGen.replace(/\\\`Q\\\$?\\{index \+ 1\\}\. \\\$?\\{stripLatex\\(q\\.question\\)\\}/g, '`Q${index + 1}. ${stripLatex(q.question)}`');
pdfGen = pdfGen.replace(/\\\`A\\) \\\$?\\{stripLatex\\(q\\.options\\.A\\)\\}/g, '`A) ${stripLatex(q.options.A)}`');
pdfGen = pdfGen.replace(/\\\`B\\) \\\$?\\{stripLatex\\(q\\.options\\.B\\)\\}/g, '`B) ${stripLatex(q.options.B)}`');
pdfGen = pdfGen.replace(/\\\`C\\) \\\$?\\{stripLatex\\(q\\.options\\.C\\)\\}/g, '`C) ${stripLatex(q.options.C)}`');
pdfGen = pdfGen.replace(/\\\`D\\) \\\$?\\{stripLatex\\(q\\.options\\.D\\)\\}/g, '`D) ${stripLatex(q.options.D)}`');
pdfGen = pdfGen.replace(/\\\`\\\$?\\{title\\.replace\\(\/\\\\s\\+\/g, '_\\'\\)\\}_Test\\.pdf\\\`/g, '`${title.replace(/\\s+/g, \\\'_\\\')}_Test.pdf`');
fs.writeFileSync('src/lib/pdfGenerator.ts', pdfGen);

// Fix AdminCreateTestView.tsx
let createView = fs.readFileSync('src/components/admin/tests/AdminCreateTestView.tsx', 'utf8');
createView = createView.replace(/\\\`Not enough MCQs available\\. Requested \\\$?\\{mcqCount\\}, but only \\\$?\\{availableMCQs\\.length\\} exist in the bank for the selected filters\\.\\\`/g, '`Not enough MCQs available. Requested ${mcqCount}, but only ${availableMCQs.length} exist in the bank for the selected filters.`');
createView = createView.replace(/\\\`\\\$\\{availableMCQs\\.length\\} MCQs available in live bank for this scope\\\`/g, '`${availableMCQs.length} MCQs available in live bank for this scope`');
fs.writeFileSync('src/components/admin/tests/AdminCreateTestView.tsx', createView);
