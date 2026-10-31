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
D_MAX = 46  # D-33 is the scope decision; Step 3 calls are D-34..D-41; Step 4 calls are D-42..D-46
DF_MAX = 52  # DF-34..DF-44 are the Step 3 defaults; DF-45..DF-52 are the Step 4 defaults
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
    t2 = re.sub(r'\bSCR-\d\d\b', 'SCR', t2)  # screen IDs have their own family and check (CHECK 6)
    for m in re.finditer(r'^\|\s*\*{0,2}((?:D|O|R|L|A|M|W|F|G|P|DF|ES|TS)-\d\d)\*{0,2}\s*\|', t2, re.M): defs.setdefault(m.group(1), set()).add(f)
    for m in re.finditer(r'\b((?:D|O|R|L|A|M|W|F|G|P|DF|ES|TS)-\d\d)\b', t2): refs.setdefault(m.group(1), set()).add(f)
undef = sorted(k for k in refs if k not in defs)
print('  IDs defined as table rows: %d; IDs referenced: %d; referenced but not defined as a table row: %s' % (len(defs), len(refs), undef))
if undef: fail('IDs referenced but undefined')
for prefix, lo, hi in [('D', 1, D_MAX), ('O', 1, 16), ('DF', 1, DF_MAX)]:
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
        path = urllib.parse.unquote(path.split('?')[0])  # a query such as ?state=x belongs to a wireframe URL, not to the file name
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
print('\n== CHECK 4: Mermaid structural lint (no mermaid parser runs here) ==')
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
print('  NOTE: this is a structural lint. Parsing with mermaid itself needs a browser and is done outside this script (see the session handoff).')

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

print('\n== CHECK 6: Step 3 screens (SCR family) ==')
IA = 'docs/03-information-architecture/'
IA_FILES = ['README.md', '00-decisions.md', '01-sitemap.md', '02-routes-and-permissions.md', '03-navigation.md',
            '04-screen-inventory.md', '05-user-flows.md', '06-ui-states-and-accessibility.md']
