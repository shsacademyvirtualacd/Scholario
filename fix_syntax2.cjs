const fs = require('fs');

// Fix pdfGenerator.ts
let pdfGen = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');

// Manual string replacements to avoid regex parsing issues
pdfGen = pdfGen.replace("const pageText = \\`Page \\${pageNum}\\`;", "const pageText = `Page ${pageNum}`;");
pdfGen = pdfGen.replace("const subTitle = \\`\\${board.toUpperCase()} | Grade \\${grade} | \\${subject}\\`;", "const subTitle = `${board.toUpperCase()} | Grade ${grade} | ${subject}`;");
pdfGen = pdfGen.replace("doc.text(\\`Teacher: \\${teacherName}\\`, margin, yPos);", "doc.text(`Teacher: ${teacherName}`, margin, yPos);");
pdfGen = pdfGen.replace("const marksText = \\`Total Marks: \\${totalMarks}\\`;", "const marksText = `Total Marks: ${totalMarks}`;");
pdfGen = pdfGen.replace("const qText = \\`Q\\${index + 1}. \\${stripLatex(q.question)}\\`;", "const qText = `Q${index + 1}. ${stripLatex(q.question)}`;");
pdfGen = pdfGen.replace("\\`A) \\${stripLatex(q.options.A)}\\`", "`A) ${stripLatex(q.options.A)}`");
pdfGen = pdfGen.replace("\\`B) \\${stripLatex(q.options.B)}\\`", "`B) ${stripLatex(q.options.B)}`");
pdfGen = pdfGen.replace("\\`C) \\${stripLatex(q.options.C)}\\`", "`C) ${stripLatex(q.options.C)}`");
pdfGen = pdfGen.replace("\\`D) \\${stripLatex(q.options.D)}\\`", "`D) ${stripLatex(q.options.D)}`");
pdfGen = pdfGen.replace("const file = new File([pdfBlob], \\`\\${title.replace(/\\\\s+/g, '_')}_Test.pdf\\`, { type: 'application/pdf' });", "const file = new File([pdfBlob], `${title.replace(/\\s+/g, '_')}_Test.pdf`, { type: 'application/pdf' });");
fs.writeFileSync('src/lib/pdfGenerator.ts', pdfGen);

// Fix AdminCreateTestView.tsx
let createView = fs.readFileSync('src/components/admin/tests/AdminCreateTestView.tsx', 'utf8');
createView = createView.replace("setError(\\`Not enough MCQs available. Requested \\${mcqCount}, but only \\${availableMCQs.length} exist in the bank for the selected filters.\\`);", "setError(`Not enough MCQs available. Requested ${mcqCount}, but only ${availableMCQs.length} exist in the bank for the selected filters.`);");
createView = createView.replace("{loadingBank ? 'Loading...' : \\`\\${availableMCQs.length} MCQs available in live bank for this scope\\`}", "{loadingBank ? 'Loading...' : `${availableMCQs.length} MCQs available in live bank for this scope`}");
createView = createView.replace("'Authorization': \\`Bearer \\${session.access_token}\\`", "'Authorization': `Bearer ${session.access_token}`");

fs.writeFileSync('src/components/admin/tests/AdminCreateTestView.tsx', createView);
