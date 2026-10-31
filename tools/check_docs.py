import os, re, sys, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))).replace(os.sep, '/')
files = []
for dp, dn, fn in os.walk(ROOT):
    for f in fn:
        if f.endswith('.md') and not f.startswith('Brief'):
            files.append(os.path.join(dp, f))
files.sort()
rel = lambda p: os.path.relpath(p, ROOT).replace('\\', '/')
text = {rel(f): open(f, encoding='utf-8').read() for f in files}
failures = []

def fail(msg):
    failures.append(msg)
    print('  FAIL:', msg)

print('FILES (%d):' % len(files))
for f in text: print('  ', f)

# ---------------------------------------------------------------- CHECK 1
print('\n== CHECK 1: Vietnamese letters, class U+00C0-U+1EF9 plus U+0110 and U+0111 ==')
pat = re.compile('[\u00C0-\u1EF9\u0110\u0111]')
hits = 0
for f, t in text.items():
    for i, line in enumerate(t.split('\n'), 1):
        for m in pat.finditer(line):
            hits += 1
            print('  HIT', f, i, hex(ord(m.group())), line.strip()[:80].encode('ascii', 'replace').decode())
print('  total hits:', hits)
if hits: fail('Vietnamese letters found')
non = {}
for t in text.values():
    for ch in t:
        if ord(ch) > 127: non[ch] = non.get(ch, 0) + 1
print('  non-ASCII characters used:', {hex(ord(c)): n for c, n in non.items()})
bad_words = [w for f, t in text.items() for w in re.findall(r'[Pp]lanner', t)]
print('  occurrences of the word planner:', len(bad_words))
if bad_words: fail('word planner present')

# ---------------------------------------------------------------- CHECK 2
print('\n== CHECK 2: ID checks ==')
# D-33 removed foreign invoices and the cash flag: UC/US 11 and 22 stay as "Removed (D-33)" entries and are never reused.
REMOVED_N = (11, 22)
RM = 'Removed (D-33)'
UC_ALL = ['UC-%02d' % n for n in range(1, 29)]
US_ALL = ['US-%02d' % n for n in range(1, 29)]
UC = [u for u in UC_ALL if int(u[3:]) not in REMOVED_N]
US = [u for u in US_ALL if int(u[3:]) not in REMOVED_N]
UC_REMOVED = [u for u in UC_ALL if u not in UC]
US_REMOVED = [u for u in US_ALL if u not in US]
N_ACTIVE = len(US)
N_MUST, N_SHOULD = 20, 6
W_MAX = 21
D_MAX = 33
# Rules whose whole text is Advanced or removed after D-33 and that no active story may cite.
BR_NO_STORY = {'BR-18': 'Advanced', 'BR-21': RM, 'BR-32': RM}
BR = ['BR-%02d' % n for n in range(1, 38)]
uc_file = text['docs/02-usecases-userstories/01-use-cases.md']
spec = text['docs/02-usecases-userstories/02-use-case-specifications.md']
inv = text['docs/02-usecases-userstories/03-user-stories-invest.md']
ac = text['docs/02-usecases-userstories/04-acceptance-criteria.md']
mos = text['docs/02-usecases-userstories/05-moscow-prioritization.md']
trace = text['docs/traceability/master-traceability.md']
brf = text['docs/requirements/business-rules.md']

# 2a UC in diagram, matrix, spec
diagram = re.search(r'```mermaid\n(flowchart LR\n    subgraph left.*?)```', uc_file, re.S).group(1)
matrix = uc_file[uc_file.index('## Role'):uc_file.index('## Use case diagram')]
miss = {'diagram': [], 'matrix': [], 'spec': []}
for u in UC:
    n = u[3:]
    if not re.search(r'uc%s\["%s ' % (n, u), diagram): miss['diagram'].append(u)
    if not re.search(r'^\| %s ' % u, matrix, re.M): miss['matrix'].append(u)
    if len(re.findall(r'^## %s ' % u, spec, re.M)) != 1: miss['spec'].append(u)
for k, v in miss.items():
    print('  active UC in %s: %s' % (k, 'all %d present' % len(UC) if not v else 'MISSING ' + str(v)))
    if v: fail('UC missing in ' + k)
# removed use cases: one spec heading marked Removed (D-33), a marked matrix row, and no node or edge in any diagram
for u in UC_REMOVED:
    n = u[3:]
    sp = re.search(r'^## %s [^\n]*\n\n([^\n]*)' % u, spec, re.M)
    ok_spec = len(re.findall(r'^## %s ' % u, spec, re.M)) == 1 and sp and RM in sp.group(1)
    ok_matrix = re.search(r'^\| %s [^\n]*%s' % (u, re.escape(RM)), matrix, re.M)
    ok_diag = not re.search(r'\buc%s\b' % n, diagram)
    print('  removed %s: spec heading marked %s, matrix row marked, no node in the use case diagram: %s %s %s' % (u, RM, bool(ok_spec), bool(ok_matrix), ok_diag))
    if not (ok_spec and ok_matrix and ok_diag): fail('removed %s not handled' % u)

