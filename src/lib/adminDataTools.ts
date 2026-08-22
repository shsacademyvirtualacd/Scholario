import { Type, type FunctionDeclaration } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';

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
          description: 'Filter by academic stream (e.g. "Pre-Medical", "Pre-Engineering", "Computer Science", "General")',
        },
        search: {
          type: Type.STRING,
          description: 'Search keyword to match student full name or phone',
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
 * Execute strictly read-only queries against Supabase tables for Admin queries.
 * NEVER perform inserts, updates, deletes, or modifications.
 */
export async function executeAdminDataQuery(
  toolName: string,
  args: Record<string, any> = {},
  supabase: SupabaseClient
): Promise<any> {
  try {
    switch (toolName) {
      case 'queryStudentsAndEnrollments': {
        const [profilesRes, classesRes, boardsRes, streamsRes, enrollmentsRes, feeStatusesRes] =
          await Promise.all([
            supabase.from('profiles').select('*').eq('role', 'student'),
            supabase.from('classes').select('*, board:boards(*)'),
            supabase.from('boards').select('*'),
            supabase.from('streams').select('*'),
            supabase.from('enrollments').select('student_id'),
            supabase.from('fee_statuses').select('*'),
          ]);

        const students = profilesRes.data || [];
        const classes = classesRes.data || [];
        const boards = boardsRes.data || [];
        const streams = streamsRes.data || [];
        const enrollments = enrollmentsRes.data || [];
        const feeStatuses = feeStatusesRes.data || [];

        const classMap = new Map(classes.map((c: any) => [c.id, c]));
        const boardMap = new Map(boards.map((b: any) => [b.id, b.name]));
        const streamMap = new Map(streams.map((s: any) => [s.id, s.name]));
        const feeStatusMap = new Map(feeStatuses.map((f: any) => [f.student_id, f.status]));

        const enrollmentCountMap = new Map<string, number>();
        enrollments.forEach((e: any) => {
          enrollmentCountMap.set(e.student_id, (enrollmentCountMap.get(e.student_id) || 0) + 1);
        });

        const enrichedStudents = students.map((s: any) => {
          const classObj = s.class_id ? classMap.get(s.class_id) : null;
          const grade = classObj?.grade || s.grade || 'Unassigned';
          const boardName = s.board_id
            ? boardMap.get(s.board_id) || (s.board_id === 'sindh' ? 'Sindh Board' : 'Federal Board (FBISE)')
            : classObj?.board?.name || 'Unassigned';
          const streamName = s.stream_id ? streamMap.get(s.stream_id) || s.stream : s.stream || 'General';

          return {
            id: s.id,
            full_name: s.full_name || 'Unnamed Student',
            phone: s.phone || 'N/A',
            board_id: s.board_id || classObj?.board_id || 'unassigned',
            board_name: boardName,
            grade,
            stream: streamName,
            onboarding_complete: Boolean(s.onboarding_complete),
            enrolled_courses_count: enrollmentCountMap.get(s.id) || 0,
            fee_status: feeStatusMap.get(s.id) || 'unpaid',
            joined_at: s.created_at,
          };
        });

        let filtered = enrichedStudents;
        if (args.board && args.board !== 'all') {
          const b = String(args.board).toLowerCase();
          filtered = filtered.filter(
            (s) => s.board_id.toLowerCase().includes(b) || s.board_name.toLowerCase().includes(b)
          );
        }
        if (args.grade && args.grade !== 'all') {
          const g = String(args.grade);
          filtered = filtered.filter((s) => s.grade === g || s.grade.includes(g));
        }
        if (args.stream && args.stream !== 'all') {
          const st = String(args.stream).toLowerCase();
          filtered = filtered.filter((s) => s.stream.toLowerCase().includes(st));
        }
        if (args.onboarding_status && args.onboarding_status !== 'all') {
          const isComplete = args.onboarding_status === 'completed';
          filtered = filtered.filter((s) => s.onboarding_complete === isComplete);
        }
        if (args.search && typeof args.search === 'string') {
          const q = args.search.toLowerCase().trim();
          filtered = filtered.filter(
            (s) => s.full_name.toLowerCase().includes(q) || s.phone.includes(q)
          );
        }

        const byBoard: Record<string, number> = {};
        const byGrade: Record<string, number> = {};
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
          breakdown_by_board: byBoard,
          breakdown_by_grade: byGrade,
          breakdown_by_stream: byStream,
          matching_count: filtered.length,
          students: filtered.slice(0, 100),
        };
      }

      case 'queryTeachersAndFaculty': {
        const [teachersRes, offeringsRes] = await Promise.all([
          supabase.from('teachers').select('*').order('full_name'),
          supabase.from('class_offerings').select('*, class:classes(*, board:boards(*)), subject:subjects(*)'),
        ]);

        const teachers = teachersRes.data || [];
        const offerings = offeringsRes.data || [];

        const teacherOfferingsMap = new Map<string, any[]>();
        offerings.forEach((off: any) => {
          if (off.teacher_id) {
            const list = teacherOfferingsMap.get(off.teacher_id) || [];
            list.push({
              subject: off.subject?.name || 'Subject',
              grade: off.class?.grade || '10',
              board: off.class?.board?.name || 'FBISE',
            });
            teacherOfferingsMap.set(off.teacher_id, list);
          }
        });

        const enrichedTeachers = teachers.map((t: any) => ({
          id: t.id,
          full_name: t.full_name,
          email: t.email || 'N/A',
          phone: t.phone || 'N/A',
          is_active: t.is_active !== false,
          joining_date: t.joining_date || t.created_at,
          assigned_courses: teacherOfferingsMap.get(t.id) || [],
        }));

        let filtered = enrichedTeachers;
        if (args.is_active !== undefined) {
          filtered = filtered.filter((t) => t.is_active === args.is_active);
        }
        if (args.search && typeof args.search === 'string') {
          const q = args.search.toLowerCase().trim();
          filtered = filtered.filter(
            (t) => t.full_name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
          );
        }

        return {
          total_teachers: teachers.length,
          active_teachers_count: teachers.filter((t: any) => t.is_active !== false).length,
          teachers: filtered,
        };
      }

      case 'queryClassOfferingsAndTimetables': {
        const [offeringsRes, slotsRes] = await Promise.all([
          supabase
            .from('class_offerings')
            .select('*, class:classes(*, board:boards(*)), subject:subjects(*), teacher:teachers(*), stream:streams(*)'),
          supabase.from('class_slots').select('*, offering:class_offerings(*, subject:subjects(*), class:classes(*))'),
        ]);

        const offerings = (offeringsRes.data || []).map((o: any) => ({
          id: o.id,
          board: o.class?.board?.name || (o.class?.board_id === 'sindh' ? 'Sindh Board' : 'FBISE'),
          grade: o.class?.grade || '10',
          subject: o.subject?.name || 'Subject',
          stream: o.stream?.name || 'All',
          teacher: o.teacher?.full_name || 'Unassigned',
        }));

        const slots = (slotsRes.data || []).map((s: any) => {
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return {
            id: s.id,
            day: days[s.day_of_week] || `Day ${s.day_of_week}`,
            start_time: s.start_time,
            end_time: s.end_time,
            subject: s.offering?.subject?.name || s.custom_title || 'Class',
            grade: s.offering?.class?.grade || 'N/A',
            room_or_link: s.room_or_link || 'Online link',
            is_cancelled: Boolean(s.is_cancelled),
          };
        });

        let filteredOfferings = offerings;
        if (args.board) {
          const b = String(args.board).toLowerCase();
          filteredOfferings = filteredOfferings.filter((o) => o.board.toLowerCase().includes(b));
        }
        if (args.grade) {
          const g = String(args.grade);
          filteredOfferings = filteredOfferings.filter((o) => o.grade === g || o.grade.includes(g));
        }
        if (args.subject) {
          const sub = String(args.subject).toLowerCase();
          filteredOfferings = filteredOfferings.filter((o) => o.subject.toLowerCase().includes(sub));
        }

        return {
          total_offerings: offerings.length,
          total_schedule_slots: slots.length,
          offerings: filteredOfferings,
          timetables: slots.slice(0, 50),
        };
      }

      case 'queryAttendanceRecords': {
        const [attendanceRes, profilesRes] = await Promise.all([
          supabase.from('attendance').select('*').order('session_date', { ascending: false }).limit(200),
          supabase.from('profiles').select('id, full_name'),
        ]);

        const attendance = attendanceRes.data || [];
        const studentMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p.full_name]));

        const enriched = attendance.map((a: any) => ({
          id: a.id,
          student_id: a.student_id,
          student_name: studentMap.get(a.student_id) || 'Student',
          date: a.session_date,
          status: a.status,
          marked_by: a.marked_by || 'system',
          marked_at: a.marked_at,
        }));

        let filtered = enriched;
        if (args.date) {
          filtered = filtered.filter((a) => a.date === args.date);
        }
        if (args.status && args.status !== 'all') {
          filtered = filtered.filter((a) => a.status === args.status);
        }
        if (args.student_name) {
          const q = String(args.student_name).toLowerCase();
          filtered = filtered.filter((a) => a.student_name.toLowerCase().includes(q));
        }

        const presentCount = enriched.filter((a) => a.status === 'present').length;
        const absentCount = enriched.filter((a) => a.status === 'absent').length;
        const lateCount = enriched.filter((a) => a.status === 'late').length;
        const total = enriched.length;
        const rate = total > 0 ? ((presentCount + lateCount * 0.5) / total) * 100 : 0;

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
          supabase.from('tests').select('*').order('created_at', { ascending: false }),
          supabase.from('test_submissions').select('*').order('submitted_at', { ascending: false }),
        ]);

        const tests = testsRes.data || [];
        const submissions = subsRes.data || [];

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
          filtered = filtered.filter((t) => t.grade === g || t.grade.includes(g));
        }
        if (args.subject) {
          const sub = String(args.subject).toLowerCase();
          filtered = filtered.filter((t) => t.subject.toLowerCase().includes(sub));
        }
        if (args.search) {
          const q = String(args.search).toLowerCase();
          filtered = filtered.filter(
            (t) => t.title.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q)
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
        const [feeConfigsRes, classesRes, boardsRes, feeStatusesRes] = await Promise.all([
          supabase.from('fee_configs').select('*'),
          supabase.from('classes').select('*, board:boards(*)'),
          supabase.from('boards').select('*'),
          supabase.from('fee_statuses').select('*'),
        ]);

        const feeConfigs = feeConfigsRes.data || [];
        const classes = classesRes.data || [];
        const boards = boardsRes.data || [];
        const feeStatuses = feeStatusesRes.data || [];

        const classMap = new Map(classes.map((c: any) => [c.id, c]));
        const boardMap = new Map(boards.map((b: any) => [b.id, b.name]));

        const enrichedConfigs = feeConfigs.map((fc: any) => {
          const classObj = classMap.get(fc.class_id);
          const boardName = classObj?.board_id ? boardMap.get(classObj.board_id) : 'Federal Board (FBISE)';
          return {
            id: fc.id,
            class_id: fc.class_id,
            grade: classObj?.grade || 'General',
            board: boardName,
            monthly_amount_pkr: `Rs. ${fc.amount?.toLocaleString?.() || fc.amount}`,
            raw_amount: fc.amount,
            whatsapp_support: fc.whatsapp_number || '03335292094',
            payment_instructions: fc.payment_instructions,
          };
        });

        let filtered = enrichedConfigs;
        if (args.board) {
          const b = String(args.board).toLowerCase();
          filtered = filtered.filter((f) => f.board.toLowerCase().includes(b));
        }
        if (args.grade) {
          const g = String(args.grade);
          filtered = filtered.filter((f) => f.grade === g || f.grade.includes(g));
        }

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

      case 'queryPlatformOverview': {
        const [
          profilesRes,
          teachersRes,
          offeringsRes,
          testsRes,
          subsRes,
          feeConfigsRes,
          feeStatusesRes,
          attendanceRes,
        ] = await Promise.all([
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
              attendance.length > 0 ? `${((presentAttendance.length / attendance.length) * 100).toFixed(1)}%` : '0%',
            total_fee_configurations: feeConfigsRes.data?.length || 0,
            fee_compliance_rate:
              feeStatuses.length > 0 ? `${((paidFees.length / feeStatuses.length) * 100).toFixed(1)}%` : '0%',
          },
          status: 'live_database_connected',
        };
      }

      default:
        return { error: `Unrecognized query tool: ${toolName}` };
    }
  } catch (err: any) {
    console.error(`[executeAdminDataQuery Error in ${toolName}]:`, err);
    return { error: `Failed to fetch data for ${toolName}: ${err.message}` };
  }
}
