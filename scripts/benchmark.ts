import webpush from 'web-push';
import { checkAndSendTeacherPushReminders } from '../src/lib/serverPushService.ts';

// Stub webpush to avoid real network calls
webpush.sendNotification = (async () => {
  return { statusCode: 201, body: '', headers: {} };
}) as any;

function getPKTTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const pktDate = new Date(utc + 5 * 3600000);
  const dayIndex = pktDate.getDay();
  const totalMins = pktDate.getHours() * 60 + pktDate.getMinutes();

  // Create slot start time 5 mins in the future
  const startMins = totalMins + 5;
  const h = Math.floor(startMins / 60) % 24;
  const m = startMins % 60;
  const startTimeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;

  return { dayIndex, startTimeStr };
}

function createMockSupabase(numSlots: number) {
  let queryCount = 0;
  const { dayIndex, startTimeStr } = getPKTTime();

  const mockSlots = Array.from({ length: numSlots }, (_, i) => ({
    id: `slot_${i}`,
    day_of_week: dayIndex,
    start_time: startTimeStr,
    end_time: '23:59:00',
    custom_title: `Subject ${i}`,
    offering_id: `offering_${i}`,
    is_cancelled: false,
    class_id: `class_${i}`,
    last_reminder_sent_at: null,
    offering: {
      teacher_id: `teacher_${i}`,
      teacher: { id: `teacher_${i}` },
      subject: { name: `Subject ${i}` }
    }
  }));

  const createQueryBuilder = (tableName: string) => {
    queryCount++;
    const builder: any = {
      select: () => builder,
      eq: () => builder,
      in: (col: string, vals: any[]) => {
        if (tableName === 'push_subscriptions') {
          builder._data = vals.map(v => ({
            id: `sub_${v}`,
            user_id: v,
            role: 'teacher',
            endpoint: `https://push.example.com/${v}`,
            p256dh: 'fake',
            auth: 'fake',
            subscription_json: {}
          }));
        }
        return builder;
      },
      update: () => builder,
      then: (resolve: any, reject: any) => {
        let resultData: any = [];
        if (tableName === 'class_slots') {
          resultData = mockSlots;
        } else if (tableName === 'push_subscriptions') {
          resultData = builder._data || [];
        } else if (tableName === 'class_session_links') {
          resultData = [];
        } else if (tableName === 'live_sessions') {
          resultData = [];
        }
        return Promise.resolve({ data: resultData, error: null }).then(resolve, reject);
      }
    };
    return builder;
  };

  const mockClient = {
    from: (table: string) => createQueryBuilder(table),
    getQueryCount: () => queryCount,
    resetQueryCount: () => { queryCount = 0; }
  };

  return mockClient;
}

async function run() {
  const numSlots = 100;
  const mockSupabase = createMockSupabase(numSlots);

  mockSupabase.resetQueryCount();
  const start = performance.now();
  const remindersSent = await checkAndSendTeacherPushReminders(mockSupabase as any);
  const end = performance.now();

  console.log(`Slots: ${numSlots}`);
  console.log(`Reminders sent: ${remindersSent}`);
  console.log(`Database queries made: ${mockSupabase.getQueryCount()}`);
  console.log(`Time taken: ${(end - start).toFixed(2)} ms`);
}

run().catch(console.error);