# 2b US in backlog, INVEST review, AC, MoSCoW, traceability
backlog = inv[inv.index('## Product backlog'):inv.index('## Per-story INVEST review')]
review = inv[inv.index('## Per-story INVEST review'):inv.index('## Cross-cutting')]
miss = {'backlog': [], 'INVEST review': [], 'AC heading': [], 'MoSCoW': [], 'traceability': []}
for s in US:
    if not re.search(r'^\| %s \|' % s, backlog, re.M): miss['backlog'].append(s)
    if not re.search(r'^\| %s \|' % s, review, re.M): miss['INVEST review'].append(s)
    if not re.search(r'^## %s — ' % s, ac, re.M): miss['AC heading'].append(s)
    if not re.search(r'\b%s\b' % s, mos): miss['MoSCoW'].append(s)
    if not re.search(r'^\| %s \|' % s, trace, re.M): miss['traceability'].append(s)
for k, v in miss.items():
    print('  active US in %s: %s' % (k, 'all %d present' % len(US) if not v else 'MISSING ' + str(v)))
    if v: fail('US missing in ' + k)
# removed stories: each must appear once, marked Removed (D-33), in the backlog, INVEST review, AC file, MoSCoW, and traceability
for s in US_REMOVED:
    where = {
        'backlog': re.search(r'^\| %s \| %s' % (s, re.escape(RM)), backlog, re.M),
        'INVEST review': re.search(r'^\| %s \|[^\n]*%s' % (s, re.escape(RM)), review, re.M),
        'AC heading': re.search(r'^## %s — %s' % (s, re.escape(RM)), ac, re.M),
        'MoSCoW': re.search(r'\b%s\b[^\n]*' % s, mos) and RM in mos,
        'traceability': re.search(r'^\| %s \|[^\n]*%s' % (s, re.escape(RM)), trace, re.M),
    }
    bad = [k for k, v in where.items() if not v]
    dup = [k for k, t_, pat in (('backlog', backlog, r'^\| %s \|' % s), ('INVEST review', review, r'^\| %s \|' % s), ('traceability', trace, r'^\| %s \|' % s)) if len(re.findall(pat, t_, re.M)) != 1]
    print('  removed %s marked %s in backlog, review, AC, MoSCoW, traceability: %s' % (s, RM, 'yes' if not bad and not dup else 'NO ' + str(bad + dup)))
    if bad or dup: fail('removed story %s not marked everywhere' % s)

# 2c AC per story, parse
stories = {}
removed_acs = set()
cur = None
for l in ac.split('\n'):
    m = re.match(r'^## (US-\d\d) — ', l)
    if m: cur = m.group(1); stories[cur] = {'hdr': None, 'acs': []}; continue
    mh = re.match(r'^(UC-\d\d) · (.+)$', l)
    if mh and cur and stories[cur]['hdr'] is None: stories[cur]['hdr'] = (mh.group(1), re.findall(r'BR-\d\d', mh.group(2))); continue
    for a in re.findall(r'\*\*(AC-\d\d\.\d+)\*\*', l):
        stories[cur]['acs'].append(a)
        if re.match(r'^- \*\*AC-\d\d\.\d+\*\* %s\.$' % re.escape(RM), l.strip()): removed_acs.add(a)
body_missing = []
_cur = None
for _l in ac.splitlines():
    _m = re.match(r'^## (US-\d\d) — ', _l)
    if _m: _cur = _m.group(1); _seen_hdr = False; continue
    if _cur and re.match(r'^UC-\d\d · ', _l): continue
    if _cur:
        for _b in re.findall(r'BR-\d\d', _l):
            if _b not in stories[_cur]['hdr'][1]: body_missing.append((_cur, _b))
print('  BR ids cited in AC bodies but missing from the story header:', sorted(set(body_missing)) or 'none')
if body_missing: fail('AC body cites a BR that its header lacks')
no_ac = [s for s in US if not stories.get(s, {}).get('acs')]
print('  active stories with at least one AC: %d of %d %s' % (len(US) - len(no_ac), len(US), no_ac or ''))
# removed stories carry no live criterion and no rule; their ACs read exactly "Removed (D-33)."
bad_rm = []
for s in US_REMOVED:
    st = stories.get(s)
    if not st or not st['acs'] or st['hdr'] is None or st['hdr'][1] or any(a not in removed_acs for a in st['acs']): bad_rm.append(s)
print('  removed stories with no live criterion and no rule in the header:', 'yes' if not bad_rm else 'NO ' + str(bad_rm))
if bad_rm: fail('removed story has a live criterion or rule')
# a live criterion inside an active story must not be marked removed unless the whole line is the marker
live_with_marker = [l.strip()[:60] for l in ac.split('\n') if l.startswith('- **AC-') and RM in l and not re.match(r'^- \*\*AC-\d\d\.\d+\*\* %s\.$' % re.escape(RM), l.strip())]
print('  criteria that mention the marker but are not exactly "Removed (D-33).":', live_with_marker or 'none')
if live_with_marker: fail('malformed removed criterion')
if no_ac: fail('stories without AC')
total_ac = sum(len(d['acs']) for d in stories.values())
print('  acceptance criteria in total: %d (%d live, %d marked %s)' % (total_ac, total_ac - len(removed_acs), len(removed_acs), RM))
all_ac = set(a for d in stories.values() for a in d['acs'])
from collections import Counter
cnt = Counter(a for d in stories.values() for a in d['acs'])
dup = [a for a, c in cnt.items() if c != 1]
print('  duplicate AC ids:', dup)
if dup: fail('duplicate AC ids')
uc_match = [s for s in US if stories[s]['hdr'][0] != 'UC-' + s[3:]]
print('  stories whose header names a different UC:', uc_match)
if uc_match: fail('UC mismatch')

