import json
import re

with open('src/data/banks/ielts/grammar.ts', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const IELTS_GRAMMAR_MCQS:\s*RawIELTSMCQ\[\]\s*=\s*(\[[\s\S]*?\]);\s*$', content)
questions = json.loads(match.group(1))

def clean_sentence(q):
    # If options contain full sentences (like Parallel structure / Punctuation), include options
    full_text = q['question']
    if any(q['question'].strip().startswith(p) for p in [
        'Choose the sentence', 'Select the sentence', 'Choose the correctly', 'Select the correctly', 'Identify the grammatically'
    ]):
        full_text = q['question'] + " " + " ".join(q['options'])
    
    # Strip common prompt wrappers
    clean = re.sub(r'^(Choose the correct[^:]*:\s*|Fill in the blank:\s*|Select the[^:]*:\s*|Identify the[^:]*:\s*)', '', full_text, flags=re.IGNORECASE)
    # Remove punctuation & lowercase
    words = re.findall(r'[a-z0-9]+', clean.lower())
    # Stop words
    stop = {'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'of', 'for', 'with', 'by', 'is', 'was', 'were', 'are', 'be', 'been', 'being', 'that', 'which', 'who', 'whom', 'whose', 'this', 'these', 'those'}
    return set([w for w in words if w not in stop])

tokens = [clean_sentence(q) for q in questions]

overlaps = []
for i in range(1000, 1500):
    q_new = questions[i]
    tok_new = tokens[i]
    for j in range(0, 1000):
        q_old = questions[j]
        tok_old = tokens[j]
        
        inter = tok_new.intersection(tok_old)
        union = tok_new.union(tok_old)
        if not union:
            continue
        sim = len(inter) / len(union)
        if sim > 0.55:
            overlaps.append((sim, q_new['id'], q_old['id'], q_new['question'], q_old['question']))

print(f"Total overlapping pairs (>55% content token overlap): {len(overlaps)}")
for sim, id1, id2, t1, t2 in sorted(overlaps, key=lambda x: -x[0]):
    print(f"\n[{sim:.2f}] {id1} vs {id2}:")
    print(f"  New: {t1}")
    print(f"  Old: {t2}")
