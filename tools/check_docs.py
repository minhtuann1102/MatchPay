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
UC = ['UC-%02d' % n for n in range(1, 29)]
US = ['US-%02d' % n for n in range(1, 29)]
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
    print('  UC-01..UC-28 in %s: %s' % (k, 'all 28 present' if not v else 'MISSING ' + str(v)))
    if v: fail('UC missing in ' + k)

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
    print('  US-01..US-28 in %s: %s' % (k, 'all 28 present' if not v else 'MISSING ' + str(v)))
    if v: fail('US missing in ' + k)

# 2c AC per story, parse
stories = {}
cur = None
for l in ac.split('\n'):
    m = re.match(r'^## (US-\d\d) — ', l)
    if m: cur = m.group(1); stories[cur] = {'hdr': None, 'acs': []}; continue
    mh = re.match(r'^(UC-\d\d) · (.+)$', l)
    if mh and cur and stories[cur]['hdr'] is None: stories[cur]['hdr'] = (mh.group(1), re.findall(r'BR-\d\d', mh.group(2))); continue
    for a in re.findall(r'\*\*(AC-\d\d\.\d+)\*\*', l):
        stories[cur]['acs'].append(a)
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
print('  stories with at least one AC: %d of 28 %s' % (28 - len(no_ac), no_ac or ''))
if no_ac: fail('stories without AC')
total_ac = sum(len(d['acs']) for d in stories.values())
print('  acceptance criteria in total:', total_ac)
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
w_missing = [w for w in ['W-%02d' % n for n in range(1, 19)] if not re.search(r'^\| %s \|' % w, mos, re.M)]
print('  W-01..W-18 listed in MoSCoW:', 'yes' if not w_missing else w_missing)
if w_missing: fail('W missing')
# MoSCoW counts match backlog
must = re.findall(r'^\| (US-\d\d) \|.*\| Must \| [SML] \|$', backlog, re.M)
should = re.findall(r'^\| (US-\d\d) \|.*\| Should \| [SML] \|$', backlog, re.M)
mos_must = re.findall(r'US-\d\d', re.search(r'\*\*Must\*\*.*?\| (\d+) \|', mos).group(0))
mos_should = re.findall(r'US-\d\d', re.search(r'\*\*Should\*\*.*?\| (\d+) \|', mos).group(0))
print('  backlog Must %d, Should %d; MoSCoW table Must %d, Should %d; sets equal: %s' % (len(must), len(should), len(mos_must), len(mos_should), set(must) == set(mos_must) and set(should) == set(mos_should)))
if not (set(must) == set(mos_must) and set(should) == set(mos_should) and len(must) + len(should) == 28): fail('MoSCoW mismatch')
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

# cross-file ID definitions
print('\n  -- other ID families --')
fam = {}
defs, refs = {}, {}
for f, t in text.items():
    t2 = re.sub(r'https?://\S+', '', t)
    for m in re.finditer(r'^\|\s*\*{0,2}((?:D|O|R|L|A|M|W|F|G|P|DF|ES|TS)-\d\d)\*{0,2}\s*\|', t2, re.M): defs.setdefault(m.group(1), set()).add(f)
    for m in re.finditer(r'\b((?:D|O|R|L|A|M|W|F|G|P|DF|ES|TS)-\d\d)\b', t2): refs.setdefault(m.group(1), set()).add(f)
undef = sorted(k for k in refs if k not in defs)
print('  IDs defined as table rows: %d; IDs referenced: %d; referenced but not defined as a table row: %s' % (len(defs), len(refs), undef))
if undef: fail('IDs referenced but undefined')
for prefix, lo, hi in [('D', 1, 32), ('O', 1, 16), ('DF', 1, 33)]:
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
assert len(rows_b) == 28, len(rows_b)
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
d32 = 'D-32' in defs and 'US-22' in [l for l in open(ROOT + '/docs/02-usecases-userstories/00-decisions.md', encoding='utf-8').read().split('\n') if l.startswith('| D-32 |')][0]
print('  D-32 defined and about US-22:', d32, '; DF range extends to DF-33:', 'DF-33' in defs)
if not d32 or 'DF-33' not in defs: fail('D-32 or DF-33')
d28 = [l for l in open(ROOT + '/docs/02-usecases-userstories/00-decisions.md', encoding='utf-8').read().split('\n') if l.startswith('| D-28 |')][0]
print('  D-28 source and resolves cells:', [c.strip() for c in d28.strip('|').split('|')[-2:]])
if 'User ruling' in ''.join(text.values()): fail('User ruling still present')

print('\nRESULT:', 'ALL CHECKS PASSED' if not failures else '%d FAILURE(S): %s' % (len(failures), failures))
