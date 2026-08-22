import { Type, type FunctionDeclaration } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Pool } = pg;

const DB_URL =
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:Marcelmmm23155@@db.rxgrxjlyrfzojvirkhdc.supabase.co:5432/postgres';

let pgPool: pg.Pool | null = null;

function getPgPool(): pg.Pool | null {
  if (pgPool) return pgPool;
  try {
    if (DB_URL) {
      pgPool = new Pool({
        connectionString: DB_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }
  } catch (err) {
    console.warn('[adminDataTools] Failed to initialize pg.Pool:', err);
  }
  return pgPool;
}

export const adminToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'queryStudentsAndEnrollments',
    description: 'Fetch real-time student profiles, enrollment statistics, board/grade/stream distributions, onboarding statuses, and fee payment statuses across the academy. (Read-only for Admin)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        board: {
          type: Type.STRING,
          description: 'Filter by board: "fbise" (Federal Board), "sindh" (Sindh Board), or "all"',
        },
        grade: {
          type: Type.STRING,
          description: 'Filter by class/grade: "9", "10", "11", "12", or "all"',
        },
        stream: {
          type: Type.STRING,
          description: 'Filter by academic stream (e.g. "Pre-Medical", "Pre-Engineering", "Computer Science", "Biology", "General")',
        },
        search: {
          type: Type.STRING,
          description: 'Search keyword to match student full name, email, or phone',
        },
        onboarding_status: {
          type: Type.STRING,
          description: '"completed", "pending", or "all"',
        },
      },
    },
  },
  {
    name: 'queryTeachersAndFaculty',
    description: 'Fetch real-time teacher and faculty member records, contact details, active statuses, joining dates, and assigned subject/grade teaching offerings. (Read-only for Admin)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        search: {
          type: Type.STRING,
          description: 'Search keyword to match teacher name or email',
        },
        is_active: {
          type: Type.BOOLEAN,
          description: 'Filter by active status (true or false)',
        },
      },
    },
  },
  {
    name: 'queryClassOfferingsAndTimetables',
    description: 'Fetch live academic course offerings, subject assignments, assigned faculty, and scheduled class timetable slots. (Read-only for Admin)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        board: {
          type: Type.STRING,
          description: 'Filter by board ("fbise" or "sindh")',
        },
        grade: {
          type: Type.STRING,
          description: 'Filter by class grade ("9", "10", "11", "12")',
        },
        subject: {
          type: Type.STRING,
          description: 'Filter or search by subject name (e.g. "Physics", "Mathematics", "Biology")',
        },
      },
    },
  },
  {
    name: 'queryAttendanceRecords',
    description: 'Fetch real-time student attendance logs, session dates, marked attendance status (present, absent, late), and overall academy attendance rates. (Read-only for Admin)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        date: {
          type: Type.STRING,
          description: 'Date in YYYY-MM-DD format to filter attendance',
        },
        student_name: {
          type: Type.STRING,
          description: 'Student name to search for attendance history',
        },
        status: {
          type: Type.STRING,
          description: 'Filter by status: "present", "absent", "late", or "all"',
        },
      },
    },
  },
  {
    name: 'queryTestsAndAssessments',
    description: 'Fetch published test question papers, instructions, total marks, due dates, and student answer sheet submissions with marks/grades obtained and teacher feedback. (Read-only for Admin)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        grade: {
          type: Type.STRING,
          description: 'Filter by grade ("9", "10", "11", "12")',
        },
        subject: {
          type: Type.STRING,
          description: 'Filter by subject name (e.g. "Physics", "Chemistry")',
        },
        search: {
          type: Type.STRING,
          description: 'Search term for test title or student name',
        },
      },
    },
  },
  {
    name: 'queryPricingAndFeeConfigs',
    description: 'Fetch official academy tuition fee structures (amount in PKR, payment instructions, WhatsApp accounts) per grade/board, and aggregated student payment statuses (paid, unpaid, pending). (Read-only for Admin)',
    parameters: {
      type: Type.OBJECT,
      properties: {
        board: {
          type: Type.STRING,
          description: 'Filter by board ("fbise" or "sindh")',
        },
        grade: {
          type: Type.STRING,
          description: 'Filter by grade ("9", "10", "11", "12")',
        },
      },
    },
  },
  {
    name: 'queryPlatformOverview',
    description: 'Fetch comprehensive instant summary metrics and KPIs across the entire academy: total students (with board & grade breakdown), total teachers, active offerings, tests, submissions, and fee statuses. (Read-only for Admin)',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

/**
 * Execute strictly read-only queries against Supabase / PostgreSQL database for Admin tools.
 * Prioritizes direct PostgreSQL pool for complete, unconstrained administrative reads.
 */
export async function executeAdminDataQuery(
  toolName: string,
  args: Record<string, any> = {},
  supabase?: SupabaseClient
): Promise<any> {
  const pool = getPgPool();

  if (pool) {
    try {
      return await executeViaPg(toolName, args, pool);
    } catch (pgErr) {
      console.warn(`[adminDataTools] Direct pg query failed for ${toolName}, trying Supabase fallback:`, pgErr);
    }
  }

  if (supabase) {
    return await executeViaSupabase(toolName, args, supabase);
  }

  return { error: 'No database connection available' };
}

async function executeViaPg(toolName: string, args: Record<string, any>, pool: pg.Pool): Promise<any> {
  switch (toolName) {
    case 'queryStudentsAndEnrollments': {
      const [profilesRes, rosterOnlyRes] = await Promise.all([
        pool.query(`
          SELECT
            p.id,
            p.full_name,
            p.phone,
            p.role,
            p.board_id,
            p.class_id,
            p.stream,
            p.onboarding_complete,
            p.created_at,
            c.grade as class_grade,
            c.display_name as class_name,
            b.name as board_name,
            r.email as roster_email,
            r.suspended as roster_suspended,
            r.fee_suspended as roster_fee_suspended,
            COALESCE(fs.status, 'unpaid') as fee_status
          FROM public.profiles p
          LEFT JOIN public.classes c ON p.class_id = c.id
          LEFT JOIN public.boards b ON (p.board_id = b.id OR c.board_id = b.id)
          LEFT JOIN public.roster r ON r.profile_id = p.id
          LEFT JOIN public.fee_statuses fs ON fs.student_id = p.id
          WHERE p.role = 'student'
          ORDER BY p.created_at ASC
        `),
        pool.query(`
          SELECT
            r.id as roster_id,
            r.full_name,
            r.email as roster_email,
            r.role,
            r.class_ids,
            r.profile_id,
            r.created_at
          FROM public.roster r
          WHERE r.role = 'student'
            AND (r.profile_id IS NULL OR r.profile_id NOT IN (SELECT id FROM public.profiles WHERE role = 'student'))
        `),
      ]);

      const allStudents: Array<{
        id: string;
        full_name: string;
        email: string;
        phone: string;
        board_id: string;
        board_name: string;
        grade: string;
        stream: string;
        onboarding_complete: boolean;
        fee_status: string;
        joined_at: any;
      }> = profilesRes.rows.map((s: any) => {
        const grade = s.class_grade || 'Unassigned';
        const boardName = s.board_name || (s.board_id === 'sindh' ? 'Sindh Board' : 'Federal Board (FBISE)');
        const streamName = s.stream || 'Biology';
        return {
          id: s.id,
          full_name: s.full_name || 'Unnamed Student',
          email: s.roster_email || 'N/A',
          phone: s.phone || 'N/A',
          board_id: s.board_id || 'fbise',
          board_name: boardName,
          grade,
          stream: streamName,
          onboarding_complete: Boolean(s.onboarding_complete),
          fee_status: s.fee_status || 'unpaid',
          joined_at: s.created_at,
        };
      });

      rosterOnlyRes.rows.forEach((r: any) => {
        allStudents.push({
          id: r.profile_id || r.roster_id,
          full_name: r.full_name,
          email: r.roster_email,
          phone: 'N/A',
          board_id: 'fbise',
          board_name: 'Federal Board (FBISE)',
          grade: '9',
          stream: 'Biology',
          onboarding_complete: false,
          fee_status: 'unpaid',
          joined_at: r.created_at,
        });
      });

      let filtered = allStudents;
      if (args.board && args.board !== 'all') {
        const b = String(args.board).toLowerCase();
        filtered = filtered.filter(
          (s: any) => s.board_id.toLowerCase().includes(b) || s.board_name.toLowerCase().includes(b)
        );
      }
      if (args.grade && args.grade !== 'all') {
        const g = String(args.grade);
        filtered = filtered.filter((s: any) => s.grade === g || s.grade.includes(g));
      }
      if (args.stream && args.stream !== 'all') {
        const st = String(args.stream).toLowerCase();
        filtered = filtered.filter((s: any) => s.stream.toLowerCase().includes(st));
      }
      if (args.onboarding_status && args.onboarding_status !== 'all') {
        const isComplete = args.onboarding_status === 'completed';
        filtered = filtered.filter((s: any) => s.onboarding_complete === isComplete);
      }
      if (args.search && typeof args.search === 'string') {
        const q = args.search.toLowerCase().trim();
        filtered = filtered.filter(
          (s: any) =>
            s.full_name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q) ||
            s.phone.includes(q)
        );
      }

      const byBoard: Record<string, number> = {};
      const byGrade: Record<string, number> = {
        'Grade 9': 0,
        'Grade 10': 0,
        'Grade 11': 0,
        'Grade 12': 0,
      };
      const byStream: Record<string, number> = {};
      let onboardedCount = 0;

      allStudents.forEach((s: any) => {
        byBoard[s.board_name] = (byBoard[s.board_name] || 0) + 1;
        const gradeKey = `Grade ${s.grade}`;
        byGrade[gradeKey] = (byGrade[gradeKey] || 0) + 1;
        byStream[s.stream] = (byStream[s.stream] || 0) + 1;
        if (s.onboarding_complete) onboardedCount++;
      });

      return {
        total_registered_students: allStudents.length,
        onboarded_students_count: onboardedCount,
        breakdown_by_grade: byGrade,
        breakdown_by_board: byBoard,
        breakdown_by_stream: byStream,
        matching_count: filtered.length,
        students: filtered,
      };
    }

    case 'queryPlatformOverview': {
      const [
        studentsRes,
        teachersRes,
        offeringsRes,
        testsRes,
        subsRes,
        feeConfigsRes,
        feeStatusesRes,
        attendanceRes,
      ] = await Promise.all([
        pool.query(`
          SELECT
            p.id,
            p.full_name,
            p.role,
            p.stream,
            p.board_id,
            p.onboarding_complete,
            c.grade as class_grade,
            b.name as board_name
          FROM public.profiles p
          LEFT JOIN public.classes c ON p.class_id = c.id
          LEFT JOIN public.boards b ON (p.board_id = b.id OR c.board_id = b.id)
          WHERE p.role = 'student'
        `),
        pool.query(`SELECT id, full_name, email, is_active FROM public.teachers`),
        pool.query(`SELECT count(*) as count FROM public.class_offerings`),
        pool.query(`SELECT count(*) as count FROM public.tests`),
        pool.query(`SELECT id, status, marks_obtained FROM public.test_submissions`),
        pool.query(`SELECT count(*) as count FROM public.fee_configs`),
        pool.query(`SELECT id, status FROM public.fee_statuses`),
        pool.query(`SELECT id, status FROM public.attendance`),
      ]);

      const students = studentsRes.rows;
      const totalStudents = students.length;
      const onboardedStudents = students.filter((s: any) => s.onboarding_complete).length;

      const byGrade: Record<string, number> = {
        'Grade 9': 0,
        'Grade 10': 0,
        'Grade 11': 0,
        'Grade 12': 0,
      };
      const byBoard: Record<string, number> = {};
      const byStream: Record<string, number> = {};

      students.forEach((s: any) => {
        const gradeKey = `Grade ${s.class_grade || '9'}`;
        byGrade[gradeKey] = (byGrade[gradeKey] || 0) + 1;
        const boardName = s.board_name || (s.board_id === 'sindh' ? 'Sindh Board' : 'Federal Board (FBISE)');
        byBoard[boardName] = (byBoard[boardName] || 0) + 1;
        const streamName = s.stream || 'Biology';
        byStream[streamName] = (byStream[streamName] || 0) + 1;
      });

      const teachers = teachersRes.rows;
      const activeTeachers = teachers.filter((t: any) => t.is_active !== false).length;
      const submissions = subsRes.rows;
      const gradedSubmissions = submissions.filter((s: any) => s.status === 'graded').length;
      const feeStatuses = feeStatusesRes.rows;
      const paidFees = feeStatuses.filter((f: any) => f.status === 'paid').length;
      const attendance = attendanceRes.rows;
      const presentAttendance = attendance.filter((a: any) => a.status === 'present').length;

      return {
        platform_name: 'Scholario / SHS Virtual Academy',
        kpis: {
          total_registered_students: totalStudents,
          onboarded_students: onboardedStudents,
          breakdown_by_grade: byGrade,
          breakdown_by_board: byBoard,
          breakdown_by_stream: byStream,
          total_faculty_teachers: teachers.length,
          active_teachers: activeTeachers,
          active_class_offerings: Number(offeringsRes.rows[0]?.count || 0),
          published_assessments_count: Number(testsRes.rows[0]?.count || 0),
          total_student_submissions: submissions.length,
          graded_submissions: gradedSubmissions,
          total_attendance_logs: attendance.length,
          overall_attendance_rate:
            attendance.length > 0 ? `${((presentAttendance / attendance.length) * 100).toFixed(1)}%` : '100%',
          total_fee_configurations: Number(feeConfigsRes.rows[0]?.count || 0),
          fee_compliance_rate:
            feeStatuses.length > 0 ? `${((paidFees / feeStatuses.length) * 100).toFixed(1)}%` : '100%',
        },
        status: 'live_database_connected',
      };
    }

    case 'queryTeachersAndFaculty': {
      const [teachersRes, offeringsRes] = await Promise.all([
        pool.query(`
          SELECT
            t.id,
            t.full_name,
            t.email,
            t.avatar_url,
            t.is_active,
            t.joining_date,
            t.created_at
          FROM public.teachers t
          ORDER BY t.full_name ASC
        `),
        pool.query(`
          SELECT
            co.teacher_id,
            s.name as subject_name,
            c.grade as class_grade,
            b.name as board_name
          FROM public.class_offerings co
          LEFT JOIN public.subjects s ON co.subject_id = s.id
          LEFT JOIN public.classes c ON co.class_id = c.id
          LEFT JOIN public.boards b ON c.board_id = b.id
        `),
      ]);

      const teacherOfferingsMap = new Map<string, any[]>();
      offeringsRes.rows.forEach((off: any) => {
        if (off.teacher_id) {
          const list = teacherOfferingsMap.get(off.teacher_id) || [];
          list.push({
            subject: off.subject_name || 'Subject',
            grade: off.class_grade || '10',
            board: off.board_name || 'FBISE',
          });
          teacherOfferingsMap.set(off.teacher_id, list);
        }
      });

      const enrichedTeachers = teachersRes.rows.map((t: any) => ({
        id: t.id,
        full_name: t.full_name,
        email: t.email || 'N/A',
        is_active: t.is_active !== false,
        joining_date: t.joining_date || t.created_at,
        assigned_courses: teacherOfferingsMap.get(t.id) || [],
      }));

      let filtered = enrichedTeachers;
      if (args.is_active !== undefined) {
        filtered = filtered.filter((t: any) => t.is_active === args.is_active);
      }
      if (args.search && typeof args.search === 'string') {
        const q = args.search.toLowerCase().trim();
        filtered = filtered.filter(
          (t: any) => t.full_name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
        );
      }

      return {
        total_teachers: teachersRes.rowCount,
        active_teachers_count: teachersRes.rows.filter((t: any) => t.is_active !== false).length,
        teachers: filtered,
      };
    }

    case 'queryClassOfferingsAndTimetables': {
      const [offeringsRes, slotsRes] = await Promise.all([
        pool.query(`
          SELECT
            co.id,
            s.name as subject_name,
            c.grade as class_grade,
            b.name as board_name,
            c.board_id,
            t.full_name as teacher_name,
            st.name as stream_name
          FROM public.class_offerings co
          LEFT JOIN public.subjects s ON co.subject_id = s.id
          LEFT JOIN public.classes c ON co.class_id = c.id
          LEFT JOIN public.boards b ON c.board_id = b.id
          LEFT JOIN public.teachers t ON co.teacher_id = t.id
          LEFT JOIN public.streams st ON co.stream_id = st.id
        `),
        pool.query(`
          SELECT
            cs.id,
            cs.day_of_week,
            cs.start_time,
            cs.end_time,
            cs.room_or_link,
            cs.is_cancelled,
            cs.custom_title,
            s.name as subject_name,
            c.grade as class_grade
          FROM public.class_slots cs
          LEFT JOIN public.class_offerings co ON cs.offering_id = co.id
          LEFT JOIN public.subjects s ON co.subject_id = s.id
          LEFT JOIN public.classes c ON (co.class_id = c.id OR cs.class_id = c.id)
        `),
      ]);

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const slots = slotsRes.rows.map((s: any) => ({
        id: s.id,
        day: days[s.day_of_week] || `Day ${s.day_of_week}`,
        start_time: s.start_time,
        end_time: s.end_time,
        subject: s.subject_name || s.custom_title || 'Class',
        grade: s.class_grade || 'N/A',
        room_or_link: s.room_or_link || 'Online link',
        is_cancelled: Boolean(s.is_cancelled),
      }));

      const offerings = offeringsRes.rows.map((o: any) => ({
        id: o.id,
        board: o.board_name || (o.board_id === 'sindh' ? 'Sindh Board' : 'Federal Board (FBISE)'),
        grade: o.class_grade || '10',
        subject: o.subject_name || 'Subject',
        stream: o.stream_name || 'All',
        teacher: o.teacher_name || 'Unassigned',
      }));

      let filteredOfferings = offerings;
      if (args.board) {
        const b = String(args.board).toLowerCase();
        filteredOfferings = filteredOfferings.filter((o: any) => o.board.toLowerCase().includes(b));
      }
      if (args.grade) {
        const g = String(args.grade);
        filteredOfferings = filteredOfferings.filter((o: any) => o.grade === g || o.grade.includes(g));
      }
      if (args.subject) {
        const sub = String(args.subject).toLowerCase();
        filteredOfferings = filteredOfferings.filter((o: any) => o.subject.toLowerCase().includes(sub));
      }

      return {
        total_offerings: offerings.length,
        total_schedule_slots: slots.length,
        offerings: filteredOfferings,
        timetables: slots.slice(0, 50),
      };
    }

    case 'queryAttendanceRecords': {
      const attendanceRes = await pool.query(`
        SELECT
          a.id,
          a.student_id,
          a.session_date,
          a.status,
          a.marked_by,
          a.marked_at,
          p.full_name as student_name
        FROM public.attendance a
        LEFT JOIN public.profiles p ON a.student_id = p.id
        ORDER BY a.session_date DESC
        LIMIT 200
      `);

      const records = attendanceRes.rows.map((a: any) => ({
        id: a.id,
        student_id: a.student_id,
        student_name: a.student_name || 'Student',
        date: a.session_date,
        status: a.status,
        marked_by: a.marked_by || 'system',
        marked_at: a.marked_at,
      }));

      let filtered = records;
      if (args.date) {
        filtered = filtered.filter((a: any) => a.date === args.date);
      }
      if (args.status && args.status !== 'all') {
        filtered = filtered.filter((a: any) => a.status === args.status);
      }
      if (args.student_name) {
        const q = String(args.student_name).toLowerCase();
        filtered = filtered.filter((a: any) => a.student_name.toLowerCase().includes(q));
      }

      const presentCount = records.filter((a: any) => a.status === 'present').length;
      const absentCount = records.filter((a: any) => a.status === 'absent').length;
      const lateCount = records.filter((a: any) => a.status === 'late').length;
      const total = records.length;
      const rate = total > 0 ? ((presentCount + lateCount * 0.5) / total) * 100 : 100;

      return {
        total_records_logged: total,
        present_count: presentCount,
        absent_count: absentCount,
        late_count: lateCount,
        attendance_rate_percentage: `${rate.toFixed(1)}%`,
        recent_records: filtered.slice(0, 50),
      };
    }

    case 'queryTestsAndAssessments': {
      const [testsRes, subsRes] = await Promise.all([
        pool.query(`
          SELECT
            id,
            title,
            instructions,
            subject,
            grade,
            stream,
            teacher_name,
            total_marks,
            due_date,
            created_at
          FROM public.tests
          ORDER BY created_at DESC
        `),
        pool.query(`
          SELECT
            id,
            test_id,
            student_id,
            student_name,
            student_email,
            status,
            marks_obtained,
            max_marks,
            teacher_feedback,
            submitted_at
          FROM public.test_submissions
          ORDER BY submitted_at DESC
        `),
      ]);

      const tests = testsRes.rows;
      const submissions = subsRes.rows;

      const subsCountMap = new Map<string, { total: number; graded: number; totalMarksObtained: number }>();
      submissions.forEach((s: any) => {
        const entry = subsCountMap.get(s.test_id) || { total: 0, graded: 0, totalMarksObtained: 0 };
        entry.total++;
        if (s.status === 'graded') {
          entry.graded++;
          entry.totalMarksObtained += Number(s.marks_obtained || 0);
        }
        subsCountMap.set(s.test_id, entry);
      });

      const enrichedTests = tests.map((t: any) => {
        const stats = subsCountMap.get(t.id) || { total: 0, graded: 0, totalMarksObtained: 0 };
        return {
          id: t.id,
          title: t.title,
          subject: t.subject,
          grade: t.grade,
          stream: t.stream,
          total_marks: t.total_marks,
          due_date: t.due_date,
          teacher_name: t.teacher_name || 'Admin',
          submissions_received: stats.total,
          submissions_graded: stats.graded,
          average_marks: stats.graded > 0 ? (stats.totalMarksObtained / stats.graded).toFixed(1) : 'N/A',
          created_at: t.created_at,
        };
      });

      let filtered = enrichedTests;
      if (args.grade) {
        const g = String(args.grade);
        filtered = filtered.filter((t: any) => t.grade === g || t.grade.includes(g));
      }
      if (args.subject) {
        const sub = String(args.subject).toLowerCase();
        filtered = filtered.filter((t: any) => t.subject.toLowerCase().includes(sub));
      }
      if (args.search) {
        const q = String(args.search).toLowerCase();
        filtered = filtered.filter(
          (t: any) => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
        );
      }

      return {
        total_published_tests: tests.length,
        total_student_submissions: submissions.length,
        tests: filtered,
        recent_submissions: submissions.slice(0, 30).map((s: any) => ({
          id: s.id,
          test_id: s.test_id,
          student_name: s.student_name || 'Student',
          status: s.status,
          marks_obtained: s.marks_obtained,
          max_marks: s.max_marks,
          teacher_feedback: s.teacher_feedback || 'No feedback yet',
          submitted_at: s.submitted_at,
        })),
      };
    }

    case 'queryPricingAndFeeConfigs': {
      const [feeConfigsRes, feeStatusesRes] = await Promise.all([
        pool.query(`
          SELECT
            fc.id,
            fc.class_id,
            fc.amount,
            fc.payment_instructions,
            fc.whatsapp_number,
            c.grade,
            b.name as board_name
          FROM public.fee_configs fc
          LEFT JOIN public.classes c ON fc.class_id = c.id
          LEFT JOIN public.boards b ON c.board_id = b.id
        `),
        pool.query(`SELECT id, student_id, status FROM public.fee_statuses`),
      ]);

      const feeConfigs = feeConfigsRes.rows.map((fc: any) => ({
        id: fc.id,
        class_id: fc.class_id,
        grade: fc.grade || 'General',
        board: fc.board_name || 'Federal Board (FBISE)',
        monthly_amount_pkr: `Rs. ${Number(fc.amount || 0).toLocaleString()}`,
        raw_amount: Number(fc.amount || 0),
        whatsapp_support: fc.whatsapp_number || '03335292094',
        payment_instructions: fc.payment_instructions,
      }));

      let filtered = feeConfigs;
      if (args.board) {
        const b = String(args.board).toLowerCase();
        filtered = filtered.filter((f: any) => f.board.toLowerCase().includes(b));
      }
      if (args.grade) {
        const g = String(args.grade);
        filtered = filtered.filter((f: any) => f.grade === g || f.grade.includes(g));
      }

      const feeStatuses = feeStatusesRes.rows;
      const paidCount = feeStatuses.filter((s: any) => s.status === 'paid').length;
      const pendingCount = feeStatuses.filter((s: any) => s.status === 'pending').length;
      const unpaidCount = feeStatuses.filter((s: any) => s.status === 'unpaid').length;

      return {
        total_fee_tiers: feeConfigs.length,
        student_fee_status_summary: {
          total_students_tracked: feeStatuses.length,
          paid: paidCount,
          pending_verification: pendingCount,
          unpaid: unpaidCount,
        },
        fee_configurations: filtered,
      };
    }

    default:
      return { error: `Unrecognized query tool: ${toolName}` };
  }
}