missing_ia = [f for f in IA_FILES if IA + f not in text]
print('  Step 3 files present (8 expected):', 'yes' if not missing_ia else 'MISSING ' + str(missing_ia))
if missing_ia: fail('Step 3 files missing')
else:
    inv3 = text[IA + '04-screen-inventory.md']
    routes3 = text[IA + '02-routes-and-permissions.md']
    sitemap3 = text[IA + '01-sitemap.md']
    def section(t, start, end=None):
        i = t.index(start)
        j = t.index(end, i + 1) if end and end in t[i + 1:] else len(t)
        return t[i:j]
    # (a) inventory rows
    inv_sec = section(inv3, '## Screen inventory', '\n## Requirement-to-screen mapping')
    scr = {}
    scr_removed = {}
    dup_scr = []
    for l in inv_sec.split('\n'):
        m = re.match(r'^\| `?(SCR-\d\d)`? \|(.+)\|\s*$', l)
        if not m: continue
        cells = [c.strip() for c in ('| ' + m.group(1) + ' |' + m.group(2)).strip().strip('|').split('|')]
        cells[0] = m.group(1)
        if len(cells) != 7: fail('inventory row %s has %d cells, expected 7' % (m.group(1), len(cells))); continue
        if m.group(1) in scr or m.group(1) in scr_removed: dup_scr.append(m.group(1))
        pres = cells[2]
        if cells[1] == RM:
            # removed screen: the row stays, every other cell is "Removed (D-33)" or a dash, and the number is never reused
            if pres != RM or cells[3] != '—' or cells[4] != '—' or cells[6] != '—': fail('removed screen row %s is not in the form "Removed (D-33) | Removed (D-33) | — | — | note | —"' % m.group(1))
            scr_removed[m.group(1)] = cells
            continue
        scr[m.group(1)] = {'name': cells[1], 'pres': pres, 'roles': cells[3],
                           'from': [x.strip() for x in cells[4].split(',')],
                           'rel': sorted(set(re.findall(r'US-\d\d', cells[6]))),
                           'page': pres.startswith('Page') or pres.startswith('System page'),
                           'modal': pres.startswith('Modal')}
    print('  active screens in the inventory: %d (%d pages, %d modals); removed rows: %s; duplicate rows: %s' % (
        len(scr), sum(1 for v in scr.values() if v['page']), sum(1 for v in scr.values() if v['modal']), sorted(scr_removed), dup_scr or 'none'))
    if dup_scr: fail('duplicate SCR rows')
    if len(scr) != 35 or sorted(scr_removed) != ['SCR-13', 'SCR-17']: fail('expected 35 active screens and the removed rows SCR-13 and SCR-17')
    undefined_scr = sorted({(f, x) for f, t in text.items() for x in re.findall(r'\bSCR-\d\d\b', t) if x not in scr and x not in scr_removed})
    # a removed screen may be named only on a line that says it is removed (D-33), never live
    live_removed = sorted({(f, x) for f, t in text.items() for l in t.split('\n') for x in re.findall(r'\bSCR-\d\d\b', l)
                           if x in scr_removed and not re.search(r'Removed|removed|D-33', l)})
    print('  removed screens SCR-13 and SCR-17 named on a live line (no removal marker):', live_removed or 'none')
    if live_removed: fail('removed screen used live')
    print('  SCR ids referenced anywhere but not defined in the inventory:', undefined_scr or 'none')
    if undefined_scr: fail('SCR referenced but undefined')
    bad_pres = [k for k, v in scr.items() if not (v['page'] or v['modal'])]
    if bad_pres: fail('presentation is neither Page, System page, nor Modal: %s' % bad_pres)
    # (b) requirement-to-screen mapping
    map_sec = section(inv3, '## Requirement-to-screen mapping', '\n## Reachability')
    mapping = {}
    map_removed = []
    dup_map = []
    for l in map_sec.split('\n'):
        m = re.match(r'^\| (US-\d\d(?:[^|]*?))\|(.+)\|\s*$', l)
        if not m: continue
        key = m.group(1).strip()
        if not re.fullmatch(r'US-\d\d', key):
            fail('mapping row must hold exactly one story: %r' % key); continue
        if key in mapping or key in map_removed: dup_map.append(key)
        if key in US_REMOVED:
            if m.group(2).strip() != RM: fail('mapping row of removed %s must read exactly "%s"' % (key, RM))
            map_removed.append(key); continue
        mapping[key] = sorted(set(re.findall(r'SCR-\d\d', m.group(2))))
    miss_map = [u for u in US if u not in mapping]
    empty_map = [u for u, v in mapping.items() if not v]
    unknown_map = sorted({x for v in mapping.values() for x in v if x not in scr})
    print('  active stories with exactly one mapping row: %d of %d (removed rows %s); duplicates %s; missing %s; rows with no screen %s; unknown screens %s' % (
        len(mapping), N_ACTIVE, map_removed, dup_map or 'none', miss_map or 'none', empty_map or 'none', unknown_map or 'none'))
    if dup_map or miss_map or empty_map or unknown_map or len(mapping) != N_ACTIVE or sorted(map_removed) != US_REMOVED: fail('requirement-to-screen mapping')
    rev = {}
    for u, v in mapping.items():
        for x in v: rev.setdefault(x, set()).add(u)
    rel_bad = [(k, sorted(rev.get(k, set())), v['rel']) for k, v in scr.items() if sorted(rev.get(k, set())) != v['rel']]
    print('  inventory "Related stories" that differ from the mapping:', rel_bad or 'none')
    if rel_bad: fail('inventory related stories differ from mapping')
    sysrows = [u for u in ['US-07', 'US-12', 'US-13', 'US-14', 'US-15', 'US-16', 'US-20', 'US-26']
               if not re.search(r'^\| %s \| No screen of its own' % u, map_sec, re.M)]
    print('  system-behaviour stories whose mapping row says "No screen of its own":', 'all 8' if not sysrows else 'MISSING ' + str(sysrows))
    if sysrows: fail('system-behaviour mapping text')
    # (c) traceability Screen column
    tr_screen = {}
    for l in trace.split('\n'):
        m = re.match(r'^\| (US-\d\d) \| UC-\d\d \| [^|]+ \| [^|]+ \| ([^|]+) \|', l)
        if m: tr_screen[m.group(1)] = sorted(set(re.findall(r'SCR-\d\d', m.group(2)))), m.group(2).strip()
    tbd3 = [u for u, (_, raw) in tr_screen.items() if 'TBD' in raw]
    tr_bad = [u for u in US if u in tr_screen and tr_screen[u][0] != mapping.get(u)]
    tr_bad += [u for u in US_REMOVED if tr_screen.get(u, (None, ''))[1] != RM]
    print('  traceability rows with a TBD Screen cell: %s; rows whose SCR set differs from the mapping: %s' % (tbd3 or 'none', tr_bad or 'none'))
    if tbd3 or tr_bad or len(tr_screen) != len(US_ALL) or 'TBD (Step 3)' in trace: fail('traceability Screen column')
    # (d) opened-from
    d_bad = []
    for k, v in scr.items():
        for p_ in v['from']:
            if p_ == 'Navigation': continue
            if p_ not in scr: d_bad.append((k, p_, 'unknown')); continue
            if not scr[p_]['page']: d_bad.append((k, p_, 'parent is a modal'))
        if v['modal']:
            par = re.findall(r'SCR-\d\d', v['pres'])
            if 'Navigation' in v['from'] or not par or any(x not in v['from'] for x in par):
                d_bad.append((k, v['from'], 'modal must name its page parent(s) from the Presentation cell'))
        if v['page'] and not v['modal'] and not v['from']: d_bad.append((k, 'empty'))
    print('  "Opened from" problems:', d_bad or 'none')
    if d_bad: fail('opened-from')
    # (e) routes, permissions, sitemap cards
    route_rows = re.findall(r'^\| `(/[^`]*)` \| (SCR-\d\d)', routes3, re.M)
    route_of = {}
    for r_, sid in route_rows: route_of.setdefault(sid, []).append(r_)
    perm_sec = section(routes3, '## Page permissions', '\n## Behaviour when access is missing')
    perm = {}
    roles6 = ['AP Accountant', 'Chief Accountant', 'Payment Approver', 'Entity Admin', 'Group Admin', 'Demo Operator']
    for l in perm_sec.split('\n'):
        m = re.match(r'^\| (SCR-\d\d) [^|]*\|(.+)\|\s*$', l)
        if m:
            cells = [c.strip() for c in m.group(2).split('|')]
            if len(cells) != 6: fail('permission row %s has %d role cells' % (m.group(1), len(cells))); continue
            perm[m.group(1)] = dict(zip(roles6, cells))
    pages = [k for k, v in scr.items() if v['page']]
    no_route = [k for k in pages if len(route_of.get(k, [])) != 1]
    modal_route = [k for k, v in scr.items() if v['modal'] and k in route_of]
    no_perm = [k for k in pages if k not in perm]
    extra_perm = [k for k in perm if k not in pages]
    hdr_ok = all(('| ' + r_ + ' ') in perm_sec for r_ in roles6)
    print('  pages without exactly one route: %s; modals with a route: %s; pages without a permission row: %s; permission rows for non-pages: %s; six role columns: %s' % (
        no_route or 'none', modal_route or 'none', no_perm or 'none', extra_perm or 'none', hdr_ok))
    if no_route or modal_route or no_perm or extra_perm or not hdr_ok: fail('routes or permission table')
    sm = re.search(r'```mermaid\n(flowchart TB.*?)```', sitemap3, re.S).group(1)
    node_scr = {}
    for m in re.finditer(r'^\s+(\w+)\["<b>(SCR-\d\d) ', sm, re.M): node_scr[m.group(1)] = m.group(2)
    cards = set(node_scr.values())
    need_cards = {k for k in pages if k not in ('SCR-01', 'SCR-90')}
    card_bad = sorted(need_cards - cards) + [x + ' (not a page)' for x in sorted(cards) if x not in pages] + [x + ' (SCR-90 is not a card)' for x in cards if x == 'SCR-90']
    dupcards = [x for x in cards if list(node_scr.values()).count(x) != 1]
    print('  sitemap cards: %d; page screens missing as cards or cards that are not pages: %s; duplicate cards: %s' % (len(cards), card_bad or 'none', dupcards or 'none'))
    if card_bad or dupcards: fail('sitemap cards')
    # (f) dashed edges agree with the permission table
    area_of_node = {}
    area = None
    for l in sm.split('\n'):
        m = re.match(r'^\s+subgraph (\w+)\[', l)
        if m: area = m.group(1); continue
        if re.match(r'^\s+end\s*$', l): area = None; continue
        if area:
            m = re.match(r'^\s+(\w+)\["', l)
            if m: area_of_node[m.group(1)] = area
    role_node = {'ap': 'AP Accountant', 'ca': 'Chief Accountant', 'pa': 'Payment Approver', 'entityAdmin': 'Entity Admin', 'groupAdmin': 'Group Admin', 'demo': 'Demo Operator'}
    areas = {a for a in area_of_node.values()}
    dashed = {(role_node[a], b) for a, b in re.findall(r'^\s+(\w+) -\.-> (\w+)\s*$', sm, re.M) if a in role_node}
    expected = set()
    for sid in cards:
        node = [n for n, x in node_scr.items() if x == sid][0]
        if node not in area_of_node: fail('card %s is in no area' % sid); continue
        for r_ in roles6:
            if sid in perm and perm[sid][r_] != '—': expected.add((r_, area_of_node[node]))
    f_bad = sorted(dashed ^ expected)
    unknown_area = sorted({b for _, b in dashed if b not in areas})
    print('  dashed actor -> area arrows: %d; expected from the permission table: %d; differences: %s; arrows to unknown areas: %s' % (len(dashed), len(expected), f_bad or 'none', unknown_area or 'none'))
    if f_bad or unknown_area: fail('sitemap arrows differ from the permission table')
    # solid arrows between cards match "Opened from"
    solid = {(node_scr[a], node_scr[b]) for a, b in re.findall(r'^\s+(\w+) --> (\w+)\s*$', sm, re.M) if a in node_scr and b in node_scr}
    solid_exp = {(p_, k) for k in cards for p_ in scr[k]['from'] if p_ in cards}
    print('  solid parent -> child arrows differ from "Opened from":', sorted(solid ^ solid_exp) or 'none')
    if solid ^ solid_exp: fail('sitemap solid arrows')
    # screens-per-role table equals the permission table
    spr = section(sitemap3, '## Screens per role', '\n**Related:**')
    spr_bad = []
    for l in spr.split('\n'):
        m = re.match(r'^\| (AP Accountant|Chief Accountant|Payment Approver|Entity Admin|Group Admin|Demo Operator) \| ([^|]*)\| ([^|]*)\| ([^|]*)\|', l)
        if m:
            got = set(re.findall(r'SCR-\d\d', m.group(3)))
            want = {sid for sid in perm if sid != 'SCR-90' and perm[sid][m.group(1)] != '—'}
            if got != want: spr_bad.append((m.group(1), sorted(got ^ want)))
            home = re.findall(r'SCR-\d\d', m.group(2))
            if len(home) != 1 or home[0] not in want: spr_bad.append((m.group(1), 'home page', home))
    print('  "Screens per role" rows that differ from the permission table or have a bad home page:', spr_bad or 'none')
    if spr_bad: fail('screens per role')
    # (g) Must reachability
    prio = {u: rows_b[u][1] for u in rows_b}
    has_must = {k: any(prio[u] == 'Must' for u in v['rel']) for k, v in scr.items()}
    memo = {}
    def reach(k, stack=()):
        if k in memo: return memo[k]
        if k in stack: return False
        ok = False
        if has_must[k]:
            for p_ in scr[k]['from']:
                if p_ == 'Navigation' or (p_ in scr and reach(p_, stack + (k,))):
                    ok = True; break
        memo[k] = ok
        return ok
    g_bad = [u for u in US if prio[u] == 'Must' and not any(reach(k) for k in mapping[u])]
    g_screens = sorted(k for k in scr if not reach(k))
    print('  Must stories with no screen reachable through Must-used screens only: %s' % (g_bad or 'none'))
    print('  screens used only by Should stories or reached only through them (informational):', g_screens or 'none')
    if g_bad: fail('Must story reachable only through Should screens')
    cut_sec = section(inv3, '## Reachability of Must stories', '\n## Screen-to-API mapping')
    cut_doc = {}
    for l in cut_sec.split('\n'):
        m = re.match(r'^\| (US-\d\d) \| ([^|]+) \|', l)
        if m: cut_doc[m.group(1)] = sorted(set(re.findall(r'SCR-\d\d', m.group(2))))
    cut_calc = {u: sorted(k for k, v in scr.items() if v['rel'] == [u]) for u in prio if prio[u] == 'Should'}
    cut_bad = [(u, cut_doc.get(u), cut_calc[u]) for u in cut_calc if cut_doc.get(u) != cut_calc[u]]
    print('  screens that disappear when one Should story is cut: documented = computed:', 'yes' if not cut_bad else cut_bad)
    if cut_bad: fail('cut table differs from the computed set')
    cut_removed = [u for u in US_REMOVED if u in cut_doc]
    print('  removed stories listed in the "if a Should story is cut" table:', cut_removed or 'none')
    if cut_removed: fail('cut table lists a removed story')
    # (h) headers
    h_bad = []
    for f_ in IA_FILES:
        t_ = text[IA + f_]
        if '> Design status: MVP — Step 3 of 9, approved\n>\n> Implementation status: NOT STARTED' not in t_: h_bad.append((f_, 'header'))
        if not re.search(r'^\*\*Related:\*\*', t_, re.M): h_bad.append((f_, 'Related line'))
    print('  Step 3 files with the "approved" header and a Related line: %s' % ('all 8' if not h_bad else h_bad))
    if h_bad: fail('Step 3 headers')
    # (i) Step 3 decisions: D-34..D-41 and DF-34..DF-44, approved by the user, except rows changed for D-33
    dec3 = text[IA + '00-decisions.md']
    step3_ids = ['D-%d' % n for n in range(34, 42)] + ['DF-%d' % n for n in range(34, 45)]
    st_bad = []
    for i_ in step3_ids:
        r_ = row(dec3, i_)
        if not r_: st_bad.append((i_, 'missing')); continue
        st = r_.strip().strip('|').split('|')[-1].strip()
        if not (st == 'Approved with Step 3 (user, 2026-10-31)' or st.startswith('Awaiting user review')): st_bad.append((i_, st))
    d33_in_ia = row(dec3, 'D-33')
    print('  Step 3 decisions D-34..D-41 and defaults DF-34..DF-44 present with a valid status; D-33 not redefined in Step 3: %s' % (
        'yes' if not st_bad and not d33_in_ia else (st_bad, d33_in_ia)))
    if st_bad or d33_in_ia: fail('Step 3 decision rows')
    # (j) nothing live in Step 3 depends on a removed item
    rm_ids = r'\b(BR-21|BR-32|DF-04|DF-26|D-25|D-32|UC-11|UC-22|US-11|US-22|AC-11\.\d+|AC-22\.\d+)\b'
    words = r'\b(foreign|PDF|contractor|customs|imports?|imported|cash|multimodal|payment method)\b'
    marks = re.compile(r'Removed|removed|D-33|Unsupported|Advanced|Only XML|non-cash|moved')
    live = []
    for f_ in IA_FILES:
        for n_, l in enumerate(text[IA + f_].split('\n'), 1):
            if (re.search(rm_ids, l) or re.search(words, l, re.I)) and not marks.search(l): live.append((f_, n_, l[:90]))
    print('  Step 3 lines naming a removed ID or a foreign, PDF, customs, import, cash, or payment-method topic without a removal marker:', live or 'none')
    if live: fail('Step 3 text depends on a removed item')
    ia_old = [(f_, n_) for f_ in IA_FILES for n_, l in enumerate(text[IA + f_].split('\n'), 1) if re.search(r'confirm-fields|Awaiting Field Confirmation|Upload foreign PDF', l) and not marks.search(l)]
    print('  Step 3 lines with the removed route, state, or button and no removal marker:', ia_old or 'none')
    if ia_old: fail('Step 3 removed route or state live')

