import json
import re

with open('src/data/banks/ielts/grammar.ts', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'export const IELTS_GRAMMAR_MCQS:\s*RawIELTSMCQ\[\]\s*=\s*(\[[\s\S]*?\]);\s*$', content)
questions = json.loads(match.group(1))

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

tokens = [clean_sentence(q) for q in questions]

internal_overlaps = []
for i in range(1000, 1500):
    q1 = questions[i]
    tok1 = tokens[i]
    for j in range(1000, i):
        q2 = questions[j]
        tok2 = tokens[j]
        
        inter = tok1.intersection(tok2)
        union = tok1.union(tok2)
        if not union:
            continue
        sim = len(inter) / len(union)
        if sim > 0.50:
            internal_overlaps.append((sim, q1['id'], q2['id'], q1['question'], q2['question']))

print(f"Total internal overlapping pairs (>50%): {len(internal_overlaps)}")
for sim, id1, id2, t1, t2 in sorted(internal_overlaps, key=lambda x: -x[0]):
    print(f"\n[{sim:.2f}] {id1} vs {id2}:")
    print(f"  Q1: {t1}")
    print(f"  Q2: {t2}")
