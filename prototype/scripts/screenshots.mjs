// Takes the prototype screenshots into docs/images/prototype/<role-folder>/.
// Run against a served build:  npm run build && npm run preview   (port 4173)
//   NODE_PATH=$(npm root -g) node scripts/screenshots.mjs
// Every role starts in a fresh browser context, so the demo data is the seed data (the same as "reset demo data").
// OUT_DIR sets another output folder. ONLY=pilot takes just the two pilot pages, the reject modal, and the hold page, then exits.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const BASE = process.env.BASE_URL ?? 'http://localhost:4173/#';
const OUT = process.env.OUT_DIR ? path.resolve(process.env.OUT_DIR) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/images/prototype');
const ONLY = process.env.ONLY ?? '';
const VIEWPORT = { width: 1440, height: 900 };
let count = 0;

const settle = (p, ms = 1500) => p.waitForTimeout(ms);

async function newRole(browser, persona) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, locale: 'vi-VN' });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  await p.goto(`${BASE}/login`);
  await p.evaluate(() => localStorage.clear()); // reset demo data
  await p.reload();
  await p.getByRole('button', { name: /Đăng nhập: / }).first().waitFor();
  // Full-page shots: let the sider grow with the page instead of sticking to the first 900 px, and hide the floating demo button.
  await p.addStyleTag({ content: '.sider { position: static !important; height: auto !important; min-height: 100vh; } .ant-float-btn-group { display: none !important; }' });
  if (persona) {
    await p.getByRole('button', { name: new RegExp(`Đăng nhập: ${persona}`) }).click();
    await p.waitForSelector('.side-menu a');
  }
  return { ctx, p };
}

async function shot(p, folder, name, { full = true } = {}) {
  const dir = path.join(OUT, folder);
  mkdirSync(dir, { recursive: true });
  await p.mouse.move(0, 0);
  await p.waitForTimeout(400); // let hover shadows and the sider transition finish
  if (full) {
    // Grow the viewport to the page height instead of using fullPage, which resizes the window in a way that
    // briefly trips the sider's responsive collapse on some pages.
    const h = await p.evaluate(() => Math.max(document.documentElement.scrollHeight, 900));
    await p.setViewportSize({ width: VIEWPORT.width, height: h });
    await p.waitForTimeout(500);
    await p.mouse.move(0, 0);
    await p.screenshot({ path: path.join(dir, `${name}.png`) });
    await p.setViewportSize(VIEWPORT);
  } else {
    await p.screenshot({ path: path.join(dir, `${name}.png`) });
  }
  count += 1;
  console.log(`${folder}/${name}.png`);
}

/** Pages: [file name, route]. Modals and drawers: [file name, route, async open(p)]. */
async function run(browser, persona, folder, pages, modals = []) {
  const { ctx, p } = await newRole(browser, persona);
  for (const [name, route] of pages) {
    await p.goto(`${BASE}${route}`);
    await settle(p);
    await shot(p, folder, name);
  }
  for (const [name, route, open] of modals) {
    await p.goto(`${BASE}${route}`);
    await settle(p);
    await open(p);
    await settle(p, 700);
    await shot(p, folder, name, { full: false });
    await p.keyboard.press('Escape');
    await settle(p, 300);
  }
  return { ctx, p };
}

const dlg = (p) => p.getByRole('dialog');

// Opens the reject dialog of an invoice detail page: directly, or from the "other actions" menu.
const openReject = async (p) => {
  const b = p.getByRole('button', { name: 'Từ chối hóa đơn' }).first();
  if (await b.count()) await b.click();
  else { await p.getByRole('button', { name: /Cách xử lý khác|Thao tác khác/ }).first().click(); await p.getByRole('menuitem', { name: 'Từ chối hóa đơn' }).click(); }
};

const browser = await chromium.launch();

if (ONLY === 'pilot') {
  // Pilot pages of the neutral look: SCR-10 and SCR-12 as the AP Accountant, the reject modal, and the hold page as the Chief Accountant.
  {
    const { ctx } = await run(
      browser, 'Alice', 'ap-accountant',
      [
        ['10-invoice-worklist', '/invoices'],
        ['12-invoice-detail', '/invoices/inv-140'],
      ],
      [
        ['12b-invoice-detail-reject', '/invoices/inv-tm0415', openReject],
      ],
    );
    await ctx.close();
  }
  {
    const { ctx } = await run(browser, 'Carol', 'chief-accountant', [['12-invoice-detail-hold', '/invoices/inv-188']]);
    await ctx.close();
  }
  await browser.close();
  console.log(`${count} screenshots in ${OUT}`);
  process.exit(0);
}

// Common: the login page and the access-denied page.
{
  const { ctx, p } = await newRole(browser, null);
  await settle(p, 800);
  await shot(p, 'common', '01-login');
  await ctx.close();
}

