import { Client } from 'pg';

const connectionString = 'postgresql://postgres:Marcelmmm23155@@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

async function migrate() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to PostgreSQL database');

  try {
    await client.query('BEGIN');

    // 1. Insert/Update Boards
    console.log('1. Inserting boards...');
    await client.query(`
      INSERT INTO public.boards (id, name)
      VALUES 
        ('punjab', 'Punjab Board (BISE Lahore & Provincial)'),
        ('kpk', 'KPK Board (BISE Peshawar & Provincial)')
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;
    `);

    // 2. Insert/Update Classes for Punjab
    console.log('2. Inserting classes for Punjab...');
    await client.query(`
      INSERT INTO public.classes (board_id, grade, display_name)
      VALUES
        ('punjab', '9', '9th'),
        ('punjab', '10', '10th'),
        ('punjab', '11', '11th'),
        ('punjab', '12', '12th')
      ON CONFLICT (board_id, grade) DO UPDATE SET display_name = EXCLUDED.display_name;
    `);

    // Also ensure KPK classes exist
    console.log('2b. Ensuring classes for KPK...');
    await client.query(`
      INSERT INTO public.classes (board_id, grade, display_name)
      VALUES
        ('kpk', '9', '9th (SSC-I)'),
        ('kpk', '10', '10th (SSC-II)'),
        ('kpk', '11', '11th (HSSC-I)'),
        ('kpk', '12', '12th (HSSC-II)')
      ON CONFLICT (board_id, grade) DO UPDATE SET display_name = EXCLUDED.display_name;
    `);

    // 3. Insert Fee Configs for Punjab and KPK
    console.log('3. Inserting fee_configs...');
    const paymentInstructions = `Easypaisa:\nNumber: 03335292094\nName: Sadia Fatima\n\nJazzCash:\nNumber: 03058969050\nName: Haseena Bibi`;
    const whatsappNumber = '03222314436';

    await client.query(`
      INSERT INTO public.fee_configs (class_id, amount, payment_instructions, whatsapp_number)
      SELECT c.id, 3000, $1, $2
      FROM public.classes c
      WHERE c.board_id = 'punjab' AND c.grade IN ('9', '10')
      ON CONFLICT (class_id) DO UPDATE SET amount = EXCLUDED.amount, payment_instructions = EXCLUDED.payment_instructions, whatsapp_number = EXCLUDED.whatsapp_number;
    `, [paymentInstructions, whatsappNumber]);

    await client.query(`
      INSERT INTO public.fee_configs (class_id, amount, payment_instructions, whatsapp_number)
      SELECT c.id, 4000, $1, $2
      FROM public.classes c
      WHERE c.board_id = 'punjab' AND c.grade IN ('11', '12')
      ON CONFLICT (class_id) DO UPDATE SET amount = EXCLUDED.amount, payment_instructions = EXCLUDED.payment_instructions, whatsapp_number = EXCLUDED.whatsapp_number;
    `, [paymentInstructions, whatsappNumber]);

    // KPK fee configs
    await client.query(`
      INSERT INTO public.fee_configs (class_id, amount, payment_instructions, whatsapp_number)
      SELECT c.id, 3000, $1, $2
      FROM public.classes c
      WHERE c.board_id = 'kpk' AND c.grade IN ('9', '10')
      ON CONFLICT (class_id) DO UPDATE SET amount = EXCLUDED.amount, payment_instructions = EXCLUDED.payment_instructions, whatsapp_number = EXCLUDED.whatsapp_number;
    `, [paymentInstructions, whatsappNumber]);

    await client.query(`
      INSERT INTO public.fee_configs (class_id, amount, payment_instructions, whatsapp_number)
      SELECT c.id, 4000, $1, $2
      FROM public.classes c
      WHERE c.board_id = 'kpk' AND c.grade IN ('11', '12')
      ON CONFLICT (class_id) DO UPDATE SET amount = EXCLUDED.amount, payment_instructions = EXCLUDED.payment_instructions, whatsapp_number = EXCLUDED.whatsapp_number;
    `, [paymentInstructions, whatsappNumber]);

    // 4. Ensure all subjects exist
    console.log('4. Inserting subjects...');
    const allSubjects = [
      'English',
      'Urdu',
      'Islamiyat',
      'Islamiat',
      'Tarjuma-tul-Quran',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Biology',
      'Computer Science',
      'Computer',
      'General Mathematics',
      'General Science',
      'Pakistan Studies',
      'Statistics',
      'Economics',
      'Principles of Accounting',
      'Principles of Economics',
      'Principles of Commerce',
      'Business Mathematics',
      'Civics',
      'Education',
      'History of Pakistan',
      'Commercial Geography',
      'Banking',
      'Business Statistics',
    ];

    for (const sub of allSubjects) {
      await client.query(`
        INSERT INTO public.subjects (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING;
      `, [sub]);
    }

    // Map subject names to IDs
    const subRes = await client.query('SELECT id, name FROM public.subjects;');
    const subjectMap = new Map();
    for (const row of subRes.rows) {
      subjectMap.set(row.name.toLowerCase().trim(), row.id);
    }
    // Helper to get subject ID (with fallback for Islamiat/Islamiyat)
    const getSubId = (name) => {
      const n = name.toLowerCase().trim();
      if (subjectMap.has(n)) return subjectMap.get(n);
      if (n === 'islamiyat' && subjectMap.has('islamiat')) return subjectMap.get('islamiat');
      if (n === 'islamiat' && subjectMap.has('islamiyat')) return subjectMap.get('islamiyat');
      return null;
    };

    // 5. Streams and Stream Subjects for Punjab and KPK
    console.log('5. Inserting streams & stream_subjects for Punjab & KPK...');

    // Get class IDs
    const classesRes = await client.query('SELECT id, board_id, grade FROM public.classes WHERE board_id IN (\'punjab\', \'kpk\');');
    const classMap = new Map(); // key: `${board_id}-${grade}`
    for (const row of classesRes.rows) {
      classMap.set(`${row.board_id}-${row.grade}`, row.id);
    }

    // Definition of streams for Punjab
    const punjabStreams = [
      // Grade 9
      {
        grade: '9',
        streams: [
          {
            name: 'Biology',
            subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Computer Science',
            subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'General',
            subjects: ['English', 'Urdu', 'General Mathematics', 'General Science', 'Islamiyat', 'Tarjuma-tul-Quran']
          }
        ]
      },
      // Grade 10
      {
        grade: '10',
        streams: [
          {
            name: 'Biology',
            subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Computer Science',
            subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'General',
            subjects: ['English', 'Urdu', 'General Mathematics', 'General Science', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran']
          }
        ]
      },
      // Grade 11
      {
        grade: '11',
        streams: [
          {
            name: 'Pre-Medical',
            subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Pre-Engineering',
            subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'ICS (Computer Science)',
            subjects: ['English', 'Urdu', 'Physics', 'Computer Science', 'Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'General Science',
            subjects: ['English', 'Urdu', 'Mathematics', 'Statistics', 'Economics', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Commerce (I.Com)',
            subjects: ['English', 'Urdu', 'Principles of Accounting', 'Principles of Economics', 'Principles of Commerce', 'Business Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Humanities / Arts',
            subjects: ['English', 'Urdu', 'Islamiyat', 'Tarjuma-tul-Quran', 'Civics', 'Education', 'History of Pakistan']
          }
        ]
      },
      // Grade 12
      {
        grade: '12',
        streams: [
          {
            name: 'Pre-Medical',
            subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Pre-Engineering',
            subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          },
          {
            name: 'ICS (Computer Science)',
            subjects: ['English', 'Urdu', 'Physics', 'Computer Science', 'Mathematics', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          },
          {
            name: 'General Science',
            subjects: ['English', 'Urdu', 'Mathematics', 'Statistics', 'Economics', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Commerce (I.Com)',
            subjects: ['English', 'Urdu', 'Commercial Geography', 'Banking', 'Business Statistics', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Humanities / Arts',
            subjects: ['English', 'Urdu', 'Pakistan Studies', 'Tarjuma-tul-Quran', 'Civics', 'Education', 'History of Pakistan']
          }
        ]
      }
    ];

    // Definition of streams for KPK
    const kpkStreams = [
      // Grade 9
      {
        grade: '9',
        streams: [
          {
            name: 'Science (Biology)',
            subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Science (Computer Science)',
            subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'General / Humanities',
            subjects: ['English', 'Urdu', 'General Mathematics', 'General Science', 'Islamiyat', 'Tarjuma-tul-Quran', 'Civics']
          }
        ]
      },
      // Grade 10
      {
        grade: '10',
        streams: [
          {
            name: 'Science (Biology)',
            subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Science (Computer Science)',
            subjects: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Computer Science', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'General / Humanities',
            subjects: ['English', 'Urdu', 'General Mathematics', 'General Science', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran', 'Civics']
          }
        ]
      },
      // Grade 11
      {
        grade: '11',
        streams: [
          {
            name: 'Pre-Medical',
            subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Pre-Engineering',
            subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Computer Science (ICS)',
            subjects: ['English', 'Urdu', 'Physics', 'Computer Science', 'Mathematics', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'General Science',
            subjects: ['English', 'Urdu', 'Mathematics', 'Statistics', 'Economics', 'Islamiyat', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Humanities',
            subjects: ['English', 'Urdu', 'Civics', 'History of Pakistan', 'Economics', 'Islamiyat', 'Tarjuma-tul-Quran']
          }
        ]
      },
      // Grade 12
      {
        grade: '12',
        streams: [
          {
            name: 'Pre-Medical',
            subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Biology', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Pre-Engineering',
            subjects: ['English', 'Urdu', 'Physics', 'Chemistry', 'Mathematics', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Computer Science (ICS)',
            subjects: ['English', 'Urdu', 'Physics', 'Computer Science', 'Mathematics', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          },
          {
            name: 'General Science',
            subjects: ['English', 'Urdu', 'Mathematics', 'Statistics', 'Economics', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          },
          {
            name: 'Humanities',
            subjects: ['English', 'Urdu', 'Civics', 'History of Pakistan', 'Economics', 'Pakistan Studies', 'Tarjuma-tul-Quran']
          }
        ]
      }
    ];

    // Helper to insert stream & subjects
    const insertBoardStreams = async (boardId, gradeList) => {
      for (const item of gradeList) {
        const classId = classMap.get(`${boardId}-${item.grade}`);
        if (!classId) {
          console.warn(`Class not found for ${boardId}-${item.grade}`);
          continue;
        }

        for (const st of item.streams) {
          // Insert stream
          const streamRes = await client.query(`
            INSERT INTO public.streams (class_id, name)
            VALUES ($1, $2)
            ON CONFLICT (class_id, name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id;
          `, [classId, st.name]);

          const streamId = streamRes.rows[0]?.id;
          if (!streamId) continue;

          // Insert stream_subjects
          for (const subName of st.subjects) {
            const subId = getSubId(subName);
            if (subId) {
              await client.query(`
                INSERT INTO public.stream_subjects (stream_id, subject_id)
                VALUES ($1, $2)
                ON CONFLICT (stream_id, subject_id) DO NOTHING;
              `, [streamId, subId]);
            } else {
              console.warn(`Could not resolve subject ID for ${subName}`);
            }
          }
        }
      }
    };

    await insertBoardStreams('punjab', punjabStreams);
    await insertBoardStreams('kpk', kpkStreams);

    // 6. Insert Class Offerings for Punjab & KPK classes
    console.log('6. Inserting class_offerings for Punjab & KPK...');
    const coreSubjectsForOfferings = [
      'English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 
      'Computer Science', 'Pakistan Studies', 'Islamiyat', 'Tarjuma-tul-Quran'
    ];

    for (const [key, classId] of classMap.entries()) {
      for (const subName of coreSubjectsForOfferings) {
        const subId = getSubId(subName);
        if (subId) {
          await client.query(`
            INSERT INTO public.class_offerings (class_id, subject_id, stream_id, teacher_id)
            VALUES ($1, $2, NULL, NULL)
            ON CONFLICT (class_id, subject_id, stream_id) DO NOTHING;
          `, [classId, subId]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('Successfully completed Punjab & KPK database migration!');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed, rolled back:', err);
    throw err;
  } finally {
    await client.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