async function executeViaSupabase(
  toolName: string,
  _args: Record<string, any>,
  supabase: SupabaseClient
): Promise<any> {
  switch (toolName) {
    case 'queryStudentsAndEnrollments': {
      const [profilesRes, classesRes, boardsRes, streamsRes, feeStatusesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('role', 'student'),
        supabase.from('classes').select('*, board:boards(*)'),
        supabase.from('boards').select('*'),
        supabase.from('streams').select('*'),
        supabase.from('fee_statuses').select('*'),
      ]);

      const students = profilesRes.data || [];
      const classes = classesRes.data || [];
      const boards = boardsRes.data || [];
      const streams = streamsRes.data || [];
      const feeStatuses = feeStatusesRes.data || [];

      const classMap = new Map(classes.map((c: any) => [c.id, c]));
      const boardMap = new Map(boards.map((b: any) => [b.id, b.name]));
      const streamMap = new Map(streams.map((s: any) => [s.id, s.name]));
      const feeStatusMap = new Map(feeStatuses.map((f: any) => [f.student_id, f.status]));

      const enrichedStudents = students.map((s: any) => {
        const classObj = s.class_id ? classMap.get(s.class_id) : null;
        const grade = classObj?.grade || s.grade || 'Unassigned';
        const boardName = s.board_id
          ? boardMap.get(s.board_id) || (s.board_id === 'sindh' ? 'Sindh Board' : 'Federal Board (FBISE)')
          : classObj?.board?.name || 'Federal Board (FBISE)';
        const streamName = s.stream_id ? streamMap.get(s.stream_id) || s.stream : s.stream || 'Biology';

        return {
          id: s.id,
          full_name: s.full_name || 'Unnamed Student',
          phone: s.phone || 'N/A',
          board_id: s.board_id || classObj?.board_id || 'fbise',
          board_name: boardName,
          grade,
          stream: streamName,
          onboarding_complete: Boolean(s.onboarding_complete),
          fee_status: feeStatusMap.get(s.id) || 'unpaid',
          joined_at: s.created_at,
        };
      });

      const byBoard: Record<string, number> = {};
      const byGrade: Record<string, number> = { 'Grade 9': 0, 'Grade 10': 0, 'Grade 11': 0, 'Grade 12': 0 };
      const byStream: Record<string, number> = {};
      let onboardedCount = 0;

      enrichedStudents.forEach((s) => {
        byBoard[s.board_name] = (byBoard[s.board_name] || 0) + 1;
        byGrade[`Grade ${s.grade}`] = (byGrade[`Grade ${s.grade}`] || 0) + 1;
        byStream[s.stream] = (byStream[s.stream] || 0) + 1;
        if (s.onboarding_complete) onboardedCount++;
      });

      return {
        total_registered_students: enrichedStudents.length,
        onboarded_students_count: onboardedCount,
        breakdown_by_grade: byGrade,
        breakdown_by_board: byBoard,
        breakdown_by_stream: byStream,
        matching_count: enrichedStudents.length,
        students: enrichedStudents,
      };
    }

    case 'queryPlatformOverview': {
      const [profilesRes, teachersRes, offeringsRes, testsRes, subsRes, feeConfigsRes, feeStatusesRes, attendanceRes] =
        await Promise.all([
          supabase.from('profiles').select('id, role, onboarding_complete, board_id, stream'),
          supabase.from('teachers').select('id, is_active'),
          supabase.from('class_offerings').select('id'),
          supabase.from('tests').select('id'),
          supabase.from('test_submissions').select('id, status'),
          supabase.from('fee_configs').select('id, amount'),
          supabase.from('fee_statuses').select('id, status'),
          supabase.from('attendance').select('id, status'),
        ]);

      const allProfiles = profilesRes.data || [];
      const students = allProfiles.filter((p: any) => p.role === 'student');
      const onboardedStudents = students.filter((p: any) => p.onboarding_complete);
      const teachers = teachersRes.data || [];
      const activeTeachers = teachers.filter((t: any) => t.is_active !== false);
      const submissions = subsRes.data || [];
      const gradedSubmissions = submissions.filter((s: any) => s.status === 'graded');
      const feeStatuses = feeStatusesRes.data || [];
      const paidFees = feeStatuses.filter((f: any) => f.status === 'paid');
      const attendance = attendanceRes.data || [];
      const presentAttendance = attendance.filter((a: any) => a.status === 'present');

      return {
        platform_name: 'Scholario / SHS Virtual Academy',
        kpis: {
          total_registered_students: students.length,
          onboarded_students: onboardedStudents.length,
          total_faculty_teachers: teachers.length,
          active_teachers: activeTeachers.length,
          active_class_offerings: offeringsRes.data?.length || 0,
          published_assessments_count: testsRes.data?.length || 0,
          total_student_submissions: submissions.length,
          graded_submissions: gradedSubmissions.length,
          total_attendance_logs: attendance.length,
          overall_attendance_rate:
            attendance.length > 0 ? `${((presentAttendance.length / attendance.length) * 100).toFixed(1)}%` : '100%',
          total_fee_configurations: feeConfigsRes.data?.length || 0,
          fee_compliance_rate:
            feeStatuses.length > 0 ? `${((paidFees.length / feeStatuses.length) * 100).toFixed(1)}%` : '100%',
        },
        status: 'live_database_connected',
      };
    }

    default:
      return { error: `Unsupported tool ${toolName} on fallback` };
  }
}