# 2d BR defined and referenced
defined = {}
for m in re.finditer(r'^## (BR-\d\d) — (.+)$', brf, re.M): defined[m.group(1)] = m.group(2)
undefined = [b for b in BR if b not in defined]
print('  BR-01..BR-37 defined in business-rules.md: %s' % ('all 37 defined' if not undefined else 'MISSING ' + str(undefined)))
if undefined: fail('BR undefined')
parts = re.split(r'^## (BR-\d\d) — .+$', brf, flags=re.M)
blocks = {parts[i]: parts[i + 1] for i in range(1, len(parts), 2)}
bad_fields = []
for b, body in blocks.items():
    for fld in ['- **Source:**', '- **Related US:**', '- **Related API:** TBD (Step 6)', '- **Rule:**']:
        if fld not in body: bad_fields.append((b, fld))
print('  each BR has Source, Related US, Related API TBD (Step 6), Rule: %s' % ('yes' if not bad_fields else bad_fields))
if bad_fields: fail('BR fields missing')
hdr_brs = set(b for d in stories.values() for b in d['hdr'][1])
wsection = mos[mos.index('## Won'):]
w_brs = set(re.findall(r'BR-\d\d', wsection))
unref = [b for b in BR if b not in hdr_brs and b not in w_brs]
adv_only = [b for b in BR if b not in hdr_brs and b in w_brs]
print('  BRs referenced by no story and no W item:', unref)
print('  BRs referenced only by a W item (entirely Advanced):', adv_only)
if unref: fail('BR unreferenced')
undef_in_hdr = [b for b in hdr_brs if b not in defined]
print('  BR ids in story headers that are not defined:', undef_in_hdr)
if undef_in_hdr: fail('header BR undefined')
# BR Related US equals AC header map
mism = []
for b, body in blocks.items():
    line = [l for l in body.split('\n') if l.startswith('- **Related US:**')][0]
    listed = set(re.findall(r'US-\d\d', line))
    expect = set(s for s, d in stories.items() if b in d['hdr'][1])
    if listed != expect: mism.append((b, sorted(listed), sorted(expect)))
print('  BR "Related US" lines that differ from the story headers:', mism)
if mism: fail('BR Related US mismatch')
# D-33: BR-18 is Advanced; BR-21 and BR-32 are Removed (D-33) and carried by W-20 / W-21. No active story cites them.
wrow = {w: l for w in ['W-%02d' % n for n in range(1, W_MAX + 1)] for l in mos.split('\n') if l.startswith('| %s |' % w)}
bad_noshow = []
for b, marker in BR_NO_STORY.items():
    body = blocks[b]
    head = [l for l in brf.split('\n') if l.startswith('## %s — ' % b)][0]
    if b in hdr_brs: bad_noshow.append((b, 'cited in a story header'))
    if marker not in body and marker not in head: bad_noshow.append((b, 'not marked ' + marker))
    if b not in w_brs: bad_noshow.append((b, 'not carried by a W item'))
    if b not in trace[trace.index('## Advanced items'):]: bad_noshow.append((b, 'not in the Advanced items table of the traceability matrix'))
    if b in ('BR-21', 'BR-32') and not re.search(r'Removed \(D-33\), now Advanced W-\d\d', body): bad_noshow.append((b, 'no "Removed (D-33), now Advanced W-nn"'))
print('  BR-18 (Advanced), BR-21 and BR-32 (Removed, D-33): marked, carried by a W item, cited by no story:', 'yes' if not bad_noshow else bad_noshow)
if bad_noshow: fail('removed or Advanced rule handled wrongly')
for w in ('W-19', 'W-20', 'W-21'):
    if w not in wrow: fail(w + ' missing from the Won\'t table')
# removed IDs must not be used by any live reference: dependencies, headers, BR Related US, diagrams, module/goal/problem rows
removed_ids = UC_REMOVED + US_REMOVED
trace_tail = trace[trace.index('## Module traceability'):]
live_trace = sorted(set(re.findall(r'\b(?:%s)\b' % '|'.join(removed_ids), trace_tail)))
print('  removed UC/US ids in the module, goal, problem, advanced, or decision tables of the traceability matrix:', live_trace or 'none')
if live_trace: fail('traceability tables cite a removed UC or US')
diag_hits = []
for f, t_ in text.items():
    for m_ in re.finditer(r'```mermaid\n(.*?)```', t_, re.S):
        for rid in removed_ids + ['uc11', 'uc22']:
            if re.search(r'\b%s\b' % rid, m_.group(1)): diag_hits.append((f, rid))
print('  removed UC/US ids in any Mermaid diagram (nodes or edges):', diag_hits or 'none')
if diag_hits: fail('diagram cites a removed UC or US')
# traceability BR column equals header
rows = {}
for l in trace.split('\n'):
    m = re.match(r'^\| (US-\d\d) \| (UC-\d\d) \| ([^|]+) \| ([^|]+) \|', l)
    if m: rows[m.group(1)] = (m.group(2), m.group(3).strip(), m.group(4).strip())