print('\n== CHECK 7: Step 4 wireframes (HTML, CSS, JS, PNG) ==')
UX = 'docs/04-uiux/'
WF = ROOT + '/' + UX + 'wireframes/'
web = {}
for dp, dn, fn in os.walk(ROOT + '/docs'):
    for f_ in fn:
        if f_.endswith(('.html', '.css', '.js')):
            fp = os.path.join(dp, f_)
            web[rel(fp)] = open(fp, encoding='utf-8').read()
print('  web files under docs/ (html, css, js): %d' % len(web))
# (a) Vietnamese letters and gendered pronouns in web files
hits7 = [(f_, i_) for f_, t_ in web.items() for i_, l_ in enumerate(t_.split('\n'), 1) if pat.search(l_)]
pron7 = [(f_, i_, m_.group(0)) for f_, t_ in web.items() for i_, l_ in enumerate(t_.split('\n'), 1)
         for m_ in re.finditer(r'\b(he|she|his|him|her|hers|himself|herself)\b', l_, re.I)]
print('  Vietnamese letters in web files: %s; gendered pronouns in web files: %s' % (hits7 or 'none', pron7 or 'none'))
if hits7: fail('Vietnamese letters in web files')
if pron7: fail('gendered pronouns in web files')
pages = {f_: t_ for f_, t_ in web.items() if f_.startswith(UX + 'wireframes/') and f_.endswith('.html') and '/assets/' not in f_ and not f_.endswith('index.html')}
page_scr = {}
modal_scr = {}
for f_, t_ in pages.items():
    m_ = re.search(r'<title>(SCR-\d\d) ', t_)
    if not m_: fail('page %s has no "SCR-nn" title' % f_); continue
    page_scr[m_.group(1)] = f_
    st_ = re.search(r'<ul class="wf-states".*?</ul>', t_, re.S)
    for sid in re.findall(r'>(SCR-\d\d) [^<]*</a>', st_.group(0) if st_ else ''):
        modal_scr.setdefault(sid, set()).add(f_)
