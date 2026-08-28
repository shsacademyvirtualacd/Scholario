import { describe, it, expect } from 'vitest';
import { normalizeQuestionTemplate } from './mcqValidator';

describe('normalizeQuestionTemplate', () => {
  it('returns empty string for empty input', () => {
    expect(normalizeQuestionTemplate('')).toBe('');
    // @ts-expect-error - testing invalid input
    expect(normalizeQuestionTemplate(null)).toBe('');
    // @ts-expect-error - testing invalid input
    expect(normalizeQuestionTemplate(undefined)).toBe('');
  });

  it('converts to lowercase', () => {
    expect(normalizeQuestionTemplate('HELLO WORLD')).toBe('hello world');
    expect(normalizeQuestionTemplate('MiXeD CaSe')).toBe('mixed case');
  });

  it('replaces LaTeX math expressions with <MATH>', () => {
    expect(normalizeQuestionTemplate('What is $x + y$ ?')).toBe('what is <MATH>');
    expect(normalizeQuestionTemplate('Calculate $\\frac{1}{2}$ and $x^2$.')).toBe('calculate <MATH> and <MATH>');
    // Ensure multiple separate math blocks are replaced individually,
    // and non-math text between them is kept
    expect(normalizeQuestionTemplate('$a$ plus $b$')).toBe('<MATH> plus <MATH>');
  });

  it('replaces numbers (integers, decimals, scientific) with <NUM>', () => {
    // integers
    expect(normalizeQuestionTemplate('I have 5 apples and 42 oranges.')).toBe('i have <NUM> apples and <NUM> oranges');
    // decimals
    expect(normalizeQuestionTemplate('The value of pi is 3.14159.')).toBe('the value of pi is <NUM>');
    // scientific notation
    expect(normalizeQuestionTemplate('Speed of light is 3e8 m/s.')).toBe('speed of light is <NUM> m s');
    expect(normalizeQuestionTemplate('Charge is 1.6e-19 C.')).toBe('charge is <NUM> c');
  });

  it('removes punctuation and replaces it with spaces', () => {
    // keeping <> for tags like <MATH> and <NUM>
    expect(normalizeQuestionTemplate('Hello, world! How are you?')).toBe('hello world how are you');
    expect(normalizeQuestionTemplate('a-b_c/d\\e')).toBe('a b_c d e'); // _ is considered a word character in \w
  });

  it('collapses consecutive whitespaces and trims', () => {
    expect(normalizeQuestionTemplate('  too   many    spaces  ')).toBe('too many spaces');
    expect(normalizeQuestionTemplate('tabs\t\tand\nnewlines')).toBe('tabs and newlines');
  });

  it('handles complex mixed inputs correctly', () => {
    const input = '  Evaluate the expression $\\int_0^1 x^2 dx$ where x = 5.3!  Is it > 2.5e-1 ?  ';
    // breakdown of replacements:
    // 1. lowercase: '  evaluate the expression $\\int_0^1 x^2 dx$ where x = 5.3!  is it > 2.5e-1 ?  '
    // 2. math: '  evaluate the expression <MATH> where x = 5.3!  is it > 2.5e-1 ?  '
    // 3. numbers: '  evaluate the expression <MATH> where x = <NUM>!  is it > <NUM> ?  '
    // 4. punctuation: '  evaluate the expression <MATH> where x   <NUM>   is it < <NUM>    ' (actually > is removed since [^\w\s<>] excludes >)
    // Wait, the regex is /[^\w\s<>]/g -> so < and > are KEPT.
    // Let's re-evaluate:
    // '  evaluate the expression <MATH> where x = <NUM>!  is it > <NUM> ?  '
    // After punctuation removal (keeps \w, \s, <, >):
    // '  evaluate the expression <MATH> where x   <NUM>   is it > <NUM>    '
    // After space collapse:
    // 'evaluate the expression <MATH> where x <NUM> is it > <NUM>'
    expect(normalizeQuestionTemplate(input)).toBe('evaluate the expression <MATH> where x <NUM> is it > <NUM>');
  });
});
