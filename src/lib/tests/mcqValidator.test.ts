import { describe, it, expect } from 'vitest';
import { calculateQuestionSimilarity } from '../mcqValidator';

describe('calculateQuestionSimilarity', () => {
  it('returns exact match similarity (1.0)', () => {
    const result = calculateQuestionSimilarity('What is 2+2?', ' What is 2+2? ');
    expect(result).toEqual({ similarity: 1.0, isTemplateDuplicate: true });
  });

  it('returns high similarity (0.95) for identical templates with length > 20', () => {
    // Only difference is numbers, which are normalized by the template logic
    const q1 = "What is the speed of an object moving at 5 m/s?";
    const q2 = "What is the speed of an object moving at 10 m/s?";
    const result = calculateQuestionSimilarity(q1, q2);
    expect(result).toEqual({ similarity: 0.95, isTemplateDuplicate: true });
  });

  it('returns similarity based on tokens when template is not identical', () => {
    // "speed" is the only shared token
    // q1 tokens: "speed", "light"
    // q2 tokens: "speed", "sound"
    const q1 = "What is the speed of light?";
    const q2 = "What is the speed of sound?";
    const result = calculateQuestionSimilarity(q1, q2);
    expect(result.similarity).toBeCloseTo(0.333, 2);
    expect(result.isTemplateDuplicate).toBe(false);
  });

  it('returns 0 similarity when there are no valid tokens', () => {
    const result = calculateQuestionSimilarity('What is?', 'Is it?');
    expect(result).toEqual({ similarity: 0, isTemplateDuplicate: false });
  });

  it('returns 0 similarity when tokens are completely disjoint', () => {
    const q1 = "Calculate the momentum of the car.";
    const q2 = "Find velocity for a given distance.";
    const result = calculateQuestionSimilarity(q1, q2);
    expect(result).toEqual({ similarity: 0, isTemplateDuplicate: false });
  });

  it('flags as template duplicate when Jaccard similarity >= 0.75', () => {
    // Tokens for q1: explain, fundamental, principles, quantum, mechanics, physics (6)
    // Tokens for q2: explain, fundamental, principles, quantum, physics (5)
    // Shared: explain, fundamental, principles, quantum, physics (5)
    // Union: 6
    // Similarity: 5 / 6 = 0.8333
    const q1 = "Explain the fundamental principles of quantum mechanics in physics.";
    const q2 = "Explain the fundamental principles of quantum physics.";
    const result = calculateQuestionSimilarity(q1, q2);
    expect(result.similarity).toBeCloseTo(0.833, 2);
    expect(result.isTemplateDuplicate).toBe(true);
  });
});