# (b) every active screen has a wireframe, removed screens have none
no_wf = []
for sid, v in scr.items():
    if v['page']:
        if sid not in page_scr: no_wf.append(sid)
    else:
        parents = [x.strip() for x in v['from']]
        if sid not in modal_scr or not any(page_scr.get(pp) in modal_scr[sid] for pp in parents): no_wf.append(sid)
removed_wf = [sid for sid in scr_removed if sid in page_scr or sid in modal_scr or any(sid in t_ for t_ in pages.values())]
print('  active screens: %d, with a wireframe (page file or modal state in the parent page): %d; missing: %s' % (len(scr), len(scr) - len(no_wf), no_wf or 'none'))
print('  removed screens (SCR-13, SCR-17) with a wireframe: %s' % (removed_wf or 'none'))
if no_wf: fail('screens without a wireframe: %s' % no_wf)
if removed_wf: fail('removed screens have a wireframe')
# (c) screen notes sections, links to HTML and PNG
notes = text[UX + '02-screen-notes.md'] if UX + '02-screen-notes.md' in text else ''
no_sec = [f_ for sid, f_ in page_scr.items() if not re.search(r'^### ' + sid + r'\b', notes, re.M)]
print('  page files without a "### SCR-nn" section in 02-screen-notes.md: %s' % (no_sec or 'none'))
if no_sec: fail('page without a screen-notes section')
no_modal_sec = [sid for sid in modal_scr if not re.search(r'^#{3,4} .*\b' + sid + r'\b', notes, re.M)]
print('  modal screens without a heading in 02-screen-notes.md: %s' % (no_modal_sec or 'none'))
if no_modal_sec: fail('modal without a screen-notes heading')
broken = []
n_links = 0
for f_, t_ in text.items():
    base = os.path.dirname(ROOT + '/' + f_)
    for m_ in re.finditer(r'!?\[[^\]]*\]\(([^)\s]+)\)', t_):
        tgt = m_.group(1)
        if re.match(r'^(https?:|mailto:|#)', tgt): continue
        tgt = re.split(r'[?#]', tgt)[0]
        if not tgt.endswith(('.png', '.html')): continue
        n_links += 1
        if not os.path.exists(os.path.normpath(os.path.join(base, tgt))): broken.append((f_, tgt))
