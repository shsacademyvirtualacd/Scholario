import json

with open('src/data/banks/ielts/grammar.ts', 'r', encoding='utf-8') as f:
    content = f.read()

import re
match = re.search(r'export const IELTS_GRAMMAR_MCQS:\s*RawIELTSMCQ\[\]\s*=\s*(\[[\s\S]*?\]);\s*$', content)
questions = json.loads(match.group(1))

q1363 = [q for q in questions if q['id'] == 'ielts-gram-1363'][0]
q863 = [q for q in questions if q['id'] == 'ielts-gram-863'][0]

print("1363:", q1363)
print("863:", q863)