trace_bad = []
for s in US:
    uc, rng, brs = rows[s]
    if uc != stories[s]['hdr'][0]: trace_bad.append((s, 'uc'))
    if set(re.findall(r'BR-\d\d', brs)) != set(stories[s]['hdr'][1]): trace_bad.append((s, 'br'))
    ends = re.findall(r'AC-\d\d\.\d+', rng)
    exp = [stories[s]['acs'][0], stories[s]['acs'][-1]] if len(stories[s]['acs']) > 1 else [stories[s]['acs'][0]]
    if ends != exp: trace_bad.append((s, 'acrange', ends, exp))
print('  traceability rows that differ from the AC headers (UC, BR set, AC range):', trace_bad)
if trace_bad: fail('traceability mismatch')
# every AC id referenced in the traceability matrix exists in AC file
trace_acs = set(re.findall(r'AC-\d\d\.\d+', trace))
missing_ac = sorted(a for a in trace_acs if a not in all_ac)
print('  AC ids in traceability: %d, not found in the AC file: %s' % (len(trace_acs), missing_ac))
if missing_ac: fail('traceability AC missing')
# every AC reference anywhere exists
bad_refs = []
for f, t in text.items():
    t2 = re.sub(r'https?://\S+', '', t)
    for m in re.finditer(r'AC-(\d\d)\.(\d+)(?:\.\.AC-(\d\d)\.(\d+))?', t2):
        a = 'AC-%s.%s' % (m.group(1), m.group(2))
        if a not in all_ac: bad_refs.append((f, a))
        if m.group(3):
            b = 'AC-%s.%s' % (m.group(3), m.group(4))
            if b not in all_ac: bad_refs.append((f, b))
print('  AC references anywhere in the docs that do not exist:', bad_refs)
if bad_refs: fail('AC reference missing')
# a criterion marked Removed (D-33) may be cited only on a line that also says it is removed (range ends in traceability are exempt)
live_cite = []
for f, t_ in text.items():
    if f.endswith('04-acceptance-criteria.md') or f.endswith('research-log.md'): continue
    for i, l in enumerate(t_.split('\n'), 1):
        if f.endswith('master-traceability.md') and re.match(r'^\| US-\d\d \|', l): continue
        if any(a in l for a in removed_acs) and RM not in l: live_cite.append((f, i))
print('  removed criteria cited without the marker on the same line:', live_cite or 'none')
if live_cite: fail('removed AC cited as live')
# P and G in traceability
miss_pg = [x for x in ['P-%02d' % n for n in range(1, 5)] + ['G-%02d' % n for n in range(1, 8)] if x not in trace]
print('  P-01..P-04 and G-01..G-07 present in traceability:', 'yes' if not miss_pg else miss_pg)
if miss_pg: fail('P/G missing')
goal_sec = trace[trace.index('## Goal traceability'):trace.index('## Problem traceability')]
gnotes = []
for g in ['G-03', 'G-04', 'G-06']:
    row = [l for l in goal_sec.split('\n') if l.startswith('| %s ' % g)][0]
    if not re.search(r'ES-0\d|TS-01', row): gnotes.append(g)
print('  G-03, G-04, G-06 trace to a named evaluation set or test suite:', 'yes' if not gnotes else 'NO for ' + str(gnotes))
if gnotes: fail('G measured nowhere')
sets = re.findall(r'^\| (ES-\d\d|TS-\d\d) \|', ac, re.M)
print('  evaluation sets and suites defined in the AC file:', sets)
# W items
w_missing = [w for w in ['W-%02d' % n for n in range(1, W_MAX + 1)] if not re.search(r'^\| %s \|' % w, mos, re.M)]
print('  W-01..W-%d listed in MoSCoW: %s' % (W_MAX, 'yes' if not w_missing else w_missing))
if w_missing: fail('W missing')
w_extra = sorted(set(re.findall(r'\bW-(\d\d)\b', ''.join(text.values()))) - set('%02d' % n for n in range(1, W_MAX + 1)))
print('  W ids used anywhere beyond W-%02d:' % W_MAX, w_extra or 'none')
if w_extra: fail('W id beyond the range')
fw = text['docs/01-research/09-future-work.md']
fw_missing = [w for w in ['W-%02d' % n for n in range(1, W_MAX + 1)] if not re.search(r'^\| %s \|' % w, fw, re.M)]
print('  W-01..W-%d listed in Future work: %s' % (W_MAX, 'yes' if not fw_missing else fw_missing))
if fw_missing: fail('W missing in Future work')
# MoSCoW counts match backlog
must = re.findall(r'^\| (US-\d\d) \|.*\| Must \| [SML] \|$', backlog, re.M)
should = re.findall(r'^\| (US-\d\d) \|.*\| Should \| [SML] \|$', backlog, re.M)
mos_must = re.findall(r'US-\d\d', re.search(r'\*\*Must\*\*.*?\| (\d+) \|', mos).group(0))
mos_should = re.findall(r'US-\d\d', re.search(r'\*\*Should\*\*.*?\| (\d+) \|', mos).group(0))
print('  backlog Must %d, Should %d; MoSCoW table Must %d, Should %d; sets equal: %s' % (len(must), len(should), len(mos_must), len(mos_should), set(must) == set(mos_must) and set(should) == set(mos_should)))
if not (set(must) == set(mos_must) and set(should) == set(mos_should) and len(must) == N_MUST and len(should) == N_SHOULD and len(must) + len(should) == N_ACTIVE): fail('MoSCoW mismatch')
# stories are one sentence
multi = []
for l in backlog.split('\n'):
    m = re.match(r'^\| (US-\d\d) \| (As [^|]+?) \|', l)
    if m:
        s = re.sub(r'\*\(System behaviour\)\*', '', m.group(2)).strip()
        shape_ok = (s.startswith('As ') and ', I want ' in s and ', so that ' in s and s.endswith('.')
                    and s.count('.') == 1 and s.index(', I want ') < s.index(', so that '))
        if not shape_ok:
            multi.append(m.group(1))
