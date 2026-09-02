import json
import re

with open('src/data/banks/ielts/grammar.ts', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const IELTS_GRAMMAR_MCQS:\s*RawIELTSMCQ\[\]\s*=\s*(\[[\s\S]*?\]);\s*$', content)
questions = json.loads(match.group(1))

def tokenize(text):
    words = re.findall(r'[a-z0-9]+', text.lower())
    stop = {'choose', 'the', 'correct', 'option', 'form', 'sentence', 'blank', 'in', 'of', 'fill', 'select', 'identify', 'underlined', 'portion', 'containing', 'a', 'an', 'error', 'grammatical', 'grammatically'}
    return set([w for w in words if w not in stop])

print(f"Total questions: {len(questions)}")

# Pre-compute tokens
tokens = []
for q in questions:
    t = tokenize(q['question'])
    if len(t) < 3:
        t = tokenize(q['question'] + " " + " ".join(q['options']))
    tokens.append(t)

high_sim = []
for i in range(1000, 1500):
    tok_new = tokens[i]
    q_new = questions[i]
    for j in range(0, i):
        tok_prev = tokens[j]
        q_prev = questions[j]
        
        intersection = tok_new.intersection(tok_prev)
        union = tok_new.union(tok_prev)
        if not union:
            continue
        sim = len(intersection) / len(union)
        if sim > 0.65:
            high_sim.append((sim, q_new['id'], q_prev['id'], q_new['question'], q_prev['question'], q_new['topic']))

print(f"Found {len(high_sim)} pairs with >65% similarity:")
for sim, id1, id2, t1, t2, topic in high_sim:
    print(f"\n[{topic}] Sim: {sim:.2f} | {id1} vs {id2}:")
    print(f"  New ({id1}): {t1}")
    print(f"  Old ({id2}): {t2}")