print('  PNG and HTML links in Markdown checked: %d; broken: %s' % (n_links, broken or 'none'))
if broken: fail('broken PNG or HTML link')
imgs = sorted(rel(os.path.join(dp, f_)) for dp, dn, fn in os.walk(ROOT + '/docs/images') for f_ in fn if f_.endswith('.png')) if os.path.isdir(ROOT + '/docs/images') else []
role_dirs = {'common', 'ap-accountant', 'chief-accountant', 'payment-approver', 'entity-admin', 'group-admin', 'demo-operator'}
bad_dirs = [i_ for i_ in imgs if i_.split('/')[2] not in role_dirs]
big = sum(os.path.getsize(ROOT + '/' + i_) for i_ in imgs)
print('  PNG exports: %d, %.1f MB; outside the role folders: %s' % (len(imgs), big / 1e6, bad_dirs or 'none'))
if bad_dirs or big > 15e6: fail('PNG folders or size')
# (d) local assets only
remote = []
missing_asset = []
for f_, t_ in web.items():
    if f_.endswith('.html'):
        for m_ in re.finditer(r'<(?:script|img|link|source)\b[^>]*?\b(?:src|href)="([^"]+)"', t_):
            u_ = m_.group(1)
            if re.match(r'^(https?:)?//', u_): remote.append((f_, u_))
            elif not u_.startswith(('#', 'data:')):
                if not os.path.exists(os.path.normpath(os.path.join(os.path.dirname(ROOT + '/' + f_), re.split(r'[?#]', u_)[0]))): missing_asset.append((f_, u_))
    if f_.endswith('.css') and re.search(r'url\(\s*["\']?(https?:)?//|@import', t_): remote.append((f_, 'css url or import'))
    if f_.endswith('.js') and re.search(r'https?://', t_): remote.append((f_, 'js url'))