print('  backlog stories that are not a single "As ..., I want ..., so that ..." sentence:', multi)
if multi: fail('story sentence shape')
# lifecycle rules have states and transitions
for b in ['BR-33', 'BR-34', 'BR-35']:
    body = blocks[b]
    ok = 'stateDiagram-v2' in body and re.search(r'^\| (V|E|B)\d+ ', body, re.M)
    print('  %s has a state diagram and a transition table: %s' % (b, 'yes' if ok else 'NO'))
    if not ok: fail(b + ' lifecycle')
v_ids = re.findall(r'^\| V(\d+) \|', blocks['BR-33'], re.M)
e_ids = re.findall(r'^\| E(\d+) \|', blocks['BR-34'], re.M)
print('  invoice transitions V1..V%s, exception transitions E1..E%s' % (v_ids[-1], e_ids[-1]))
# D-33: no Awaiting Field Confirmation state in the BR-33 diagram, V2 and V3 kept and marked removed
d33_diag = re.search(r'```mermaid\n(.*?)```', blocks['BR-33'], re.S).group(1)
v_removed = [v for v in ('V2', 'V3') if not re.search(r'^\| %s \|[^\n]*%s' % (v, re.escape(RM)), blocks['BR-33'], re.M)]
awaiting = 'Awaiting' in d33_diag or 'Field Confirmation' in d33_diag
print('  BR-33 diagram has no "Awaiting Field Confirmation" state: %s; V2 and V3 marked %s: %s' % (not awaiting, RM, 'yes' if not v_removed else 'NO ' + str(v_removed)))
if awaiting or v_removed: fail('BR-33 still has the removed state or V2/V3 not marked')
if v_ids != ['%d' % n for n in range(1, int(v_ids[-1]) + 1)]: fail('V ids renumbered or missing')
# D-33: batch condition 6 of BR-05 has no tax-obligation part and cites no BR-21; still six conditions
conds = re.findall(r'^    (\d)\. (.+)$', blocks['BR-05'], re.M)
c6 = [c for n, c in conds if n == '6']
c6_ok = len(conds) == 6 and c6 == ['There is no anomaly (BR-10, BR-11, BR-24, BR-29, BR-30).']
print('  BR-05 has six conditions and condition 6 is "There is no anomaly (BR-10, BR-11, BR-24, BR-29, BR-30).":', c6_ok)
if not c6_ok: fail('BR-05 condition 6')
cond_cites = [(f, i) for f, t_ in text.items() if not f.endswith('research-log.md') for i, l in enumerate(t_.split('\n'), 1)
              if re.search(r'no open tax obligation|unresolved foreign|foreign contractor tax or import documents', l) or (re.match(r'^\| 6 \|', l) and 'BR-21' in l) or re.match(r'^    6\. .*BR-21', l)]
print('  live BR-05 condition lists that still cite BR-21 or an open tax obligation:', cond_cites or 'none')
if cond_cites: fail('a condition list still cites BR-21')
# D-33: eight AI tasks
ai = text['docs/01-research/07-ai-vs-rule-based.md']
ai_sec = ai[ai.index('## The eight AI tasks'):ai.index('**The AI does not:**')] if '## The eight AI tasks' in ai else ''
ai_rows = re.findall(r'^\| (\d) \|', ai_sec, re.M)
nine = [f for f, t_ in text.items() if not f.endswith('research-log.md') and re.search(r'\bnine (AI|points)|The nine AI', t_)]
print('  AI tasks table has rows %s; files that still say nine AI tasks or points: %s' % (ai_rows, nine or 'none'))
if ai_rows != [str(n) for n in range(1, 9)] or nine or 'foreign tax duties' in ai_sec.split('The task "flag')[0]: fail('AI task count')

# cross-file ID definitions
print('\n  -- other ID families --')
fam = {}
defs, refs = {}, {}
for f, t in text.items():
    t2 = re.sub(r'https?://\S+', '', t)
    for m in re.finditer(r'^\|\s*\*{0,2}((?:D|O|R|L|A|M|W|F|G|P|DF|ES|TS)-\d\d)\*{0,2}\s*\|', t2, re.M): defs.setdefault(m.group(1), set()).add(f)
    # a line that points to the Step 3 draft on another branch (dreamy-bohr) names that branch's own IDs, which are not defined here
    t2 = '\n'.join(l for l in t2.split('\n') if 'dreamy-bohr' not in l)
    for m in re.finditer(r'\b((?:D|O|R|L|A|M|W|F|G|P|DF|ES|TS)-\d\d)\b', t2): refs.setdefault(m.group(1), set()).add(f)
