import json
import re
import random
import os
import sys

# Import the 12 new question batch modules
sys.path.insert(0, os.path.dirname(__file__))
from data_sva_4 import QUESTIONS_SVA_4
from data_tenses_4 import QUESTIONS_TENSES_4
from data_conditionals_4 import QUESTIONS_CONDITIONALS_4
from data_passive_4 import QUESTIONS_PASSIVE_4
from data_relative_4 import QUESTIONS_RELATIVE_4
from data_modals_4 import QUESTIONS_MODALS_4
from data_articles_4 import QUESTIONS_ARTICLES_4
from data_prepositions_4 import QUESTIONS_PREPOSITIONS_4
from data_inversion_4 import QUESTIONS_INVERSION_4
from data_conjunctions_4 import QUESTIONS_CONJUNCTIONS_4
from data_punctuation_4 import QUESTIONS_PUNCTUATION_4
from data_error_id_4 import QUESTIONS_ERROR_ID_4

def load_existing_1500():
    with open('src/data/banks/ielts/grammar.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find IELTS_GRAMMAR_MCQS array
    match = re.search(r'export const IELTS_GRAMMAR_MCQS:\s*RawIELTSMCQ\[\]\s*=\s*(\[[\s\S]*?\]);\s*$', content)
    if not match:
        raise ValueError("Could not extract IELTS_GRAMMAR_MCQS from grammar.ts")
    
    raw_json = match.group(1)
    questions = json.loads(raw_json)
    questions_1500 = questions[:1500]
    print(f"Successfully loaded {len(questions_1500)} existing questions from grammar.ts.")
    return questions_1500

def balance_options(q, target_key):
    """Permute options so that correctAnswer becomes target_key while keeping truth value."""
    current_key = q['correctAnswer']
    if current_key == target_key:
        return q

    key_to_idx = {'A': 0, 'B': 1, 'C': 2, 'D': 3}

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
    existing_1500 = load_existing_1500()
    assert len(existing_1500) == 1500, f"Expected 1500 existing questions, got {len(existing_1500)}"

    batches = [
        (QUESTIONS_SVA_4, "Subject-Verb Agreement", 45),
        (QUESTIONS_TENSES_4, "Tenses, Aspect & Time Clauses", 50),
        (QUESTIONS_CONDITIONALS_4, "Conditionals & Unreal Past", 45),
        (QUESTIONS_PASSIVE_4, "Passive Voice & Causatives", 45),
        (QUESTIONS_RELATIVE_4, "Relative Clauses & Participles", 45),
        (QUESTIONS_MODALS_4, "Modals & Past Deduction", 40),
        (QUESTIONS_ARTICLES_4, "Articles & Quantifiers", 45),
        (QUESTIONS_PREPOSITIONS_4, "Prepositions & Collocations", 45),
        (QUESTIONS_INVERSION_4, "Inversion, Fronting & Subjunctive", 40),
        (QUESTIONS_CONJUNCTIONS_4, "Conjunctions & Sentence Structure", 45),
        (QUESTIONS_PUNCTUATION_4, "Punctuation & Syntax Mechanics", 25),
        (QUESTIONS_ERROR_ID_4, "Error Identification & Correction", 30),
    ]

    new_500 = []
    current_id_num = 1501

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
    print(f"Successfully processed and balanced {len(new_500)} new questions (IDs ielts-gram-1501 to ielts-gram-2000).")

    all_2000 = existing_1500 + new_500
    assert len(all_2000) == 2000, f"Expected 2000 total questions, got {len(all_2000)}"

    # Verification Checks
    print("\n=======================================================")
    print("RUNNING COMPREHENSIVE VERIFICATION ON 2,000 QUESTIONS")
    print("=======================================================")
    
    # 1. ID Uniqueness
    ids = [q['id'] for q in all_2000]
    assert len(ids) == len(set(ids)), f"Duplicate IDs found! Unique: {len(set(ids))}, Total: {len(ids)}"
    print(f"✓ All 2,000 IDs are unique (ielts-gram-001 through ielts-gram-2000).")

    # 2. Options and Answer Validity
    ans_counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0}
    diff_counts = {}
    for i, q in enumerate(all_2000):
        assert len(q['options']) == 4, f"Question {q['id']} does not have 4 options!"
        assert q['correctAnswer'] in ['A', 'B', 'C', 'D'], f"Invalid answer key in {q['id']}"
        ans_counts[q['correctAnswer']] += 1
        d = q.get('difficulty', 'medium')
        diff_counts[d] = diff_counts.get(d, 0) + 1
        assert len(q['question'].strip()) > 10, f"Question {q['id']} text too short"
        assert len(q['explanation'].strip()) > 10, f"Question {q['id']} explanation too short"

    print(f"✓ Answer key distribution across 2,000 questions: {ans_counts}")
    for k, v in ans_counts.items():
        pct = (v / 2000) * 100
        print(f"  {k}: {v} ({pct:.1f}%)")

    print(f"✓ Difficulty distribution across 2,000 questions: {diff_counts}")

    # 3. Exact Duplicate Question Text Check
    q_texts = {}
    duplicates = []
    for q in all_2000:
        norm = re.sub(r'\s+', ' ', q['question'].strip().lower())
        if norm in q_texts:
            duplicates.append((q['id'], q_texts[norm], q['question']))
        q_texts[norm] = q['id']
    
    if duplicates:
        print(f"WARNING: Found {len(duplicates)} exact duplicates:")
        for id1, id2, text in duplicates:
            print(f"  {id1} vs {id2}: {text}")
    else:
        print(f"✓ Zero exact duplicate question stems found across all 2,000 questions ({len(q_texts)} distinct normalized stems).")

    # 4. Token-level Jaccard similarity between new 500 and all 2,000 questions
    def clean_sentence(q):
        full_text = q['question']
        if any(q['question'].strip().startswith(p) for p in [
            'Choose the sentence', 'Select the sentence', 'Choose the correctly', 'Select the correctly', 'Identify the grammatically'
        ]):
            full_text = q['question'] + " " + " ".join(q['options'])
        
        clean = re.sub(r'^(Choose the correct[^:]*:\s*|Fill in the blank:\s*|Select the[^:]*:\s*|Identify the[^:]*:\s*)', '', full_text, flags=re.IGNORECASE)
        words = re.findall(r'[a-z0-9]+', clean.lower())
        stop = {'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'is', 'was', 'were', 'are', 'be', 'been', 'being', 'that', 'which', 'who', 'whom', 'whose', 'this', 'these', 'those'}
        return set([w for w in words if w not in stop])

    tokens = [clean_sentence(q) for q in all_2000]

    # Cross-overlap check: new 500 against all previous 1500
    cross_overlaps = []
    for i in range(1500, 2000):
        q_new = all_2000[i]
        tok_new = tokens[i]
        for j in range(0, 1500):
            q_old = all_2000[j]
            tok_old = tokens[j]
            inter = tok_new.intersection(tok_old)
            union = tok_new.union(tok_old)
            if not union:
                continue
            sim = len(inter) / len(union)
            if sim > 0.55:
                cross_overlaps.append((sim, q_new['id'], q_old['id'], q_new['question'], q_old['question']))

    if cross_overlaps:
        print(f"WARNING: Found {len(cross_overlaps)} cross-batch pairs with >55% similarity:")
        for sim, id1, id2, t1, t2 in sorted(cross_overlaps, key=lambda x: -x[0])[:5]:
            print(f"  Similarity {sim:.2f} between {id1} and {id2}:\n    New: {t1}\n    Old: {t2}")
    else:
        print(f"✓ Zero cross-batch near-duplicates (>55% similarity) between new 500 and existing 1,500 questions.")

    # Internal overlap check within new 500
    internal_overlaps = []
    for i in range(1500, 2000):
        q1 = all_2000[i]
        tok1 = tokens[i]
        for j in range(1500, i):
            q2 = all_2000[j]
            tok2 = tokens[j]
            inter = tok1.intersection(tok2)
            union = tok1.union(tok2)
            if not union:
                continue
            sim = len(inter) / len(union)
            if sim > 0.55:
                internal_overlaps.append((sim, q1['id'], q2['id'], q1['question'], q2['question']))

    if internal_overlaps:
        print(f"WARNING: Found {len(internal_overlaps)} internal pairs with >55% similarity:")
        for sim, id1, id2, t1, t2 in sorted(internal_overlaps, key=lambda x: -x[0])[:5]:
            print(f"  Similarity {sim:.2f} between {id1} and {id2}:\n    Q1: {t1}\n    Q2: {t2}")
    else:
        print(f"✓ Zero internal near-duplicates (>55% similarity) within the new 500 questions.")

    # 5. Topic Breakdown
    topics = {}
    for q in all_2000:
        t = q.get('topic', 'Unknown')
        topics[t] = topics.get(t, 0) + 1

    print(f"\n✓ Topic breakdown across 2,000 questions:")
    for t, c in sorted(topics.items(), key=lambda x: -x[1]):
        print(f"  - {t}: {c} questions")

    # Write out the updated grammar.ts
    output_ts = f"""/**
 * IELTS 2,000-Question Authoritative Grammar MCQ Bank
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
// 2,000 GRAMMAR MCQS (SYLLABUS & IELTS ACCURATE)
// ==========================================
export const IELTS_GRAMMAR_MCQS: RawIELTSMCQ[] = {json.dumps(all_2000, indent=2)};
"""

    with open('src/data/banks/ielts/grammar.ts', 'w', encoding='utf-8') as f:
        f.write(output_ts)

    print(f"\n✓ Successfully wrote all 2,000 questions to src/data/banks/ielts/grammar.ts")

if __name__ == '__main__':
    main()