print('  remote script, stylesheet, image, font, or import: %s; local asset references that do not exist: %s' % (remote or 'none', missing_asset or 'none'))
if remote: fail('remote assets in wireframes')
if missing_asset: fail('missing local asset')
css_ = web.get(UX + 'wireframes/assets/wireframe.css', '')
fonts_missing = [u_ for u_ in re.findall(r'url\("([^"]+)"\)', css_) if not os.path.exists(WF + 'assets/' + u_)]
print('  font files named in wireframe.css that do not exist: %s; OFL.txt present: %s' % (fonts_missing or 'none', os.path.exists(WF + 'assets/fonts/OFL.txt')))
if fonts_missing or not os.path.exists(WF + 'assets/fonts/OFL.txt'): fail('fonts')
# (e) Step 4 headers
UX_FILES = ['README.md', '00-decisions.md', '01-design-system.md', '02-screen-notes.md']
h7 = []
for f_ in UX_FILES:
    t_ = text.get(UX + f_, '')
    if '> Design status: MVP — Step 4 of 9, draft for review\n>\n> Implementation status: NOT STARTED' not in t_: h7.append((f_, 'header'))
    if not re.search(r'^\*\*Related:\*\*', t_, re.M): h7.append((f_, 'Related line'))
print('  Step 4 files with the "draft for review" header and a Related line: %s' % ('all 4' if not h7 else h7))
if h7: fail('Step 4 headers')
# (f) Step 4 decisions: D-42..D-46 and DF-45..DF-52 exist and all await review
dec4 = text.get(UX + '00-decisions.md', '')
st7 = []
for i_ in ['D-%d' % n_ for n_ in range(42, 47)] + ['DF-%d' % n_ for n_ in range(45, 53)]:
    r_ = row(dec4, i_)
    if not r_: st7.append((i_, 'missing')); continue
    if r_.strip().strip('|').split('|')[-1].strip() != 'Awaiting user review': st7.append((i_, 'status'))
    if re.search(r"user'?s? (own )?decision|decided by the user|Approved", r_, re.I): st7.append((i_, 'presented as the user decision'))