undef = sorted(k for k in refs if k not in defs)
print('  IDs defined as table rows: %d; IDs referenced: %d; referenced but not defined as a table row: %s' % (len(defs), len(refs), undef))
if undef: fail('IDs referenced but undefined')
for prefix, lo, hi in [('D', 1, D_MAX), ('O', 1, 16), ('DF', 1, 33)]:
    miss = ['%s-%02d' % (prefix, n) for n in range(lo, hi + 1) if '%s-%02d' % (prefix, n) not in defs]
    print('  %s-%02d..%s-%02d all defined: %s' % (prefix, lo, prefix, hi, 'yes' if not miss else miss))
    if miss: fail(prefix + ' gap')

# ---------------------------------------------------------------- CHECK 3
print('\n== CHECK 3: relative links (files and anchors) ==')
link = re.compile(r'\[[^\]]*\]\(([^)\s]+)\)')
def slug(h):
    h = h.strip().lower()
    h = re.sub(r'[^\w\- ]', '', h)
    return h.replace(' ', '-')
checked = 0; missing = []
for f, t in text.items():
    t2 = re.sub(r'```.*?```', '', t, flags=re.S)
    for m in link.finditer(t2):
        tg = m.group(1).strip('<>')
        if re.match(r'^(https?:|mailto:)', tg): continue
        path, _, anchor = tg.partition('#')
        path = urllib.parse.unquote(path)
        full = os.path.normpath(os.path.join(ROOT, os.path.dirname(f), path)) if path else os.path.join(ROOT, f)
        checked += 1
        if not os.path.exists(full): missing.append((f, tg, 'FILE'))
        elif anchor and full.endswith('.md'):
            heads = [slug(l.lstrip('#')) for l in open(full, encoding='utf-8') if l.startswith('#')]
            if anchor not in heads: missing.append((f, tg, 'ANCHOR'))
print('  relative links checked:', checked)
print('  broken links:', len(missing))
for m in missing: print('   ', m)
if missing: fail('broken links')
brief_links = [m.group(1) for t in text.values() for m in link.finditer(t) if 'Brief' in m.group(1)]
print('  links to the brief:', len(brief_links), 'all resolve' if not [x for x in missing if 'Brief' in x[1]] else 'BROKEN')

# ---------------------------------------------------------------- CHECK 4 (lint only)
print('\n== CHECK 4: Mermaid structural lint (nothing is parsed by mermaid; mermaid-cli was not run) ==')
nblocks = 0; lint_problems = []
for f, t in text.items():
    for m in re.finditer(r'```mermaid\n(.*?)```', t, re.S):
        nblocks += 1
        body = m.group(1)
        lines = [l for l in body.split('\n') if l.strip()]
        kind = lines[0].strip().split()[0]
        declared = set()
        for i, l in enumerate(lines[1:], 2):
            if l.count('"') % 2: lint_problems.append((f, kind, i, 'odd quotes'))
            if kind in ('flowchart',):
                s = re.sub(r'"[^"]*"', '""', l)
                for a, b in ('[]', '()', '{}'):
                    if s.count(a) != s.count(b): lint_problems.append((f, kind, i, 'unbalanced ' + a + b))
            if kind == 'mindmap':
                ind = len(l) - len(l.lstrip(' '))
                if ind % 2: lint_problems.append((f, kind, i, 'odd indent'))
            if kind == 'stateDiagram-v2':
                s = l.strip()
                if s.startswith('state '):
                    mm = re.match(r'^state "[^"]+" as (\w+)$', s)
                    if not mm: lint_problems.append((f, kind, i, 'bad state line: ' + s))
                    else: declared.add(mm.group(1))
                else:
                    mm = re.match(r'^(\[\*\]|\w+) --> (\[\*\]|\w+)(: .+)?$', s)
                    if not mm: lint_problems.append((f, kind, i, 'bad transition: ' + s))
                    else:
                        for n in (mm.group(1), mm.group(2)):
                            if n != '[*]' and n not in declared: lint_problems.append((f, kind, i, 'undeclared state ' + n))
        # node ids declared before use is not required for flowcharts
print('  blocks linted:', nblocks)
print('  lint problems:', lint_problems or 'none')
if lint_problems: fail('mermaid lint')
print('  NOTE: this is a structural lint. No diagram was parsed or rendered.')

print('\n== CHECK 5: review checks (dependencies, priorities, totals, pronouns, diagram) ==')
# parse backlog rows
rows_b = {}
for l in backlog.split('\n'):
    m = re.match(r'^\| (US-\d\d) \| As .*?\| ([^|]*) \| ([^|]*) \| (Must|Should) \| ([SML]) \|$', l)
    if m:
        deps = re.findall(r'US-\d\d', m.group(3))
        rows_b[m.group(1)] = (deps, m.group(4))
assert len(rows_b) == N_ACTIVE and sorted(rows_b) == US, (len(rows_b), sorted(set(US) ^ set(rows_b)))
# 5a cycles
color = {}
cycle = []
def dfs(u, path):
    color[u] = 1
    for v in rows_b[u][0]:
        if color.get(v, 0) == 1:
            cycle.append(path + [u, v]); return
        if color.get(v, 0) == 0:
            dfs(v, path + [u])
    color[u] = 2
for u in rows_b:
    if color.get(u, 0) == 0: dfs(u, [])
