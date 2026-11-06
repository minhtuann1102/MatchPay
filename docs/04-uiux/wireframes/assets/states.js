// MatchPay wireframe script: builds the sidebar and top bar for the role, and switches states.
// URL: ?role=<role> (ap, chief, approver, dept, entity-admin, group-admin, demo)  ?state=<state>  ?shot=1 (hide the wireframe bar and the yellow numbers)  ?notes=0 (hide numbers only)
// Markup hooks:
//   data-show="a b"   visible only in the listed states     data-hide="a b"  hidden in the listed states
//   data-roles="ap chief"  visible only for the listed roles
//   Tabs (R1): <div class="tabgroup"><div role="tablist"><button role="tab" data-tab="id" aria-selected="true">..</button></div><div data-panel="id">..</div></div>
//     ?tab=<id> selects a tab (for PNG export). Tabs are saved views or evidence sections, not wf-bar states.
//     A tablist with data-filter filters rows that carry data-view="id id2" ("all" shows every row) and updates [data-count] / [data-total].
//     [data-goto-tab="id"] switches to that tab. [data-toggle="elementId"] shows or hides an element. ?filters=1 opens [data-open-param="filters"].
//   body[data-nav]    id of the sidebar item that is current   body[data-default-role]  role when ?role= is absent
(function () {
  var params = new URLSearchParams(location.search);
  var state = params.get('state') || 'default';
  var body = document.body;
  var role = params.get('role') || body.getAttribute('data-default-role') || 'ap';
  var has = function (list, v) { return (list || '').split(/\s+/).indexOf(v) !== -1; };

  // ---- Roles: user, entity name, sidebar items (screen 03-navigation.md) ----
  var ENTITY = 'Calderwood Foods Co.';
  var ROLES = {
    'ap': { user: 'Alice', title: 'AP Accountant', entity: ENTITY, nav: [
      ['invoices', 'Invoices', '10-invoice-worklist.html', 'file', '6'],
      ['batch', 'Batch', '30-batch-review.html', 'stack'],
      ['mailbox', 'Mailbox', '24-mailbox-log.html', 'mail'],
      ['recurring', 'Recurring profiles', '20-recurring-profiles.html', 'repeat'],
      ['notifications', 'Notifications', '62-notifications.html', 'bell'],
      ['dashboard', 'Dashboard', '60-dashboard.html', 'bars']], bell: true },
    'chief': { user: 'Carol', title: 'Chief Accountant', entity: ENTITY, nav: [
      ['decisions', 'Decisions', '40-decision-queue.html', 'scale', '1'],
      ['signing', 'Signing queue', '50-signing-queue.html', 'pen', '2'],
      ['delegations', 'Delegations', '55-signing-delegations.html', 'handover'],
      ['invoices', 'Invoices', '10-invoice-worklist.html', 'file'],
      ['notifications', 'Notifications', '62-notifications.html', 'bell'],
      ['dashboard', 'Dashboard', '60-dashboard.html', 'bars'],
      ['audit', 'Audit log', '61-audit-log.html', 'book']], bell: true },
    'approver': { user: 'Fiona', title: 'Payment Approver (CFO)', entity: ENTITY, nav: [
      ['signing', 'Signing queue', '50-signing-queue.html', 'pen'],
      ['decisions', 'Approvals', '40-decision-queue.html', 'checkcircle', '2'],
      ['delegations', 'Delegations', '55-signing-delegations.html', 'handover'],
      ['invoices', 'Invoices', '10-invoice-worklist.html', 'file'],
      ['notifications', 'Notifications', '62-notifications.html', 'bell'],
      ['dashboard', 'Dashboard', '60-dashboard.html', 'bars']], bell: true },
    'dept': { user: 'Rowan', title: 'Requesting Department', entity: ENTITY, nav: [
      ['acceptance', 'Acceptance queue', '22-acceptance-queue.html', 'checkcircle', '3']] },
    'entity-admin': { user: 'Evan', title: 'Entity Admin', entity: ENTITY, nav: [
      ['policy', 'Entity policy', '73-entity-policy.html', 'sliders'],
      ['matrix', 'Approval matrix', '74-approval-matrix.html', 'grid'],
      ['users', 'Users', '70-users.html', 'users'],
      ['delegations', 'Delegations', '55-signing-delegations.html', 'handover'],
      ['dashboard', 'Dashboard', '60-dashboard.html', 'bars'],
      ['audit', 'Audit log', '61-audit-log.html', 'book']] },
    'group-admin': { user: 'Gina', title: 'Group Admin', entity: 'Calderwood Group', nav: [
      ['group', 'Group overview', '75-group-overview.html', 'network'],
      ['gates', 'Automation gates', '78-automation-gates.html', 'unlock', '1'],
      ['entities', 'Entities and limits', '76-entities.html', 'building'],
      ['users', 'Users', '70-users.html', 'users'],
      ['dashboard', 'Dashboard', '60-dashboard.html', 'bars'],
      ['audit', 'Audit log', '61-audit-log.html', 'book']] },
    'demo': { user: 'Dina', title: 'Demo Operator', entity: 'Calderwood Group', demo: true, nav: [
      ['erp', 'ERP simulator', '80-erp-simulator.html', 'server']] }
  };
  if (!ROLES[role]) role = body.getAttribute('data-default-role') || 'ap';
  var R = ROLES[role];
  body.setAttribute('data-state', state);
  body.setAttribute('data-role', role);
  if (params.get('notes') === '0') body.classList.add('no-notes');
  if (params.get('shot') === '1') body.classList.add('shot');

  var icon = function (n, c) { return '<svg class="i' + (c ? ' ' + c : '') + '" aria-hidden="true"><use href="#i-' + n + '"></use></svg>'; };
  var withRole = function (href) { return href + '?role=' + role; };
  var initials = R.user.slice(0, 1);

  var side = document.getElementById('sidebar');
  if (side) {
    // A page can override a sidebar badge for one state: body[data-badges-<state>="invoices=7"].
    var ov = {};
    (body.getAttribute('data-badges-' + state) || '').split(/\s+/).forEach(function (kv) { var a = kv.split('='); if (a[1]) ov[a[0]] = a[1]; });
    var items = R.nav.map(function (n) {
      var cur = body.getAttribute('data-nav') === n[0] ? ' aria-current="page"' : '';
      var cnt = ov[n[0]] || n[4];
      var badge = cnt ? '<span class="count"><span class="sr">Count: </span>' + cnt + '</span>' : '';
      return '<li><a href="' + withRole(n[2]) + '"' + cur + '>' + icon(n[3]) + '<span>' + n[1] + '</span>' + badge + '</a></li>';
    }).join('');
    side.innerHTML =
      '<div class="brand"><span class="brand-mark">' + icon('stack') + '</span><span class="brand-name">MatchPay</span></div>' +
      '<button class="menu-btn" type="button" aria-label="Open menu">' + icon('menu') + '<span>Menu</span></button>' +
      '<nav aria-label="Main"><ul class="nav">' + items + '</ul></nav>';
  }
  var top = document.getElementById('topbar');
  if (top) {
    // Mind map sync (D-100): the AP Accountant, the Chief Accountant, and the Payment Approver see "Notifications" with the number of unread items.
    // Unread count is 3 in the sample; a page can list states with no unread item in body[data-unread-zero] (the number is then left out).
    var unread = has(body.getAttribute('data-unread-zero'), state) ? 0 : 3;
    var bell = R.bell ? '<a class="bell" href="' + withRole('62-notifications.html') + '"' + (body.getAttribute('data-nav') === 'notifications' ? ' aria-current="page"' : '') + '>' + icon('bell') + '<span>Notifications</span>' +
      (unread ? '<span class="unread-badge"><span class="sr">Unread: </span>' + unread + '</span>' : '') + '</a>' : '';
    top.innerHTML =
      '<div class="top-entity"><span class="entity-name">' + R.entity + '</span>' + (R.demo ? '<span class="demo-mark">Demo only</span>' : '') + '</div>' +
      '<div class="top-user">' + bell + '<span class="avatar" aria-hidden="true">' + initials + '</span>' +
      '<span class="who"><b>' + R.user + '</b>, ' + R.title + '</span>' +
      '<a class="btn btn-quiet btn-sm" href="01-login.html">' + icon('logout', 'i-sm') + 'Log out</a></div>';
  }

  // ---- State and role visibility ----
  document.querySelectorAll('[data-show]').forEach(function (el) { el.hidden = !has(el.getAttribute('data-show'), state); });
  document.querySelectorAll('[data-hide]').forEach(function (el) { if (has(el.getAttribute('data-hide'), state)) el.hidden = true; });
  document.querySelectorAll('[data-roles]').forEach(function (el) { if (!has(el.getAttribute('data-roles'), role)) el.hidden = true; });
  document.querySelectorAll('[data-role-show]').forEach(function (el) { if (!has(el.getAttribute('data-role-show'), role)) el.hidden = true; });

  // ---- Wireframe bar: mark the current role and state, keep the other parameter ----
  var file = location.pathname.split('/').pop();
  document.querySelectorAll('.wf-roles a').forEach(function (a) {
    var u = new URL(a.getAttribute('href'), location.href);
    if (u.searchParams.get('role') === role) a.setAttribute('aria-current', 'true');
    if (state !== 'default') u.searchParams.set('state', state);
    a.setAttribute('href', file + u.search);
  });
  document.querySelectorAll('.wf-states a').forEach(function (a) {
    var u = new URL(a.getAttribute('href'), location.href);
    if ((u.searchParams.get('state') || 'default') === state) a.setAttribute('aria-current', 'true');
    if (!u.searchParams.has('role') && params.get('role')) u.searchParams.set('role', params.get('role'));
    a.setAttribute('href', file + u.search);
  });

  // Links inside the page keep the current role unless they name another one.
  document.querySelectorAll('.main a[href]').forEach(function (a) {
    var h = a.getAttribute('href');
    if (!/\.html(\?|$)/.test(h) || /^https?:/.test(h) || /role=/.test(h)) return;
    a.setAttribute('href', h + (h.indexOf('?') === -1 ? '?' : '&') + 'role=' + role);
  });

  // ---- Tabs and saved views (R1) ----
  var tabParam = params.get('tab');
  var groupOf = function (el) { return el.closest('.tabgroup') || document; };
  function selectTab(list, id) {
    var group = groupOf(list);
    var tabs = list.querySelectorAll('[role="tab"]');
    var found = false;
    tabs.forEach(function (t) { if (t.getAttribute('data-tab') === id) found = true; });
    if (!found) return false;
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-tab') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    group.querySelectorAll('[data-panel]').forEach(function (p) {
      if (groupOf(p.parentElement) !== group) return;
      p.hidden = p.getAttribute('data-panel') !== id;
    });
    if (list.hasAttribute('data-filter')) {
      var shown = 0, total = 0;
      group.querySelectorAll('[data-view]').forEach(function (r) {
        var ok = id === 'all' || has(r.getAttribute('data-view'), id);
        r.hidden = !ok;
        if (r.parentElement.closest('[hidden]')) return;
        if (ok) shown++; total++;
      });
      group.querySelectorAll('[data-count]').forEach(function (c) { c.textContent = shown; });
      group.querySelectorAll('[data-total]').forEach(function (c) { c.textContent = total; });
    }
    return true;
  }
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    if (list.closest('[hidden]')) return;
    var start = list.querySelector('[role="tab"][aria-selected="true"]');
    if (!(tabParam && selectTab(list, tabParam)) && start) selectTab(list, start.getAttribute('data-tab'));
    list.addEventListener('click', function (e) {
      var t = e.target.closest('[role="tab"]'); if (t) selectTab(list, t.getAttribute('data-tab'));
    });
    list.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var tabs = Array.prototype.slice.call(list.querySelectorAll('[role="tab"]'));
      var i = tabs.indexOf(document.activeElement); if (i < 0) return;
      var n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(list, n.getAttribute('data-tab')); n.focus();
    });
  });
  document.querySelectorAll('[data-goto-tab]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var group = groupOf(a), id = a.getAttribute('data-goto-tab');
      var list = group.querySelector('[role="tablist"]'); if (list) selectTab(list, id);
    });
  });
  // Show or hide an element (filter panel). ?filters=1 opens it for review and export.
  document.querySelectorAll('[data-toggle]').forEach(function (b) {
    var target = document.getElementById(b.getAttribute('data-toggle'));
    if (!target) return;
    var sync = function () { b.setAttribute('aria-expanded', target.hidden ? 'false' : 'true'); };
    b.addEventListener('click', function () { target.hidden = !target.hidden; sync(); });
    if (params.get('filters') === '1' && target.hasAttribute('data-open-param')) target.hidden = false;
    sync();
  });
  // Close an open "More" menu on an outside click.
  document.addEventListener('click', function (e) {
    document.querySelectorAll('details.menu[open]').forEach(function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });

  var mb = document.querySelector('.menu-btn');
  if (mb) mb.addEventListener('click', function () { side.classList.toggle('open'); });

  // Skeleton and toast helpers need no script. Selecting rows on the signing queue updates the counter.
  document.querySelectorAll('[data-select-all]').forEach(function (all) {
    all.addEventListener('change', function () {
      document.querySelectorAll('input[data-row]:not(:disabled)').forEach(function (c) { c.checked = all.checked; });
    });
  });
})();