print('  Step 4 decisions D-42..D-46 and defaults DF-45..DF-52 present and awaiting user review: %s' % ('yes' if not st7 else st7))
if st7: fail('Step 4 decision rows')
# (g) states: links in the screen notes exist in the wf-bar; data-show names exist in the wf-bar; every wf-bar state has an effect
bad_state_link = []
for m_ in re.finditer(r'\]\(wireframes/([\w-]+\.html)\?([^)\s]*)\)', notes):
    f_, q_ = m_.group(1), m_.group(2)
    t_ = pages.get(UX + 'wireframes/' + f_, '')
    bar_ = re.search(r'<ul class="wf-states".*?</ul>', t_, re.S)
    bar_states = set()
    for h_ in re.findall(r'href="[^"]*\?([^"]*)"', bar_.group(0) if bar_ else ''):
        for kv_ in h_.replace('&amp;', '&').split('&'):
            if kv_.startswith('state='): bar_states.add(kv_[6:])
    roles_ = set()
    rb_ = re.search(r'<ul class="wf-roles".*?</ul>', t_, re.S)
    for h_ in re.findall(r'href="[^"]*\?([^"]*)"', rb_.group(0) if rb_ else ''):
        for kv_ in h_.replace('&amp;', '&').split('&'):
            if kv_.startswith('role='): roles_.add(kv_[5:])
    for kv_ in q_.split('&'):
        if kv_.startswith('state=') and kv_[6:] not in bar_states: bad_state_link.append((f_, kv_))
        if kv_.startswith('role=') and kv_[5:] not in roles_: bad_state_link.append((f_, kv_))
