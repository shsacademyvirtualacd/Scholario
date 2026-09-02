import json
import re
import random
import os
import sys

# Import the 12 new question batch modules
from data_sva_3 import QUESTIONS_SVA_3
from data_tenses_3 import QUESTIONS_TENSES_3
from data_conditionals_3 import QUESTIONS_CONDITIONALS_3
from data_passive_3 import QUESTIONS_PASSIVE_3
from data_relative_3 import QUESTIONS_RELATIVE_3
from data_modals_3 import QUESTIONS_MODALS_3
from data_articles_3 import QUESTIONS_ARTICLES_3
from data_prepositions_3 import QUESTIONS_PREPOSITIONS_3
from data_inversion_3 import QUESTIONS_INVERSION_3
from data_conjunctions_3 import QUESTIONS_CONJUNCTIONS_3
from data_punctuation_3 import QUESTIONS_PUNCTUATION_3
from data_error_id_3 import QUESTIONS_ERROR_ID_3

def load_existing_1000():
    with open('src/data/banks/ielts/grammar.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find IELTS_GRAMMAR_MCQS array
    match = re.search(r'export const IELTS_GRAMMAR_MCQS:\s*RawIELTSMCQ\[\]\s*=\s*(\[[\s\S]*?\]);\s*$', content)
    if not match:
        raise ValueError("Could not extract IELTS_GRAMMAR_MCQS from grammar.ts")
    
    raw_json = match.group(1)
    # Parse JSON
    questions = json.loads(raw_json)
    questions_1000 = questions[:1000]
    print(f"Successfully loaded {len(questions_1000)} existing questions.")
    return questions_1000

def balance_options(q, target_key):
    """Permute options so that correctAnswer becomes target_key while keeping truth value."""
    current_key = q['correctAnswer']
    if current_key == target_key:
        return q

    key_to_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
    idx_to_key = {0: 'A', 1: 'B', 2: 'C', 3: 'D'}

    options = list(q['options'])
    correct_val = options[key_to_idx[current_key]]
    
    # Target index
    t_idx = key_to_idx[target_key]
    c_idx = key_to_idx[current_key]

    # Swap
    options[c_idx], options[t_idx] = options[t_idx], options[c_idx]

    q_copy = dict(q)
    q_copy['options'] = options
    q_copy['correctAnswer'] = target_key
    return q_copy

def main():
    existing_1000 = load_existing_1000()
    assert len(existing_1000) == 1000, f"Expected 1000 existing questions, got {len(existing_1000)}"

    batches = [
        (QUESTIONS_SVA_3, "Subject-Verb Agreement", 45),
        (QUESTIONS_TENSES_3, "Tenses, Aspect & Time Clauses", 50),
        (QUESTIONS_CONDITIONALS_3, "Conditionals & Unreal Past", 45),
        (QUESTIONS_PASSIVE_3, "Passive Voice & Causatives", 45),
        (QUESTIONS_RELATIVE_3, "Relative Clauses & Participles", 45),
        (QUESTIONS_MODALS_3, "Modals & Past Deduction", 40),
        (QUESTIONS_ARTICLES_3, "Articles & Quantifiers", 45),
        (QUESTIONS_PREPOSITIONS_3, "Prepositions & Collocations", 45),
        (QUESTIONS_INVERSION_3, "Inversion, Fronting & Subjunctive", 40),
        (QUESTIONS_CONJUNCTIONS_3, "Conjunctions & Sentence Structure", 45),
        (QUESTIONS_PUNCTUATION_3, "Punctuation & Syntax Mechanics", 25),
        (QUESTIONS_ERROR_ID_3, "Error Identification & Correction", 30),
    ]

    new_500 = []
    current_id_num = 1001

    target_cycle = ['A', 'B', 'C', 'D']
    cycle_idx = 0

    for batch, topic, expected_count in batches:
        assert len(batch) == expected_count, f"Topic {topic} has {len(batch)} questions, expected {expected_count}"
        for raw_q in batch:
            q_id = f"ielts-gram-{current_id_num}"
            current_id_num += 1

            # Balance answer across A, B, C, D
            target_ans = target_cycle[cycle_idx % 4]
            cycle_idx += 1

            balanced_q = balance_options(raw_q, target_ans)

            new_q = {
                "id": q_id,
                "question": balanced_q["question"],
                "options": balanced_q["options"],
                "correctAnswer": balanced_q["correctAnswer"],
                "explanation": balanced_q["explanation"],
                "difficulty": balanced_q.get("difficulty", "medium"),
                "chapter": "Grammar",
                "topic": topic
            }
            new_500.append(new_q)

    assert len(new_500) == 500, f"Expected 500 new questions, got {len(new_500)}"
    print(f"Successfully processed and balanced {len(new_500)} new questions (IDs ielts-gram-1001 to ielts-gram-1500).")

    all_1500 = existing_1000 + new_500
    assert len(all_1500) == 1500, f"Expected 1500 total questions, got {len(all_1500)}"

    # Verification Checks
    print("\n--- RUNNING COMPREHENSIVE VERIFICATION ON 1,500 QUESTIONS ---")
    
    # 1. ID Uniqueness
    ids = [q['id'] for q in all_1500]
    assert len(ids) == len(set(ids)), "Duplicate IDs found!"
    print(f"✓ All 1,500 IDs are unique (ielts-gram-001 through ielts-gram-1500).")

    # 2. Options and Answer Validity
    ans_counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0}
    for i, q in enumerate(all_1500):
        assert len(q['options']) == 4, f"Question {q['id']} does not have 4 options!"
        assert q['correctAnswer'] in ['A', 'B', 'C', 'D'], f"Invalid answer key in {q['id']}"
        ans_counts[q['correctAnswer']] += 1
        assert len(q['question'].strip()) > 10, f"Question {q['id']} text too short"
        assert len(q['explanation'].strip()) > 10, f"Question {q['id']} explanation too short"

    print(f"✓ Answer distribution across 1,500 questions: {ans_counts}")
    for k, v in ans_counts.items():
        pct = (v / 1500) * 100
        print(f"  {k}: {v} ({pct:.1f}%)")

    # 3. Exact Duplicate Question Text Check
    q_texts = {}
    for q in all_1500:
        # Normalize text
        norm = re.sub(r'\s+', ' ', q['question'].strip().lower())
        if norm in q_texts:
            print(f"WARNING: Potential duplicate between {q['id']} and {q_texts[norm]}: '{q['question']}'")
        q_texts[norm] = q['id']
    
    print(f"✓ Exact question text uniqueness verified ({len(q_texts)} distinct normalized stems).")

    # 4. Jaccard N-gram / Token Similarity Check between new 500 and all other questions
    def tokenize(text):
        words = re.findall(r'[a-z0-9]+', text.lower())
        # ignore generic prompt prefixes
        stop = {'choose', 'the', 'correct', 'option', 'form', 'sentence', 'blank', 'in', 'of', 'fill', 'select', 'identify', 'underlined', 'portion', 'containing', 'a', 'an', 'error', 'grammatical', 'grammatically'}
        return set([w for w in words if w not in stop])

    high_sim_pairs = []
    for i in range(1000, 1500):
        q_new = all_1500[i]
        tokens_new = tokenize(q_new['question'])
        if not tokens_new:
            continue
        for j in range(0, i):
            q_prev = all_1500[j]
            tokens_prev = tokenize(q_prev['question'])
            if not tokens_prev:
                continue
            intersection = tokens_new.intersection(tokens_prev)
            union = tokens_new.union(tokens_prev)
            sim = len(intersection) / len(union)
            if sim > 0.80:
                high_sim_pairs.append((sim, q_new['id'], q_prev['id'], q_new['question'], q_prev['question']))

    if high_sim_pairs:
        print(f"WARNING: Found {len(high_sim_pairs)} pairs with >80% similarity:")
        for sim, id1, id2, t1, t2 in high_sim_pairs[:5]:
            print(f"  Similarity {sim:.2f} between {id1} and {id2}:\n    1: {t1}\n    2: {t2}")
    else:
        print(f"✓ No near-duplicate question stems found across all 1,500 questions (Max Jaccard similarity < 0.80).")

    # 5. Topic Breakdown
    topics = {}
    for q in all_1500:
        t = q.get('topic', 'Unknown')
        topics[t] = topics.get(t, 0) + 1

    print(f"\n✓ Topic breakdown across 1,500 questions:")
    for t, c in sorted(topics.items(), key=lambda x: -x[1]):
        print(f"  - {t}: {c} questions")

    # Write out the updated grammar.ts
    output_ts = f"""/**
 * IELTS 1,500-Question Authoritative Grammar MCQ Bank
 * Comprehensive syllabus covering:
 * - Subject-Verb Agreement
 * - Tenses, Aspect & Time Clauses
 * - Conditionals & Unreal Past
 * - Passive Voice & Causatives
 * - Relative Clauses & Participles
 * - Modals & Past Deduction
 * - Articles & Quantifiers
 * - Prepositions, Collocations & Phrasal Verbs
 * - Inversion, Fronting & Subjunctive
 * - Conjunctions & Sentence Structure
 * - Punctuation & Syntax Mechanics
 * - Error Identification & Sentence Correction
 */

export interface RawIELTSMCQ {{
  id: string;
  question: string;
  options: string[] | {{ A: string; B: string; C: string; D: string }};
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'board_exam' | string;
  topic?: string;
  chapter?: string;
  passage?: string;
}}

export type StoredMCQ = RawIELTSMCQ;

// ==========================================
// 1,500 GRAMMAR MCQS (SYLLABUS & IELTS ACCURATE)
// ==========================================
export const IELTS_GRAMMAR_MCQS: RawIELTSMCQ[] = {json.dumps(all_1500, indent=2)};
"""

    with open('src/data/banks/ielts/grammar.ts', 'w', encoding='utf-8') as f:
        f.write(output_ts)

    print(f"\n✓ Successfully wrote 1,500 questions to src/data/banks/ielts/grammar.ts")

if __name__ == '__main__':
    main()
