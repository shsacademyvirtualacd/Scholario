const fs = require('fs');
const content = fs.readFileSync('src/components/admin/tests/AdminCreateTestView.tsx', 'utf8');

let updated = content.replace(
  "import { loadBankData } from '../../../lib/questionBankService';",
  "import { loadBankData } from '../../../lib/questionBankService';\nimport { generateTestPDF } from '../../../lib/pdfGenerator';\nimport { toast } from 'sonner';"
);

updated = updated.replace(
  "      console.log('Selected MCQs:', selectedMCQs);\n      // Wait for pdfGenerator to be created in the next step\n      setError('PDF Generation logic is not yet integrated.');",
  `      console.log('Selected MCQs:', selectedMCQs);
      const pdfFile = await generateTestPDF({
        board,
        grade,
        subject,
        title,
        teacherName,
        totalMarks,
        mcqs: selectedMCQs,
      });

      // We will add the API call to backend here in the next step
      // For now, download the file so we can verify it
      const url = URL.createObjectURL(pdfFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Test PDF generated successfully!');`
);

fs.writeFileSync('src/components/admin/tests/AdminCreateTestView.tsx', updated);