print('  story dependency graph: %d stories, %d dependency edges, cycles: %s' % (len(rows_b), sum(len(v[0]) for v in rows_b.values()), cycle or 'none'))
if cycle: fail('dependency cycle')
selfdep = [u for u, v in rows_b.items() if u in v[0]]
unknown = [(u, d) for u, v in rows_b.items() for d in v[0] if d not in rows_b]
print('  self-dependencies:', selfdep or 'none', '; dependencies on unknown stories:', unknown or 'none')
dep_removed = [(u, d) for u, v in rows_b.items() for d in v[0] if d in US_REMOVED]
print('  active stories that depend on a removed story (US-11, US-22):', dep_removed or 'none')
if dep_removed or unknown: fail('dependency on a removed or unknown story')
bl_removed = [l.split('|')[1].strip() for l in backlog.split('\n') if re.match(r'^\| (%s) \|' % '|'.join(US_REMOVED), l) and re.search(r'US-\d\d', l.split('|')[4] + l.split('|')[3])]
print('  removed backlog rows that still carry a dependency or a priority:', bl_removed or 'none')
if bl_removed: fail('removed backlog row has dependencies')
# 5b Must depending on Should
must_on_should = [(u, d) for u, (deps, p) in rows_b.items() if p == 'Must' for d in deps if rows_b[d][1] == 'Should']
print('  Must stories that depend on a Should story:', must_on_should or 'none')
undoc = []
for u, d in must_on_should:
    sec = mos[mos.index('## Must stories that depend on a Should story'):mos.index('## If time runs short')] if '## Must stories that depend on a Should story' in mos else ''
    if not any(u in l and d in l for l in sec.split('\n')): undoc.append((u, d))
print('  each such dependency documented with a fallback in the MoSCoW file:', 'yes' if not undoc else 'NO ' + str(undoc))
if undoc: fail('undocumented Must on Should dependency')
# 5c totals
n_must = sum(1 for v in rows_b.values() if v[1] == 'Must'); n_should = sum(1 for v in rows_b.values() if v[1] == 'Should')
print('  backlog totals: %d Must, %d Should' % (n_must, n_should))
bad_tot = []
for f, t in text.items():
    for m in re.finditer(r'\b(\d+) (Must|Should)\b', t):
        want = n_must if m.group(2) == 'Must' else n_should
        if int(m.group(1)) != want: bad_tot.append((f, m.group(0)))
    for m in re.finditer(r'\*\*(Must|Should)\*\*.*?\| (\d+) \|', t):
        want = n_must if m.group(1) == 'Must' else n_should
        if int(m.group(2)) != want: bad_tot.append((f, 'table ' + m.group(1) + ' ' + m.group(2)))
old_hits = [(f, w) for f, t in text.items() for w in ('21 Must', '7 Should') if w in t]
print('  mentions of Must or Should totals that disagree with the backlog:', bad_tot or 'none')
print('  mentions of the old totals "21 Must" or "7 Should":', old_hits or 'none')
if bad_tot or old_hits: fail('totals disagree')
# 5d checklist of system behaviours equals backlog marks
marked = sorted(re.findall(r'^\| (US-\d\d) \| As .*\*\(System behaviour\)\*', backlog, re.M))
listed = sorted(re.findall(r'US-\d\d', re.search(r'System behaviours \(([^)]*)\)', inv).group(1)))
print('  system-behaviour stories marked in the backlog %s; listed in the INVEST checklist %s; equal: %s' % (marked, listed, marked == listed))
if marked != listed: fail('system behaviour list')
# 5e pronouns
pron = []
for f, t in text.items():
    for i, line in enumerate(t.split('\n'), 1):
        for m in re.finditer(r'\b(he|she|his|him|her|hers|himself|herself)\b', line, re.I):
            pron.append((f, i, m.group(0)))
print('  gendered pronouns (he, she, his, him, her) in any document:', pron or 'none')
if pron: fail('pronouns')
# 5f INVEST partial count
partial = []
for l in review.split('\n'):
    m = re.match(r'^\| (US-\d\d) \| (PASS|PARTIAL) \| (PASS|PARTIAL) \| (PASS|PARTIAL) \| (PASS|PARTIAL) \| (PASS|PARTIAL) \| (PASS|PARTIAL) \|', l)
    if m and 'PARTIAL' in m.groups()[1:]: partial.append(m.group(1))
print('  stories with at least one PARTIAL in the INVEST review: %d %s' % (len(partial), partial))
# 5g diagram vs matrix and by-actor list
edges = set()
for l in diagram.split('\n'):
    m = re.match(r'^\s+(\w+) --> ((?:uc\d\d(?: & )?)+)\s*$', l)
    if m:
        for t_ in re.findall(r'uc\d\d', m.group(2)): edges.add((m.group(1), 'UC-' + t_[2:]))
