const fs = require('fs');

// Fix pdfGenerator.ts
let pdfGen = fs.readFileSync('src/lib/pdfGenerator.ts', 'utf8');
// Fix ts7009 new doc.GState -> doc.GState
pdfGen = pdfGen.replace(/new doc\.GState/g, '(doc as any).GState || doc.GState');
fs.writeFileSync('src/lib/pdfGenerator.ts', pdfGen);

// Fix AdminCreateTestView.tsx
let createView = fs.readFileSync('src/components/admin/tests/AdminCreateTestView.tsx', 'utf8');
createView = createView.replace('useCallback }', '}');
createView = createView.replace('const [stream, setStream] = useState', 'const [stream] = useState');
createView = createView.replace('const streamsForGrade = getStreamsForGrade(grade, board);\n  ', '');
createView = createView.replace('const errorData = await res.json().catch(() => null);', 'const errorData = (await res.json().catch(() => null)) as any;');
createView = createView.replace('const result = await res.json();', 'await res.json();');

fs.writeFileSync('src/components/admin/tests/AdminCreateTestView.tsx', createView);