print('  ?state= and ?role= links in the screen notes that are missing from the wf-bar of the page: %s' % (bad_state_link or 'none'))
if bad_state_link: fail('state link not in wf-bar')
unknown_state, dead_state = [], []
for f_, t_ in pages.items():
    bar_ = re.search(r'<ul class="wf-states".*?</ul>', t_, re.S)
    bar_states = set()
    for h_ in re.findall(r'href="[^"]*\?([^"]*)"', bar_.group(0) if bar_ else ''):
        for kv_ in h_.replace('&amp;', '&').split('&'):
            if kv_.startswith('state='): bar_states.add(kv_[6:])
    bar_states.add('default')
    used = set()
    for a_ in re.findall(r'data-(?:show|hide)="([^"]*)"', t_): used.update(a_.split())
    unknown_state += [(f_.split('/')[-1], u_) for u_ in used if u_ not in bar_states]
    dead_state += [(f_.split('/')[-1], u_) for u_ in bar_states if u_ not in used and u_ != 'default']
print('  data-show or data-hide names not in the wf-bar: %s; wf-bar states with no effect on the page: %s' % (unknown_state or 'none', dead_state or 'none'))
if unknown_state: fail('state name used in the page but not in the wf-bar')
if dead_state: fail('wf-bar state with no effect')

print('\nRESULT:', 'ALL CHECKS PASSED' if not failures else '%d FAILURE(S): %s' % (len(failures), failures))
