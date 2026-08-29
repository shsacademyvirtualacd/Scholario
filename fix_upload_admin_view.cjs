const fs = require('fs');
const content = fs.readFileSync('src/components/admin/tests/AdminCreateTestView.tsx', 'utf8');

// Replace the download dummy logic with real backend upload logic
const searchBlock = `      // We will add the API call to backend here in the next step
      // For now, download the file so we can verify it
      const url = URL.createObjectURL(pdfFile);
      const link = document.createElement('a');
      link.href = url;
      link.download = pdfFile.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Test PDF generated successfully!');`;

const replaceBlock = `
      const { supabase } = await import('../../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error('Not authenticated.');

      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('title', title);
      formData.append('board', board);
      formData.append('subject', subject);
      formData.append('grade', grade);
      formData.append('stream', stream);
      formData.append('total_marks', totalMarks);
      formData.append('due_date', dueDate);
      formData.append('teacher_name', teacherName);

      const res = await fetch('/api/tests/create-generated', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${session.access_token}\`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to upload and create test');
      }

      const result = await res.json();

      toast.success('Test generated and published successfully!');

      // Optionally reset form
      setTitle('');
      setTeacherName('');
      setDueDate('');
      `;

let updated = content.replace(searchBlock, replaceBlock);
fs.writeFileSync('src/components/admin/tests/AdminCreateTestView.tsx', updated);