// AP Accountant. The release flow changes data, so it runs last.
{
  const { ctx, p } = await run(
    browser, 'Alice', 'ap-accountant',
    [
      ['10-invoice-worklist', '/invoices'],
      ['12-invoice-detail', '/invoices/inv-140'],
      ['20-recurring-profiles', '/recurring-profiles'],
      ['24-mailbox-log', '/mailbox'],
      ['30-batch-review', '/batch'],
      ['60-dashboard', '/dashboard'],
      ['62-notifications', '/notifications'],
    ],
    [
      ['10b-invoice-worklist-upload-drawer', '/invoices', async (p) => { await p.getByRole('button', { name: 'Tải lên XML' }).first().click(); }],
      ['12b-invoice-detail-reject', '/invoices/inv-tm0415', openReject],
      ['12c-invoice-detail-match', '/invoices/inv-123?match=1&mark=1', async () => {}],
      ['30b-batch-review-close', '/batch', async (p) => { await p.getByRole('button', { name: 'Đóng lô để rà soát' }).first().click(); }],
    ],
  );
  await p.goto(`${BASE}/signing`);
  await settle(p);
  await shot(p, 'common', '90-access-denied');
  await p.goto(`${BASE}/batch`);
  await settle(p);
  await p.getByRole('button', { name: 'Đóng lô để rà soát' }).first().click();
  await dlg(p).getByRole('button', { name: 'Đóng lô để rà soát' }).click();
  await p.getByText('Kiểm tra mẫu').first().waitFor();
  const n = await p.getByRole('button', { name: 'OK', exact: true }).count();
  for (let i = 0; i < n; i++) { await p.getByRole('button', { name: 'OK', exact: true }).first().click(); await settle(p, 700); }
  await shot(p, 'ap-accountant', '30c-batch-review-sampled');
  await p.getByRole('button', { name: 'Phát hành để ký' }).first().click();
  await settle(p, 700);
  await shot(p, 'ap-accountant', '30d-batch-review-release', { full: false });
  await ctx.close();
}

// Chief Accountant
{
  const { ctx, p } = await run(
    browser, 'Carol', 'chief-accountant',
    [
      ['10-invoice-worklist', '/invoices'],
      ['12-invoice-detail-hold', '/invoices/inv-188'],
      ['40-decision-queue', '/decisions'],
      ['50-signing-queue', '/signing'],
      ['51-payment-request', '/signing/requests/PR-0042'],
      ['55-signing-delegations', '/delegations'],
      ['60-dashboard', '/dashboard'],
      ['61-audit-log', '/audit-log'],
      ['62-notifications', '/notifications'],
    ],
    [
      ['40b-decision-queue-tax-risk', '/decisions', async (p) => { await p.locator('tbody tr.ant-table-row').first().getByRole('button', { name: 'Xem xét' }).click(); }],
      ['50b-signing-queue-sign', '/signing', async (p) => {
        await p.getByRole('checkbox', { name: /PR-0042/ }).check();
        await p.getByRole('button', { name: /Ký 1 đề nghị/ }).click();
        await dlg(p).locator('.ant-otp input').first().click();
        await p.keyboard.type('246810');
      }],
      ['55b-signing-delegations-new', '/delegations', async (p) => { await p.getByRole('button', { name: 'Ủy quyền mới' }).first().click(); }],
    ],
  );
  // Sign for real and capture the signed mark in the result dialog (viewport-sized).
  await p.goto(`${BASE}/signing`);
  await settle(p);
  await p.getByRole('checkbox', { name: /PR-0042/ }).check();
  await p.getByRole('button', { name: /Ký 1 đề nghị/ }).click();
  await dlg(p).locator('.ant-otp input').first().click();
  await p.keyboard.type('246810');
  await dlg(p).getByRole('button', { name: 'Ký', exact: true }).click();
  await dlg(p).locator('.signed-mark').first().waitFor();
  await settle(p, 700);
  await shot(p, 'chief-accountant', '50c-signing-queue-signed', { full: false });
  await ctx.close();
}

// Payment Approver (CFO level)
{
  const { ctx } = await run(browser, 'Fiona', 'payment-approver', [
    ['10-invoice-worklist', '/invoices'],
    ['12-invoice-detail-approve', '/invoices/inv-151'],
    ['40-decision-queue', '/decisions'],
    ['50-signing-queue', '/signing'],
    ['51-payment-request', '/signing/requests/PR-0043'],
    ['55-signing-delegations', '/delegations'],
    ['60-dashboard', '/dashboard'],
    ['62-notifications', '/notifications'],
  ]);
  await ctx.close();
}

// Requesting Department
{
  const { ctx } = await run(browser, 'Rowan', 'requesting-department', [['22-acceptance-queue', '/acceptance']]);
  await ctx.close();
}

// Entity Admin
{
  const { ctx } = await run(browser, 'Evan', 'entity-admin', [
    ['55-signing-delegations', '/delegations'],
    ['60-dashboard', '/dashboard'],
    ['61-audit-log', '/audit-log'],
    ['70-users', '/users'],
    ['73-entity-policy', '/entity/policy'],
    ['74-approval-matrix', '/entity/approval-matrix'],
  ]);
  await ctx.close();
}

// Group Admin
{
  const { ctx } = await run(
    browser, 'Gina', 'group-admin',
    [
      ['60-dashboard', '/dashboard'],
      ['61-audit-log', '/audit-log'],
      ['70-users', '/users'],
      ['75-group-overview', '/group'],
      ['76-entities', '/group/entities'],
      ['78-automation-gates', '/group/gates'],
    ],
    [['78b-automation-gates-open', '/group/gates', async (p) => { await p.getByRole('button', { name: 'Mở cổng' }).first().click(); }]],
  );
  await ctx.close();
}

// Demo Operator
{
  const { ctx } = await run(
    browser, 'Dina', 'demo-operator',
    [['80-erp-simulator', '/demo/erp-simulator']],
    [['80b-erp-simulator-po-form', '/demo/erp-simulator', async (p) => { await p.getByRole('button', { name: 'Tạo đơn đặt hàng' }).first().click(); }]],
  );
  await ctx.close();
}

await browser.close();
console.log(`${count} screenshots in ${OUT}`);