colmap = {'AP Accountant': 'ap', 'Chief Accountant': 'ca', 'Payment Approver': 'pa', 'Entity Admin': 'entityAdmin', 'Group Admin': 'groupAdmin', 'Demo Operator': 'demo'}
mlines = [l for l in matrix.split('\n') if l.startswith('| UC-') or l.startswith('| Use case')]
cols = [c.strip() for c in mlines[0].strip('|').split('|')]
dgm_missing = []
for l in mlines[1:]:
    cells = [c.strip() for c in l.strip('|').split('|')]
    uc = cells[0][:5]
    if RM in cells[0]:
        if any(cells[1:]): dgm_missing.append((uc, 'removed row holds a role or actor'))
        continue
    for name, node in colmap.items():
        val = cells[cols.index(name)]
        if not val: continue
        if uc == 'UC-01': ok = ('user', uc) in edges
        elif node in ('entityAdmin', 'groupAdmin') and uc in ('UC-02', 'UC-27', 'UC-28'): ok = ('admin', uc) in edges
        else: ok = (node, uc) in edges
        if not ok: dgm_missing.append((uc, name))
    auto = cells[cols.index('Automatic')]
    if 'AI Agent' in auto and ('aiAgent', uc) not in edges: dgm_missing.append((uc, 'AI Agent'))
    if 'Rule Engine' in auto and ('rules', uc) not in edges: dgm_missing.append((uc, 'Rule Engine'))
print('  matrix entries with no edge in the full diagram:', dgm_missing or 'none')
if dgm_missing: fail('diagram edges missing')
dec2 = open(ROOT + '/docs/02-usecases-userstories/00-decisions.md', encoding='utf-8').read()
dec1 = open(ROOT + '/docs/01-research/00-decisions.md', encoding='utf-8').read()
def row(txt, rid):
    r = [l for l in txt.split('\n') if l.startswith('| %s |' % rid)]
    return r[0] if r else ''
d33 = row(dec2, 'D-33')
print('  D-33 defined as a row with "User decision":', 'User decision' in d33, '; DF range extends to DF-33:', 'DF-33' in defs)
if 'User decision' not in d33 or 'DF-33' not in defs: fail('D-33 or DF-33')
# D-33: the user's own decision must not be labelled as a review call, and the interpretation must be marked as awaiting review
if 'awaiting user review' not in dec2[dec2.index('### Calls made while applying D-33'):]: fail('D-33 interpretation not marked awaiting review')
# D-33: removed or changed items keep their entry and say so
mark_checks = [
    ('D-25', row(dec1, 'D-25'), RM),
    ('D-32', row(dec2, 'D-32'), RM),
    ('DF-04', row(dec2, 'DF-04'), RM),
    ('DF-26', row(dec2, 'DF-26'), RM),
    ('A-09', row(text['docs/01-research/05-scope.md'], 'A-09'), RM),
    ('O-07', row(dec1, 'O-07'), 'No longer applicable (D-33)'),
    ('O-12', row(dec1, 'O-12'), 'No longer applicable (D-33)'),
    ('O-08', row(dec1, 'O-08'), 'no longer applicable (D-33)'),
]
bad_mark = [i for i, r_, mk in mark_checks if mk not in r_]
print('  rows of D-25, D-32, DF-04, DF-26, A-09, O-07, O-08, O-12 carry the D-33 marker:', 'yes' if not bad_mark else 'NO ' + str(bad_mark))
if bad_mark: fail('removed row not marked')
# D-33: no live mention of a removed ID outside a line that says it is removed, moved to Advanced, or is part of D-33
removed_other = ['UC-11', 'UC-22', 'US-11', 'US-22', 'DF-04', 'DF-26', 'D-25', 'D-32', 'BR-21', 'BR-32']
ok_words = ('Removed', 'removed', 'D-33', 'W-19', 'W-20', 'W-21', 'Advanced', 'Unsupported')
live_mention = []
d33_sec = dec2[dec2.index('## Scope change decided by the user'):dec2.index('## How the Step 1 decisions appear in Step 2')]
exempt = set(d33_sec.split('\n')) | set(blocks['BR-21'].split('\n')) | set(blocks['BR-32'].split('\n'))
for f, t_ in text.items():
    if f.endswith('research-log.md'): continue
    for i, l in enumerate(t_.split('\n'), 1):
        if l.startswith('## ') or 'start at BR-32' in l or l in exempt: continue  # headings of removed entries, the number where new rules start, the D-33 section, and the bodies of BR-21 and BR-32
        if any(re.search(r'\b%s\b' % rid, l) for rid in removed_other) and not any(w in l for w in ok_words):
            live_mention.append((f, i, l.strip()[:70]))
print('  lines that cite a removed id without saying it is removed or Advanced:', len(live_mention))
for x in live_mention: print('    ', x)
if live_mention: fail('live mention of a removed id')
# D-33: stale counts
stale = []
for f, t_ in text.items():
    if f.endswith('research-log.md'): continue
    for i, l in enumerate(t_.split('\n'), 1):
        if re.search(r'\b28 (user stories|use cases|stories)\b|W-01\.\.W-18|\b17 of 28\b|\bDF-01\.\.DF-32\b', l) and 'D-33' not in l and 'brief' not in l.lower():
            stale.append((f, i, l.strip()[:70]))
print('  stale counts (28 stories or use cases, W-01..W-18, 17 of 28):', stale or 'none')
if stale: fail('stale counts')
d28 = [l for l in open(ROOT + '/docs/02-usecases-userstories/00-decisions.md', encoding='utf-8').read().split('\n') if l.startswith('| D-28 |')][0]
print('  D-28 source and resolves cells:', [c.strip() for c in d28.strip('|').split('|')[-2:]])
if 'User ruling' in ''.join(text.values()): fail('User ruling still present')

print('\nRESULT:', 'ALL CHECKS PASSED' if not failures else '%d FAILURE(S): %s' % (len(failures), failures))
