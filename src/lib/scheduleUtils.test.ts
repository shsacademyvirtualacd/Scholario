import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getLinkAvailabilityStatus, PKTNow } from './scheduleUtils.js';
import type { ClassSlot } from '../types/database.js';

describe('getLinkAvailabilityStatus', () => {
  const basePktNow: PKTNow = {
    dayIndex: 0, // Monday
    totalMins: 540, // 09:00 AM (540 mins from midnight)
    hour: 9,
    minute: 0,
    dateString: '2025-03-10',
  };

  const defaultSlot: ClassSlot = {
    id: 'slot-1',
    offering_id: 'offering-1',
    day_of_week: 0, // Monday
    start_time: '09:00:00', // 540 mins
    end_time: '10:00:00', // 600 mins
    room_or_link: 'https://zoom.us/j/123456789',
    is_cancelled: false,
    created_at: '2025-01-01T00:00:00Z',
  };

  describe('Link Presence and Fallbacks', () => {
    test('returns "no_link" when neither session link nor slot link is present', () => {
      const slotWithoutLink: ClassSlot = {
        ...defaultSlot,
        room_or_link: null,
      };

      const result = getLinkAvailabilityStatus(slotWithoutLink, basePktNow);

      assert.deepEqual(result, {
        isAvailable: false,
        status: 'no_link',
        message: 'Class link not available yet',
      });
    });

    test('returns "no_link" when slot link is empty or whitespace-only', () => {
      const slotWithEmptyLink: ClassSlot = {
        ...defaultSlot,
        room_or_link: '   ',
      };

      const result = getLinkAvailabilityStatus(slotWithEmptyLink, basePktNow);

      assert.deepEqual(result, {
        isAvailable: false,
        status: 'no_link',
        message: 'Class link not available yet',
      });
    });

    test('uses sessionLinkUrl over slot.room_or_link when sessionLinkUrl is provided', () => {
      const sessionLink = 'https://meet.google.com/abc-defg-hij';
      const slotWithOtherLink: ClassSlot = {
        ...defaultSlot,
        room_or_link: 'https://zoom.us/j/old-link',
      };

      // At 09:00, window is 08:50 to 10:00, so link should be available
      const result = getLinkAvailabilityStatus(slotWithOtherLink, basePktNow, sessionLink);

      assert.equal(result.isAvailable, true);
      assert.equal(result.status, 'available');
    });

    test('falls back to slot.room_or_link when sessionLinkUrl is empty or whitespace', () => {
      const result = getLinkAvailabilityStatus(defaultSlot, basePktNow, '   ');

      assert.equal(result.isAvailable, true);
      assert.equal(result.status, 'available');
    });
  });

  describe('Cancellation Handling', () => {
    test('returns "ended" status with "Class cancelled" message when slot is cancelled', () => {
      const cancelledSlot: ClassSlot = {
        ...defaultSlot,
        is_cancelled: true,
      };

      const result = getLinkAvailabilityStatus(cancelledSlot, basePktNow);

      assert.deepEqual(result, {
        isAvailable: false,
        status: 'ended',
        message: 'Class cancelled',
      });
    });
  });

  describe('Date-based Restrictions (targetSessionDate)', () => {
    test('returns "ended" when targetSessionDate is in the past', () => {
      const result = getLinkAvailabilityStatus(
        defaultSlot,
        basePktNow,
        null,
        '2025-03-09' // Yesterday
      );

      assert.deepEqual(result, {
        isAvailable: false,
        status: 'ended',
        message: 'Class session ended',
      });
    });

    test('returns "future_day" when targetSessionDate is in the future', () => {
      const result = getLinkAvailabilityStatus(
        defaultSlot,
        basePktNow,
        null,
        '2025-03-11' // Tomorrow
      );

      assert.deepEqual(result, {
        isAvailable: false,
        status: 'future_day',
        message: 'Available 10m before class',
      });
    });

    test('proceeds to time window check when targetSessionDate matches PKT date', () => {
      const result = getLinkAvailabilityStatus(
        defaultSlot,
        basePktNow, // 09:00 AM
        null,
        '2025-03-10' // Today
      );

      assert.equal(result.isAvailable, true);
      assert.equal(result.status, 'available');
    });
  });

  describe('Day-of-Week Fallback (when targetSessionDate is not provided)', () => {
    test('returns "future_day" when slot.day_of_week does not match PKT dayIndex', () => {
      const tuesdaySlot: ClassSlot = {
        ...defaultSlot,
        day_of_week: 1, // Tuesday, but basePktNow is Monday (0)
      };

      const result = getLinkAvailabilityStatus(tuesdaySlot, basePktNow);

      assert.deepEqual(result, {
        isAvailable: false,
        status: 'future_day',
        message: 'Available 10m before class',
      });
    });

    test('treats undefined slot.day_of_week as 0 (Monday)', () => {
      const slotWithoutDay = {
        ...defaultSlot,
        day_of_week: undefined,
      } as unknown as ClassSlot;

      // When pktnow is Monday (0), slot without day defaults to 0 and matches
      const mondayResult = getLinkAvailabilityStatus(slotWithoutDay, basePktNow);
      assert.equal(mondayResult.status, 'available');

      // When pktnow is Tuesday (1), slot without day defaults to 0 and does not match
      const tuesdayNow: PKTNow = { ...basePktNow, dayIndex: 1 };
      const tuesdayResult = getLinkAvailabilityStatus(slotWithoutDay, tuesdayNow);
      assert.equal(tuesdayResult.status, 'future_day');
    });
  });

  describe('Time Window Rules and Boundaries', () => {
    // Slot start_time: 09:00 (540m), end_time: 10:00 (600m)
    // Unlock window: 08:50 (530m) to 10:00 (600m)

    test('returns "locked" with formatted minutes before the 10m unlock window (< 1 hour until unlock)', () => {
      // Current time: 08:00 AM (480 mins). Window starts at 08:50 AM (530 mins).
      // minsUntilUnlock = 530 - 480 = 50 mins
      const pktNowAt8AM: PKTNow = {
        ...basePktNow,
        totalMins: 480,
        hour: 8,
        minute: 0,
      };

      const result = getLinkAvailabilityStatus(defaultSlot, pktNowAt8AM);

      assert.deepEqual(result, {
        isAvailable: false,
        status: 'locked',
        message: 'Unlocks in 50m',
        minsUntilUnlock: 50,
      });
    });

    test('returns "locked" with formatted hours and minutes when > 1 hour until unlock', () => {
      // Current time: 06:20 AM (380 mins). Window starts at 08:50 AM (530 mins).
      // minsUntilUnlock = 530 - 380 = 150 mins (2h 30m)
      const pktNowAt620AM: PKTNow = {
        ...basePktNow,
        totalMins: 380,
        hour: 6,
        minute: 20,
      };

      const result = getLinkAvailabilityStatus(defaultSlot, pktNowAt620AM);

      assert.deepEqual(result, {
        isAvailable: false,
        status: 'locked',
        message: 'Unlocks in 2h 30m',
        minsUntilUnlock: 150,
      });
    });

    test('returns "available" exactly at window start time (start_time - 10 minutes)', () => {
      // Current time: 08:50 AM (530 mins)
      const pktNowAt850AM: PKTNow = {
        ...basePktNow,
        totalMins: 530,
        hour: 8,
        minute: 50,
      };

      const result = getLinkAvailabilityStatus(defaultSlot, pktNowAt850AM);

      assert.deepEqual(result, {
        isAvailable: true,
        status: 'available',
        message: 'Join Live Class',
      });
    });

    test('returns "available" during the 10-minute buffer prior to class start', () => {
      // Current time: 08:55 AM (535 mins)
      const pktNowAt855AM: PKTNow = {
        ...basePktNow,
        totalMins: 535,
        hour: 8,
        minute: 55,
      };

      const result = getLinkAvailabilityStatus(defaultSlot, pktNowAt855AM);

      assert.equal(result.isAvailable, true);
      assert.equal(result.status, 'available');
    });

    test('returns "available" during class session', () => {
      // Current time: 09:30 AM (570 mins)
      const pktNowAt930AM: PKTNow = {
        ...basePktNow,
        totalMins: 570,
        hour: 9,
        minute: 30,
      };

      const result = getLinkAvailabilityStatus(defaultSlot, pktNowAt930AM);

      assert.equal(result.isAvailable, true);
      assert.equal(result.status, 'available');
    });

    test('returns "available" exactly at class end time boundary', () => {
      // Current time: 10:00 AM (600 mins)
      const pktNowAt1000AM: PKTNow = {
        ...basePktNow,
        totalMins: 600,
        hour: 10,
        minute: 0,
      };

      const result = getLinkAvailabilityStatus(defaultSlot, pktNowAt1000AM);

      assert.equal(result.isAvailable, true);
      assert.equal(result.status, 'available');
    });

    test('returns "ended" after class end time has passed', () => {
      // Current time: 10:01 AM (601 mins)
      const pktNowAt1001AM: PKTNow = {
        ...basePktNow,
        totalMins: 601,
        hour: 10,
        minute: 1,
      };

      const result = getLinkAvailabilityStatus(defaultSlot, pktNowAt1001AM);

      assert.deepEqual(result, {
        isAvailable: false,
        status: 'ended',
        message: 'Class session ended',
      });
    });
  });

  describe('Default Fallbacks for Missing Time Fields', () => {
    test('handles slot without start_time or end_time gracefully', () => {
      const slotWithoutTimes: ClassSlot = {
        ...defaultSlot,
        start_time: '',
        end_time: '',
      };

      // startMins defaults to 0 ( midnight 00:00 )
      // endMins defaults to 0 + 60 = 60 mins ( 01:00 AM )
      // windowStartMins = -10 mins

      // Case 1: At 00:30 AM (30 mins), currentMins (30) is within -10 and 60 -> available
      const nightPktNow: PKTNow = {
        ...basePktNow,
        totalMins: 30,
        hour: 0,
        minute: 30,
      };

      const result = getLinkAvailabilityStatus(slotWithoutTimes, nightPktNow);
      assert.equal(result.isAvailable, true);
      assert.equal(result.status, 'available');

      // Case 2: At 09:00 AM (540 mins), currentMins (540) > endMins (60) -> ended
      const dayResult = getLinkAvailabilityStatus(slotWithoutTimes, basePktNow);
      assert.equal(dayResult.isAvailable, false);
      assert.equal(dayResult.status, 'ended');
    });
  });
});
