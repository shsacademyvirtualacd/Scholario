const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Find insertion point - right before 'app.post('/api/tests/upload''
const insertionIndex = content.indexOf("app.post('/api/tests/upload'");

if (insertionIndex === -1) {
  console.error("Could not find insertion point in server.ts");
  process.exit(1);
}

const newEndpoint = `
  app.post('/api/tests/create-generated', upload.single('file'), async (req, res) => {
    try {
      const file = req.file;

      const {
        title,
        board = 'fbise',
        subject,
        grade,
        stream = 'all',
        total_marks = '100',
        due_date,
        teacher_name,
      } = req.body;

      if (!file || !title || !subject || !grade || !due_date || !teacher_name || !teacher_name.trim()) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      // Check admin authorization
      const authHeader = (req.headers.authorization || req.headers['authorization']);
      if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header provided' });
      }

      const requestSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: { user }, error: authErr } = await requestSupabase.auth.getUser();

      if (authErr || !user) {
        return res.status(401).json({ error: 'Invalid session' });
      }

      // Query profiles table to enforce admin role strictly
      const { data: userProfile, error: profileErr } = await requestSupabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileErr || !userProfile || userProfile.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required to create generated tests' });
      }

      const testId = \`test_\${Date.now()}_\${Math.random().toString(36).substring(2, 9)}\`;
      const mimeType = file.mimetype || 'application/pdf';

      fileStorage.set(testId, {
        buffer: file.buffer,
        mimeType,
        filename: file.originalname || 'generated_test_paper.pdf',
      });

      // Insert record into tests table (mock URL for local dev)
      const fileUrl = \`/api/files/\${testId}\`;
      const { data: insertedTest, error: insertErr } = await supabaseServer
        .from('tests')
        .insert([{
          id: testId,
          title,
          board,
          subject,
          grade,
          stream,
          total_marks: parseInt(total_marks, 10) || 100,
          due_date,
          teacher_name,
          teacher_id: null,
          uploaded_by: user.id,
          uploaded_by_name: userProfile.full_name,
          file_url: fileUrl,
          file_type: 'pdf',
          file_size_bytes: file.size,
          instructions: 'Auto-generated PDF assessment paper.',
        }])
        .select()
        .single();

      if (insertErr) {
        console.error('[API Create Generated Test] Supabase insert error:', insertErr);
        fileStorage.delete(testId);
        return res.status(500).json({ error: 'Failed to create test record in database' });
      }

      return res.status(200).json({ success: true, test: insertedTest });
    } catch (err) {
      console.error('[API Create Generated Test] Exception:', err);
      return res.status(500).json({ error: 'Internal server error during generated test creation' });
    }
  });

  `;

content = content.substring(0, insertionIndex) + newEndpoint + content.substring(insertionIndex);
fs.writeFileSync('server.ts', content);
