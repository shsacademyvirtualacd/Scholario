import { describe, it, expect } from 'vitest';
import {
  getAllSubjectNames,
  getGradesForBoard,
  getBoardDef,
  getDefaultPrice,
  getStreamsForGrade,
  getSubjectsForStream,
  getEnrolledSubjectsForStudent,
  getStudentBoardLabel,
  getStudentGradeLabel,
  formatGradeDisplay,
  getStudentStreamLabel,
  formatShortClassAndBoard,
  BOARDS,
  FBISE_GRADES,
  PUNJAB_GRADES,
  SINDH_GRADES,
  KPK_GRADES,
  OLEVEL_GRADES,
  ALEVEL_GRADES,
  IELTS_GRADES,
} from '../taxonomy';

describe('taxonomy - getAllSubjectNames', () => {
  it('returns a non-empty array of strings', () => {
    const subjects = getAllSubjectNames();
    expect(Array.isArray(subjects)).toBe(true);
    expect(subjects.length).toBeGreaterThan(0);
    subjects.forEach((subject) => {
      expect(typeof subject).toBe('string');
      expect(subject.trim()).not.toBe('');
    });
  });

  it('returns unique subject names with no duplicates', () => {
    const subjects = getAllSubjectNames();
    const uniqueSubjects = Array.from(new Set(subjects));
    expect(subjects.length).toBe(uniqueSubjects.length);
  });

  it('returns subjects sorted alphabetically', () => {
    const subjects = getAllSubjectNames();
    const sortedSubjects = [...subjects].sort();
    expect(subjects).toEqual(sortedSubjects);
  });

  it('includes expected subjects across all board grades and streams', () => {
    const subjects = getAllSubjectNames();

    // Check key general subjects
    expect(subjects).toContain('English');
    expect(subjects).toContain('Urdu');
    expect(subjects).toContain('Physics');
    expect(subjects).toContain('Chemistry');
    expect(subjects).toContain('Mathematics');
    expect(subjects).toContain('Biology');
    expect(subjects).toContain('Computer Science');

    // Check IELTS subjects
    expect(subjects).toContain('IELTS Reading (Academic)');
    expect(subjects).toContain('IELTS Listening');
    expect(subjects).toContain('IELTS Writing (GT)');

    // Check Cambridge O/A level subjects
    expect(subjects).toContain('Mathematics (Syllabus D)');
    expect(subjects).toContain('Further Mathematics');
    expect(subjects).toContain('Business Studies');

    // Check KPK subject
    expect(subjects).toContain('Tarjuma-tul-Quran');
  });
});

describe('taxonomy - Additional Utility Functions', () => {
  it('getGradesForBoard retrieves appropriate grades for boards', () => {
    expect(getGradesForBoard('punjab')).toEqual(PUNJAB_GRADES);
    expect(getGradesForBoard('sindh')).toEqual(SINDH_GRADES);
    expect(getGradesForBoard('ielts')).toEqual(IELTS_GRADES);
    expect(getGradesForBoard('olevel')).toEqual(OLEVEL_GRADES);
    expect(getGradesForBoard('alevel')).toEqual(ALEVEL_GRADES);
    expect(getGradesForBoard('kpk')).toEqual(KPK_GRADES);
    expect(getGradesForBoard('fbise')).toEqual(FBISE_GRADES);
    expect(getGradesForBoard('unknown')).toEqual(FBISE_GRADES);
  });

  it('getBoardDef retrieves matching BoardDef or defaults to first board', () => {
    expect(getBoardDef('fbise').name).toBe('Federal Board (FBISE)');
    expect(getBoardDef('sindh').name).toBe('Sindh Board');
    expect(getBoardDef('nonexistent')).toEqual(BOARDS[0]);
    expect(getBoardDef(null)).toEqual(BOARDS[0]);
  });

  it('getDefaultPrice returns expected monthly prices', () => {
    expect(getDefaultPrice('9', 'alevel')).toBe(6500);
    expect(getDefaultPrice('9', 'olevel')).toBe(5000);
    expect(getDefaultPrice('9', 'punjab')).toBe(3000);
    expect(getDefaultPrice('11', 'punjab')).toBe(4000);
    expect(getDefaultPrice('IELTS', 'ielts')).toBe(2500);
    expect(getDefaultPrice('IELTS', 'ielts', 'General Training')).toBe(3000);
    expect(getDefaultPrice('9', 'fbise')).toBe(3000);
    expect(getDefaultPrice('12', 'fbise')).toBe(4000);
  });

  it('getStreamsForGrade resolves streams correctly and handles edge cases', () => {
    expect(getStreamsForGrade('9', 'fbise').length).toBeGreaterThan(0);
    expect(getStreamsForGrade('Grade 9', 'fbise')).toEqual(getStreamsForGrade('9', 'fbise'));
    // Swapped arguments handling
    expect(getStreamsForGrade('fbise', '9').length).toBeGreaterThan(0);
    // Unmatched grade fallback
    expect(getStreamsForGrade('999', 'fbise')).toEqual(FBISE_GRADES[0].streams);
  });

  it('getSubjectsForStream fallback and resolves subjects correctly', () => {
    const subjects = getSubjectsForStream('9', 'Medical', 'fbise');
    expect(subjects).toContain('Biology');
    expect(subjects).toContain('Physics');
  });

  it('getEnrolledSubjectsForStudent derives subjects for profile correctly', () => {
    const customProfile = { plan_type: 'custom', subjects: ['Physics', 'Chemistry'] };
    expect(getEnrolledSubjectsForStudent(customProfile)).toEqual(['Chemistry', 'Physics']);
  });

  it('getStudentBoardLabel and getStudentGradeLabel resolve labels correctly', () => {
    const student = { board_id: 'sindh', grade: '9' };
    expect(getStudentBoardLabel(student)).toBe('Sindh Board');
    expect(getStudentGradeLabel(student)).toBe('Grade 9');
  });

  it('getStudentStreamLabel formats streams correctly', () => {
    expect(getStudentStreamLabel({ stream: 'pre-medical' })).toBe('Pre-Medical');
    expect(getStudentStreamLabel({ stream: 'ics' })).toBe('ICS');
  });

  it('formatGradeDisplay formats grade display cleanly', () => {
    expect(formatGradeDisplay(null)).toBe('General');
    expect(formatGradeDisplay('IELTS')).toBe('IELTS Preparation');
    expect(formatGradeDisplay('O1', 'olevel')).toBe('Class O1');
    expect(formatGradeDisplay('9', 'fbise')).toBe('Grade 9');
    expect(formatGradeDisplay('Grade 10', 'fbise')).toBe('Grade 10');
  });

  it('formatShortClassAndBoard produces concise abbreviations', () => {
    expect(formatShortClassAndBoard({ gradeName: 'Grade 9', boardName: 'Federal Board (FBISE)' })).toBe('Gr. 9 · FBISE');
    expect(formatShortClassAndBoard({ gradeName: 'IELTS Preparation', streamName: 'General Training' })).toBe('IELTS Prep · GT');
    expect(formatShortClassAndBoard({ gradeName: 'Grade 10', boardName: 'Sindh Board' })).toBe('Gr. 10 · Sindh');
    expect(formatShortClassAndBoard({ gradeName: 'Class O1', boardName: 'O Levels' })).toBe('O1 · O Levels');
  });
});
