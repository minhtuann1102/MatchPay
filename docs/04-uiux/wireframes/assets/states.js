// MatchPay wireframe script: builds the sidebar and top bar for the role, and switches states.
// URL: ?role=<role>  ?state=<state>  ?shot=1 (hide the wireframe bar and the yellow numbers)  ?notes=0 (hide numbers only)
// Markup hooks:
//   data-show="a b"   visible only in the listed states     data-hide="a b"  hidden in the listed states
//   data-roles="ap chief"  visible only for the listed roles
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
      ['recurring', 'Recurring profiles', '20-recurring-profiles.html', 'repeat'],
      ['dashboard', 'Dashboard', '60-dashboard.html', 'bars']] },
    'chief': { user: 'Carol', title: 'Chief Accountant', entity: ENTITY, nav: [
      ['decisions', 'Decisions', '40-decision-queue.html', 'scale', '1'],
      ['signing', 'Signing queue', '50-signing-queue.html', 'pen', '2'],
      ['invoices', 'Invoices', '10-invoice-worklist.html', 'file'],
      ['dashboard', 'Dashboard', '60-dashboard.html', 'bars'],
      ['audit', 'Audit log', '61-audit-log.html', 'book']] },
    'approver': { user: 'Fiona', title: 'Payment Approver (CFO)', entity: ENTITY, nav: [
      ['signing', 'Signing queue', '50-signing-queue.html', 'pen'],
      ['decisions', 'Approvals', '40-decision-queue.html', 'checkcircle', '2'],
      ['invoices', 'Invoices', '10-invoice-worklist.html', 'file'],
      ['dashboard', 'Dashboard', '60-dashboard.html', 'bars']] },
    'entity-admin': { user: 'Evan', title: 'Entity Admin', entity: ENTITY, nav: [
      ['policy', 'Entity policy', '73-entity-policy.html', 'sliders'],
      ['matrix', 'Approval matrix', '74-approval-matrix.html', 'grid'],
      ['users', 'Users', '70-users.html', 'users'],
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
    var items = R.nav.map(function (n) {
      var cur = body.getAttribute('data-nav') === n[0] ? ' aria-current="page"' : '';
      var badge = n[4] ? '<span class="count"><span class="sr">Count: </span>' + n[4] + '</span>' : '';
      return '<li><a href="' + withRole(n[2]) + '"' + cur + '>' + icon(n[3]) + '<span>' + n[1] + '</span>' + badge + '</a></li>';
    }).join('');
    side.innerHTML =
      '<div class="brand"><span class="brand-mark">' + icon('stack') + '</span><span class="brand-name">MatchPay</span></div>' +
      '<button class="menu-btn" type="button" aria-label="Open menu">' + icon('menu') + '<span>Menu</span></button>' +
      '<nav aria-label="Main"><ul class="nav">' + items + '</ul></nav>';
  }
  var top = document.getElementById('topbar');
  if (top) {
    top.innerHTML =
      '<div class="top-entity"><span class="entity-name">' + R.entity + '</span>' + (R.demo ? '<span class="demo-mark">Demo only</span>' : '') + '</div>' +
      '<div class="top-user"><span class="avatar" aria-hidden="true">' + initials + '</span>' +
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

  var mb = document.querySelector('.menu-btn');
  if (mb) mb.addEventListener('click', function () { side.classList.toggle('open'); });

  // Skeleton and toast helpers need no script. Selecting rows on the signing queue updates the counter.
  document.querySelectorAll('[data-select-all]').forEach(function (all) {
    all.addEventListener('change', function () {
      document.querySelectorAll('input[data-row]:not(:disabled)').forEach(function (c) { c.checked = all.checked; });
    });
  });
})();
