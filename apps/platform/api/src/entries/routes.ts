import { AppError } from "@codexsun/framework/errors";
import { ok } from "@codexsun/framework/http";
import type { FastifyInstance } from "fastify";
import { requireActiveTenant, requireFeatureEnabled, requirePermission, requireSession } from "../auth/guards.js";

type EntryKind = "quotation" | "sales" | "exportSales" | "purchase" | "receipt" | "payment";
type EntryLineInput = {
  lineId?: string;
  productId?: string | null;
  productName?: string;
  description?: string | null;
  colour?: string | null;
  hsnCode?: string | null;
  poNo?: string | null;
  dcNo?: string | null;
  size?: string | null;
  unit?: string | null;
  quantity?: number;
  rate?: number;
  discountAmount?: number;
  taxRate?: number;
};
type EntryAllocationInput = {
  allocationId?: string;
  documentType?: string;
  documentId?: string | null;
  documentNo?: string;
  documentDate?: string | null;
  documentTotal?: number;
  previousBalance?: number;
  allocatedAmount?: number;
};
type EntryInput = {
  entryId?: string;
  documentNo?: string;
  documentDate?: string;
  partyId?: string | null;
  partyName?: string;
  partyType?: string | null;
  partyGstin?: string | null;
  partyStateCode?: string | null;
  partyStateName?: string | null;
  supplierBillNo?: string | null;
  supplierBillDate?: string | null;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  placeOfSupply?: string | null;
  referenceNo?: string | null;
  referenceDate?: string | null;
  dueDate?: string | null;
  ledgerId?: string | null;
  ledgerName?: string | null;
  paymentMode?: string | null;
  bankAccountId?: string | null;
  roundOff?: number;
  paidAmount?: number;
  amount?: number;
  tdsAmount?: number;
  discountTotal?: number;
  status?: string;
  paymentStatus?: string;
  notes?: string | null;
  terms?: string | null;
  irn?: string | null;
  ackNo?: string | null;
  ackDate?: string | null;
  signedQr?: string | null;
  ewayBillNo?: string | null;
  ewayBillDate?: string | null;
  transportName?: string | null;
  vehicleNo?: string | null;
  ewayPart?: string | null;
  transport?: Record<string, unknown> | null;
  compliance?: Record<string, unknown> | null;
  source?: Record<string, unknown> | null;
  lines?: EntryLineInput[];
  allocations?: EntryAllocationInput[];
};

type EntryDocumentRow = {
  id: number | string;
  tenant_id: string;
  entry_id: string;
  entry_type: EntryKind;
  document_no: string;
  document_date: string | Date;
  party_id: string | null;
  party_name: string;
  party_type: string | null;
  party_gstin: string | null;
  party_state_code: string | null;
  party_state_name: string | null;
  supplier_bill_no: string | null;
  supplier_bill_date: string | Date | null;
  billing_address: string | null;
  shipping_address: string | null;
  place_of_supply: string | null;
  reference_no: string | null;
  reference_date: string | Date | null;
  due_date: string | Date | null;
  ledger_id: string | null;
  ledger_name: string | null;
  payment_mode: string | null;
  bank_account_id: string | null;
  subtotal: number | string;
  discount_total: number | string;
  taxable_total: number | string;
  tax_total: number | string;
  round_off: number | string;
  grand_total: number | string;
  paid_amount: number | string;
  balance_amount: number | string;
  amount: number | string;
  tds_amount: number | string;
  net_amount: number | string;
  allocated_amount: number | string;
  unallocated_amount: number | string;
  status: string;
  payment_status: string;
  notes: string | null;
  terms: string | null;
  irn: string | null;
  ack_no: string | null;
  ack_date: string | Date | null;
  signed_qr: string | null;
  eway_bill_no: string | null;
  eway_bill_date: string | Date | null;
  transport_name: string | null;
  vehicle_no: string | null;
  eway_part: string | null;
  transport_json: string | Record<string, unknown> | null;
  compliance_json: string | Record<string, unknown> | null;
  source_json: string | Record<string, unknown> | null;
  is_active: number | boolean;
  created_by: string;
  updated_by: string;
  created_at: string | Date;
  updated_at: string | Date;
  deleted_at: string | Date | null;
};

const entryKinds = new Set<EntryKind>(["quotation", "sales", "exportSales", "purchase", "receipt", "payment"]);
const documentPrefixes: Record<EntryKind, string> = {
  quotation: "QT",
  sales: "SAL",
  exportSales: "EXP",
  purchase: "PUR",
  receipt: "REC",
  payment: "PAY",
};

export async function registerEntryRoutes(app: FastifyInstance) {
  app.get("/core/entries/:kind", async (request) => {
    const session = await requireTenantSession(app, request);
    requirePermission(session, "core.common.view");
    const kind = parseEntryKind((request.params as { kind: string }).kind);
    const entries = await listEntries(app, request.tenantId!, kind);
    return ok(entries, responseMeta(request));
  });

  app.get("/core/entries/:kind/:id", async (request) => {
    const session = await requireTenantSession(app, request);
    requirePermission(session, "core.common.view");
    const { kind: rawKind, id } = request.params as { kind: string; id: string };
    const entry = await getEntry(app, request.tenantId!, parseEntryKind(rawKind), id);
    return ok(entry, responseMeta(request));
  });

  app.post("/core/entries/:kind/upsert", async (request) => {
    const session = await requireTenantSession(app, request, true);
    requirePermission(session, "core.common.manage");
    const kind = parseEntryKind((request.params as { kind: string }).kind);
    const entry = await upsertEntry(app, request.tenantId!, kind, request.body as EntryInput, session.email);
    return ok({ ok: true, entry }, responseMeta(request));
  });

  app.post("/core/entries/:kind/:id/archive", async (request) => {
    const session = await requireTenantSession(app, request, true);
    requirePermission(session, "core.common.manage");
    const { kind: rawKind, id } = request.params as { kind: string; id: string };
    const entry = await setEntryActive(app, request.tenantId!, parseEntryKind(rawKind), id, false, session.email);
    return ok({ ok: true, entry }, responseMeta(request));
  });

  app.post("/core/entries/:kind/:id/restore", async (request) => {
    const session = await requireTenantSession(app, request, true);
    requirePermission(session, "core.common.manage");
    const { kind: rawKind, id } = request.params as { kind: string; id: string };
    const entry = await setEntryActive(app, request.tenantId!, parseEntryKind(rawKind), id, true, session.email);
    return ok({ ok: true, entry }, responseMeta(request));
  });

  app.post("/core/entries/:kind/:id/comments", async (request) => {
    const session = await requireTenantSession(app, request, true);
    requirePermission(session, "core.common.manage");
    const { kind: rawKind, id } = request.params as { kind: string; id: string };
    const kind = parseEntryKind(rawKind);
    const body = request.body as { body?: string };
    const comment = String(body.body ?? "").trim();
    if (!comment) throw AppError.validation("Comment is required");
    const entry = await getEntry(app, request.tenantId!, kind, id);
    await app.masterDbPool.execute(
      `INSERT INTO tenant_entry_comments (tenant_id, entry_id, comment_id, author_email, body)
       VALUES (?, ?, ?, ?, ?)`,
      [request.tenantId!, entry.entryId, newId(), session.email, comment],
    );
    await addActivity(app, request.tenantId!, entry.entryId, "comment", session.email, "Comment added", { body: comment });
    return ok({ ok: true, entry: await getEntry(app, request.tenantId!, kind, entry.entryId) }, responseMeta(request));
  });

  app.post("/core/entries/:kind/:id/tools", async (request) => {
    const session = await requireTenantSession(app, request, true);
    requirePermission(session, "core.common.manage");
    const { kind: rawKind, id } = request.params as { kind: string; id: string };
    const kind = parseEntryKind(rawKind);
    const body = request.body as { tool?: string; value?: string };
    const tool = clean(body.tool) ?? "entry-tool";
    const value = clean(body.value);
    const entry = await getEntry(app, request.tenantId!, kind, id);
    const message = entryToolMessage(tool, value);
    await addActivity(app, request.tenantId!, entry.entryId, "tool", session.email, message, { tool, value });
    return ok({ ok: true, entry: await getEntry(app, request.tenantId!, kind, entry.entryId) }, responseMeta(request));
  });

  app.post("/core/entries/:kind/:id/compliance/:action", async (request) => {
    const session = await requireTenantSession(app, request, true);
    requirePermission(session, "core.common.manage");
    const { kind: rawKind, id, action } = request.params as { kind: string; id: string; action: string };
    const kind = parseEntryKind(rawKind);
    if (kind !== "sales" && kind !== "exportSales" && kind !== "quotation") throw AppError.validation("Compliance generation is available for sales-style entries only");
    const entry = await getEntry(app, request.tenantId!, kind, id);
    const result = await runWhiteBooksCompliance(app, request.tenantId!, entry, action, request.body as Record<string, unknown> | undefined, session.email);
    return ok({ ok: true, entry: await getEntry(app, request.tenantId!, kind, entry.entryId), document: result.document, provider: result.provider }, responseMeta(request));
  });
}

async function requireTenantSession(app: FastifyInstance, request: any, mutate = false) {
  const session = await requireSession(app, request);
  if (!request.tenantId) throw AppError.validation("x-tenant-id header is required for tenant-scoped routes");
  if (session.tenantId && session.tenantId !== request.tenantId) {
    throw AppError.forbidden("Tenant mismatch: request tenant does not match session tenant");
  }
  if (mutate) {
    await requireActiveTenant(app, request.tenantId);
    await requireFeatureEnabled(app, request.tenantId, "core");
  }
  return session;
}

async function listEntries(app: FastifyInstance, tenantId: string, kind: EntryKind) {
  const [rows] = await app.masterDbPool.execute<EntryDocumentRow[]>(
    `SELECT * FROM tenant_entry_documents
     WHERE tenant_id = ? AND entry_type = ? AND deleted_at IS NULL
     ORDER BY document_date DESC, id DESC`,
    [tenantId, kind],
  );
  const entries = [];
  for (const row of rows) entries.push(await hydrateEntry(app, row));
  return entries;
}

async function getEntry(app: FastifyInstance, tenantId: string, kind: EntryKind, id: string) {
  const [rows] = await app.masterDbPool.execute<EntryDocumentRow[]>(
    `SELECT * FROM tenant_entry_documents
     WHERE tenant_id = ? AND entry_type = ? AND (entry_id = ? OR document_no = ?)
     LIMIT 1`,
    [tenantId, kind, id, id],
  );
  const row = rows[0];
  if (!row) throw AppError.notFound(`${entryLabel(kind)} entry not found`);
  return hydrateEntry(app, row);
}

async function upsertEntry(app: FastifyInstance, tenantId: string, kind: EntryKind, input: EntryInput, actorEmail: string) {
  const entryId = input.entryId?.trim() || newId();
  const existing = input.entryId ? await findEntryRow(app, tenantId, kind, input.entryId) : null;
  const lines = normalizeLines(input.lines ?? []);
  const allocations = normalizeAllocations(input.allocations ?? []);
  const totals = ["receipt", "payment"].includes(kind)
    ? calculateAllocationTotals(input, allocations)
    : calculateLineTotals(input, lines);
  const documentNo = input.documentNo?.trim() || await nextDocumentNo(app, tenantId, kind);
  const documentDate = cleanDate(input.documentDate) || today();
  const partyName = input.partyName?.trim();
  if (!partyName) throw AppError.validation(`${partyLabel(kind)} is required`);
  if (!["receipt", "payment"].includes(kind) && lines.length === 0) {
    throw AppError.validation("At least one item line is required");
  }
  const duplicate = await findEntryByDocumentNo(app, tenantId, kind, documentNo);
  if (duplicate && duplicate.entry_id !== entryId) {
    throw AppError.conflict(`${entryLabel(kind)} document no '${documentNo}' already exists for this tenant`);
  }

  const values = [
    tenantId,
    entryId,
    kind,
    documentNo,
    documentDate,
    clean(input.partyId),
    partyName,
    clean(input.partyType) || defaultPartyType(kind),
    clean(input.partyGstin),
    clean(input.partyStateCode),
    clean(input.partyStateName),
    clean(input.supplierBillNo),
    cleanDate(input.supplierBillDate),
    clean(input.billingAddress),
    clean(input.shippingAddress),
    clean(input.placeOfSupply) || "cgst-sgst",
    clean(input.referenceNo),
    cleanDate(input.referenceDate),
    cleanDate(input.dueDate),
    clean(input.ledgerId),
    clean(input.ledgerName) || (["receipt", "payment"].includes(kind) ? "Cash" : null),
    clean(input.paymentMode) || (["receipt", "payment"].includes(kind) ? "cash" : null),
    clean(input.bankAccountId),
    totals.subtotal,
    totals.discountTotal,
    totals.taxableTotal,
    totals.taxTotal,
    totals.roundOff,
    totals.grandTotal,
    totals.paidAmount,
    totals.balanceAmount,
    totals.amount,
    totals.tdsAmount,
    totals.netAmount,
    totals.allocatedAmount,
    totals.unallocatedAmount,
    input.status || "draft",
    totals.paymentStatus || input.paymentStatus || "unpaid",
    clean(input.notes),
    clean(input.terms) || defaultTerms(kind),
    clean(input.irn),
    clean(input.ackNo),
    cleanDate(input.ackDate),
    clean(input.signedQr),
    clean(input.ewayBillNo),
    cleanDate(input.ewayBillDate),
    clean(input.transportName),
    clean(input.vehicleNo),
    clean(input.ewayPart),
    JSON.stringify(input.transport ?? {}),
    JSON.stringify(input.compliance ?? {}),
    JSON.stringify(input.source ?? {}),
    actorEmail,
    actorEmail,
  ];

  if (existing) {
    await app.masterDbPool.execute(
      `UPDATE tenant_entry_documents SET
        document_no = ?, document_date = ?, party_id = ?, party_name = ?, party_type = ?, party_gstin = ?,
        party_state_code = ?, party_state_name = ?, supplier_bill_no = ?, supplier_bill_date = ?,
        billing_address = ?, shipping_address = ?, place_of_supply = ?, reference_no = ?, reference_date = ?, due_date = ?,
        ledger_id = ?, ledger_name = ?, payment_mode = ?, bank_account_id = ?, subtotal = ?, discount_total = ?,
        taxable_total = ?, tax_total = ?, round_off = ?, grand_total = ?, paid_amount = ?, balance_amount = ?,
        amount = ?, tds_amount = ?, net_amount = ?, allocated_amount = ?, unallocated_amount = ?, status = ?,
        payment_status = ?, notes = ?, terms = ?, irn = ?, ack_no = ?, ack_date = ?, signed_qr = ?,
        eway_bill_no = ?, eway_bill_date = ?, transport_name = ?, vehicle_no = ?, eway_part = ?,
        transport_json = ?, compliance_json = ?, source_json = ?,
        updated_by = ?, deleted_at = NULL, is_active = 1
       WHERE tenant_id = ? AND entry_type = ? AND entry_id = ?`,
      [...values.slice(3, 52), actorEmail, tenantId, kind, entryId],
    );
  } else {
    await app.masterDbPool.execute(
      `INSERT INTO tenant_entry_documents (
        tenant_id, entry_id, entry_type, document_no, document_date, party_id, party_name, party_type,
        party_gstin, party_state_code, party_state_name, supplier_bill_no, supplier_bill_date, billing_address,
        shipping_address, place_of_supply, reference_no, reference_date, due_date, ledger_id, ledger_name,
        payment_mode, bank_account_id, subtotal, discount_total, taxable_total, tax_total, round_off, grand_total,
        paid_amount, balance_amount, amount, tds_amount, net_amount, allocated_amount, unallocated_amount,
        status, payment_status, notes, terms, irn, ack_no, ack_date, signed_qr, eway_bill_no, eway_bill_date,
        transport_name, vehicle_no, eway_part, transport_json, compliance_json, source_json, created_by, updated_by
      ) VALUES (${values.map(() => "?").join(", ")})`,
      values,
    );
  }

  await replaceLines(app, tenantId, entryId, lines);
  await replaceAllocations(app, tenantId, entryId, allocations);
  await addActivity(app, tenantId, entryId, existing ? "updated" : "created", actorEmail, `${entryLabel(kind)} ${existing ? "updated" : "created"}`, { documentNo });
  if ((kind === "receipt" || kind === "payment") && (input.status || "draft") === "posted") {
    const source = input.source && typeof input.source === "object" ? input.source : {};
    const postingEnabled = source.accountPostingEnabled !== false;
    await addActivity(
      app,
      tenantId,
      entryId,
      postingEnabled ? "account-posted" : "account-posting-skipped",
      actorEmail,
      postingEnabled ? `${entryLabel(kind)} posted to accounts ledger ${clean(input.ledgerName) ?? "Cash"}` : `${entryLabel(kind)} saved without accounts ledger posting`,
      { ledgerName: clean(input.ledgerName), paymentMode: clean(input.paymentMode), postingEnabled },
    );
  }
  return getEntry(app, tenantId, kind, entryId);
}

async function setEntryActive(app: FastifyInstance, tenantId: string, kind: EntryKind, id: string, active: boolean, actorEmail: string) {
  const entry = await getEntry(app, tenantId, kind, id);
  await app.masterDbPool.execute(
    `UPDATE tenant_entry_documents
     SET is_active = ?, status = ?, deleted_at = ?, updated_by = ?
     WHERE tenant_id = ? AND entry_type = ? AND entry_id = ?`,
    [active ? 1 : 0, active ? "draft" : "cancelled", active ? null : sqlNow(), actorEmail, tenantId, kind, entry.entryId],
  );
  await addActivity(app, tenantId, entry.entryId, active ? "restored" : "archived", actorEmail, `${entryLabel(kind)} ${active ? "restored" : "suspended"}`, {});
  return getEntry(app, tenantId, kind, entry.entryId);
}

async function findEntryRow(app: FastifyInstance, tenantId: string, kind: EntryKind, entryId: string) {
  const [rows] = await app.masterDbPool.execute<EntryDocumentRow[]>(
    `SELECT * FROM tenant_entry_documents WHERE tenant_id = ? AND entry_type = ? AND entry_id = ? LIMIT 1`,
    [tenantId, kind, entryId],
  );
  return rows[0] ?? null;
}

async function findEntryByDocumentNo(app: FastifyInstance, tenantId: string, kind: EntryKind, documentNo: string) {
  const [rows] = await app.masterDbPool.execute<EntryDocumentRow[]>(
    `SELECT * FROM tenant_entry_documents
     WHERE tenant_id = ? AND entry_type = ? AND document_no = ? AND deleted_at IS NULL
     LIMIT 1`,
    [tenantId, kind, documentNo],
  );
  return rows[0] ?? null;
}

async function replaceLines(app: FastifyInstance, tenantId: string, entryId: string, lines: Required<EntryLineInput>[]) {
  await app.masterDbPool.execute("DELETE FROM tenant_entry_lines WHERE tenant_id = ? AND entry_id = ?", [tenantId, entryId]);
  for (const [index, line] of lines.entries()) {
    const taxable = round(line.quantity * line.rate - line.discountAmount);
    const taxAmount = round(taxable * line.taxRate / 100);
    const lineTotal = round(taxable + taxAmount);
    await app.masterDbPool.execute(
      `INSERT INTO tenant_entry_lines (
        tenant_id, entry_id, line_id, product_id, product_name, description, colour, hsn_code, po_no, dc_no,
        size, unit, quantity, rate, discount_amount, tax_rate, tax_amount, line_total, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId, entryId, line.lineId || newId(), clean(line.productId), line.productName, clean(line.description),
        clean(line.colour), clean(line.hsnCode), clean(line.poNo), clean(line.dcNo), clean(line.size), clean(line.unit),
        line.quantity, line.rate, line.discountAmount, line.taxRate, taxAmount, lineTotal, index + 1,
      ],
    );
  }
}

async function replaceAllocations(app: FastifyInstance, tenantId: string, entryId: string, allocations: Required<EntryAllocationInput>[]) {
  await app.masterDbPool.execute("DELETE FROM tenant_entry_allocations WHERE tenant_id = ? AND entry_id = ?", [tenantId, entryId]);
  for (const [index, allocation] of allocations.entries()) {
    const balance = round(allocation.previousBalance - allocation.allocatedAmount);
    await app.masterDbPool.execute(
      `INSERT INTO tenant_entry_allocations (
        tenant_id, entry_id, allocation_id, document_type, document_id, document_no, document_date,
        document_total, previous_balance, allocated_amount, balance_after_allocation, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenantId, entryId, allocation.allocationId || newId(), allocation.documentType, clean(allocation.documentId),
        allocation.documentNo, cleanDate(allocation.documentDate), allocation.documentTotal, allocation.previousBalance,
        allocation.allocatedAmount, balance, index + 1,
      ],
    );
  }
}

async function hydrateEntry(app: FastifyInstance, row: EntryDocumentRow) {
  const [lineRows] = await app.masterDbPool.execute<any[]>(
    "SELECT * FROM tenant_entry_lines WHERE tenant_id = ? AND entry_id = ? ORDER BY sort_order ASC, id ASC",
    [row.tenant_id, row.entry_id],
  );
  const [allocationRows] = await app.masterDbPool.execute<any[]>(
    "SELECT * FROM tenant_entry_allocations WHERE tenant_id = ? AND entry_id = ? ORDER BY sort_order ASC, id ASC",
    [row.tenant_id, row.entry_id],
  );
  const [commentRows] = await app.masterDbPool.execute<any[]>(
    "SELECT * FROM tenant_entry_comments WHERE tenant_id = ? AND entry_id = ? ORDER BY id ASC",
    [row.tenant_id, row.entry_id],
  );
  const [activityRows] = await app.masterDbPool.execute<any[]>(
    "SELECT * FROM tenant_entry_activities WHERE tenant_id = ? AND entry_id = ? ORDER BY id ASC",
    [row.tenant_id, row.entry_id],
  );
  return {
    entryId: row.entry_id,
    entryType: row.entry_type,
    documentNo: row.document_no,
    documentDate: dateOnly(row.document_date),
    partyId: row.party_id,
    partyName: row.party_name,
    partyType: row.party_type,
    partyGstin: row.party_gstin,
    partyStateCode: row.party_state_code,
    partyStateName: row.party_state_name,
    supplierBillNo: row.supplier_bill_no,
    supplierBillDate: dateOnly(row.supplier_bill_date),
    billingAddress: row.billing_address,
    shippingAddress: row.shipping_address,
    placeOfSupply: row.place_of_supply,
    referenceNo: row.reference_no,
    referenceDate: dateOnly(row.reference_date),
    dueDate: dateOnly(row.due_date),
    ledgerId: row.ledger_id,
    ledgerName: row.ledger_name,
    paymentMode: row.payment_mode,
    bankAccountId: row.bank_account_id,
    subtotal: numberValue(row.subtotal),
    discountTotal: numberValue(row.discount_total),
    taxableTotal: numberValue(row.taxable_total),
    taxTotal: numberValue(row.tax_total),
    roundOff: numberValue(row.round_off),
    grandTotal: numberValue(row.grand_total),
    paidAmount: numberValue(row.paid_amount),
    balanceAmount: numberValue(row.balance_amount),
    amount: numberValue(row.amount),
    tdsAmount: numberValue(row.tds_amount),
    netAmount: numberValue(row.net_amount),
    allocatedAmount: numberValue(row.allocated_amount),
    unallocatedAmount: numberValue(row.unallocated_amount),
    status: row.status,
    paymentStatus: row.payment_status,
    notes: row.notes,
    terms: row.terms,
    irn: row.irn,
    ackNo: row.ack_no,
    ackDate: dateOnly(row.ack_date),
    signedQr: row.signed_qr,
    ewayBillNo: row.eway_bill_no,
    ewayBillDate: dateOnly(row.eway_bill_date),
    transportName: row.transport_name,
    vehicleNo: row.vehicle_no,
    ewayPart: row.eway_part,
    transport: jsonValue(row.transport_json),
    compliance: jsonValue(row.compliance_json),
    source: jsonValue(row.source_json),
    isActive: Boolean(row.is_active),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    createdAt: isoValue(row.created_at),
    updatedAt: isoValue(row.updated_at),
    deletedAt: isoValue(row.deleted_at),
    lines: lineRows.map((line) => ({
      lineId: line.line_id,
      productId: line.product_id,
      productName: line.product_name,
      description: line.description,
      colour: line.colour,
      hsnCode: line.hsn_code,
      poNo: line.po_no,
      dcNo: line.dc_no,
      size: line.size,
      unit: line.unit,
      quantity: numberValue(line.quantity),
      rate: numberValue(line.rate),
      discountAmount: numberValue(line.discount_amount),
      taxRate: numberValue(line.tax_rate),
      taxAmount: numberValue(line.tax_amount),
      lineTotal: numberValue(line.line_total),
    })),
    allocations: allocationRows.map((allocation) => ({
      allocationId: allocation.allocation_id,
      documentType: allocation.document_type,
      documentId: allocation.document_id,
      documentNo: allocation.document_no,
      documentDate: dateOnly(allocation.document_date),
      documentTotal: numberValue(allocation.document_total),
      previousBalance: numberValue(allocation.previous_balance),
      allocatedAmount: numberValue(allocation.allocated_amount),
      balanceAfterAllocation: numberValue(allocation.balance_after_allocation),
    })),
    comments: commentRows.map((comment) => ({
      commentId: comment.comment_id,
      authorEmail: comment.author_email,
      body: comment.body,
      createdAt: isoValue(comment.created_at),
    })),
    activities: activityRows.map((activity) => ({
      activityId: activity.activity_id,
      activityType: activity.activity_type,
      actorEmail: activity.actor_email,
      message: activity.message,
      payload: jsonValue(activity.payload_json),
      createdAt: isoValue(activity.created_at),
    })),
  };
}

async function nextDocumentNo(app: FastifyInstance, tenantId: string, kind: EntryKind) {
  const prefix = documentPrefixes[kind];
  const [rows] = await app.masterDbPool.execute<Array<{ count_value: number | string }>>(
    "SELECT COUNT(*) AS count_value FROM tenant_entry_documents WHERE tenant_id = ? AND entry_type = ?",
    [tenantId, kind],
  );
  return `${prefix}-${String(Number(rows[0]?.count_value ?? 0) + 1).padStart(5, "0")}`;
}

async function addActivity(app: FastifyInstance, tenantId: string, entryId: string, type: string, actorEmail: string, message: string, payload: Record<string, unknown>) {
  await app.masterDbPool.execute(
    `INSERT INTO tenant_entry_activities (tenant_id, entry_id, activity_id, activity_type, actor_email, message, payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, entryId, newId(), type, actorEmail, message, JSON.stringify(payload)],
  );
}

async function runWhiteBooksCompliance(app: FastifyInstance, tenantId: string, entry: Awaited<ReturnType<typeof hydrateEntry>>, action: string, input: Record<string, unknown> | undefined, actorEmail: string) {
  const operation = whiteBooksOperation(action);
  const environment = String(input?.environment ?? process.env.WHITEBOOKS_ENVIRONMENT ?? "sandbox") === "production" ? "production" : "sandbox";
  const purpose = String(input?.purpose ?? "einvoice_eway");
  const endpoint = whiteBooksEndpoint(operation);
  const requestPayload = input?.payload && typeof input.payload === "object" ? input.payload as Record<string, unknown> : buildCompliancePayload(entry, operation);
  const operationId = newId();
  await app.masterDbPool.execute(
    `INSERT INTO tenant_entry_compliance_operations
      (tenant_id, entry_id, operation_id, environment, purpose, operation, endpoint, status, request_json, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [tenantId, entry.entryId, operationId, environment, purpose, operation, endpoint, JSON.stringify(requestPayload), actorEmail],
  );
  try {
    const providerResponse = await callWhiteBooks(operation, environment, requestPayload);
    const document = complianceDocumentFromResponse(operation, entry, providerResponse);
    await updateEntryCompliance(app, tenantId, entry.entryType, entry.entryId, document, actorEmail);
    await app.masterDbPool.execute(
      `UPDATE tenant_entry_compliance_operations SET status = 'success', response_json = ? WHERE tenant_id = ? AND operation_id = ?`,
      [JSON.stringify(providerResponse), tenantId, operationId],
    );
    await addActivity(app, tenantId, entry.entryId, operation, actorEmail, complianceActivityMessage(operation, document), { provider: "whitebooks", environment, operationId });
    return { document, provider: { key: "whitebooks", environment, baseUrl: whiteBooksBaseUrl(environment), endpoint } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "WhiteBooks request failed";
    await app.masterDbPool.execute(
      `UPDATE tenant_entry_compliance_operations SET status = 'failed', error_message = ? WHERE tenant_id = ? AND operation_id = ?`,
      [message, tenantId, operationId],
    );
    throw AppError.validation(message);
  }
}

async function updateEntryCompliance(app: FastifyInstance, tenantId: string, kind: EntryKind, entryId: string, document: ComplianceDocument, actorEmail: string) {
  await app.masterDbPool.execute(
    `UPDATE tenant_entry_documents SET
      irn = COALESCE(?, irn), ack_no = COALESCE(?, ack_no), ack_date = COALESCE(?, ack_date), signed_qr = COALESCE(?, signed_qr),
      eway_bill_no = COALESCE(?, eway_bill_no), eway_bill_date = COALESCE(?, eway_bill_date),
      transport_name = COALESCE(?, transport_name), vehicle_no = COALESCE(?, vehicle_no), eway_part = COALESCE(?, eway_part),
      compliance_json = ?, updated_by = ?
     WHERE tenant_id = ? AND entry_type = ? AND entry_id = ?`,
    [
      clean(document.irn), clean(document.ackNo), cleanDate(document.ackDate), clean(document.signedQr),
      clean(document.ewayBillNo), cleanDate(document.ewayBillDate), clean(document.transportName), clean(document.vehicleNo),
      clean(document.ewayPart), JSON.stringify(document), actorEmail, tenantId, kind, entryId,
    ],
  );
}

type WhiteBooksOperation = "generateIrn" | "generateEwaybillByIrn" | "cancelIrn" | "cancelEwaybill";
type ComplianceDocument = {
  irn?: string | null;
  ackNo?: string | null;
  ackDate?: string | null;
  signedQr?: string | null;
  ewayBillNo?: string | null;
  ewayBillDate?: string | null;
  transportName?: string | null;
  vehicleNo?: string | null;
  ewayPart?: string | null;
};

function whiteBooksOperation(action: string): WhiteBooksOperation {
  const normalized = action.trim().toLowerCase();
  if (["generate-irn", "generateirn", "einvoice"].includes(normalized)) return "generateIrn";
  if (["generate-eway", "generateeway", "generate-eway-by-irn", "eway"].includes(normalized)) return "generateEwaybillByIrn";
  if (["cancel-irn", "cancel-einvoice"].includes(normalized)) return "cancelIrn";
  if (["cancel-eway", "cancel-ewaybill"].includes(normalized)) return "cancelEwaybill";
  throw AppError.validation("Unsupported WhiteBooks compliance action");
}

function whiteBooksEndpoint(operation: WhiteBooksOperation) {
  const endpoints: Record<WhiteBooksOperation, string> = {
    generateIrn: "/einvoice/type/GENERATE/version/V1_03",
    generateEwaybillByIrn: "/einvoice/type/GENERATE_EWAYBILL/version/V1_03",
    cancelIrn: "/einvoice/type/CANCEL/version/V1_03",
    cancelEwaybill: "/einvoice/type/CANCEL_EWAYBILL/version/V1_03",
  };
  return endpoints[operation];
}

function whiteBooksBaseUrl(environment: "sandbox" | "production") {
  if (environment === "production") return process.env.WHITEBOOKS_BASE_URL || "https://api.whitebooks.in";
  return process.env.WHITEBOOKS_SANDBOX_BASE_URL || "https://apisandbox.whitebooks.in";
}

async function callWhiteBooks(operation: WhiteBooksOperation, environment: "sandbox" | "production", payload: Record<string, unknown>) {
  const clientId = process.env.WHITEBOOKS_CLIENT_ID;
  const clientSecret = process.env.WHITEBOOKS_CLIENT_SECRET;
  const gstin = process.env.WHITEBOOKS_GSTIN;
  const username = process.env.WHITEBOOKS_USERNAME;
  const password = process.env.WHITEBOOKS_PASSWORD;
  const email = process.env.WHITEBOOKS_EMAIL;
  if (!clientId || !clientSecret || !gstin || !username || !password || !email) {
    return simulatedWhiteBooksResponse(operation, payload);
  }
  const authToken = await authenticateWhiteBooks(environment, { clientId, clientSecret, email, gstin, password, username });
  const url = new URL(whiteBooksEndpoint(operation), whiteBooksBaseUrl(environment));
  url.searchParams.set("email", email);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      "auth-token": authToken,
      client_id: clientId,
      client_secret: clientSecret,
      gstin,
      username,
      ip_address: process.env.WHITEBOOKS_IP_ADDRESS ?? "127.0.0.1",
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`WhiteBooks ${operation} failed with status ${response.status}`);
  return data as Record<string, unknown>;
}

async function authenticateWhiteBooks(environment: "sandbox" | "production", settings: { clientId: string; clientSecret: string; email: string; gstin: string; password: string; username: string }) {
  const url = new URL("/einvoice/authenticate", whiteBooksBaseUrl(environment));
  url.searchParams.set("email", settings.email);
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      client_id: settings.clientId,
      client_secret: settings.clientSecret,
      gstin: settings.gstin,
      username: settings.username,
      password: settings.password,
      ip_address: process.env.WHITEBOOKS_IP_ADDRESS ?? "127.0.0.1",
    },
  });
  const data = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(`WhiteBooks authenticate failed with status ${response.status}`);
  const token = findAuthToken(data);
  if (!token) throw new Error("WhiteBooks authentication response did not include an auth token.");
  return token;
}

function findAuthToken(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  for (const key of ["AuthToken", "authToken", "auth-token", "token"]) {
    const token = stringFrom(record[key]);
    if (token) return token;
  }
  for (const nestedKey of ["data", "Data", "response"]) {
    const token = findAuthToken(record[nestedKey]);
    if (token) return token;
  }
  return null;
}

function simulatedWhiteBooksResponse(operation: WhiteBooksOperation, payload: Record<string, unknown>) {
  const seed = String(payload.DocDt ?? payload.Dt ?? Date.now()).replace(/\D/g, "").slice(-6) || String(Date.now()).slice(-6);
  if (operation === "generateEwaybillByIrn") return { data: { EwbNo: `WB${seed}01`, EwbDt: today() }, mode: "simulated" };
  if (operation === "cancelIrn" || operation === "cancelEwaybill") return { data: { cancelled: true }, mode: "simulated" };
  return {
    data: {
      Irn: `IRN${seed}${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
      AckNo: `${Date.now()}`.slice(-12),
      AckDt: today(),
      SignedQRCode: `WHITEBOOKS-SIGNED-QR-${seed}`,
    },
    mode: "simulated",
  };
}

function complianceDocumentFromResponse(operation: WhiteBooksOperation, entry: Awaited<ReturnType<typeof hydrateEntry>>, response: Record<string, unknown>): ComplianceDocument {
  const data = (response.data && typeof response.data === "object" ? response.data : response) as Record<string, unknown>;
  if (operation === "generateEwaybillByIrn") {
    return {
      ewayBillNo: stringFrom(data.EwbNo ?? data.ewayBillNo ?? data.EWayBillNo),
      ewayBillDate: normalizeComplianceDate(data.EwbDt ?? data.ewayBillDate ?? today()),
      transportName: entry.transportName,
      vehicleNo: entry.vehicleNo,
      ewayPart: entry.transportName ? "part-a" : "part-b",
    };
  }
  if (operation === "cancelIrn" || operation === "cancelEwaybill") return {};
  return {
    irn: stringFrom(data.Irn ?? data.irn),
    ackNo: stringFrom(data.AckNo ?? data.ackNo),
    ackDate: normalizeComplianceDate(data.AckDt ?? data.ackDate ?? today()),
    signedQr: stringFrom(data.SignedQRCode ?? data.SignedQr ?? data.signedQr),
  };
}

function buildCompliancePayload(entry: Awaited<ReturnType<typeof hydrateEntry>>, operation: WhiteBooksOperation) {
  if (operation === "generateEwaybillByIrn") {
    return {
      Irn: entry.irn ?? "",
      Distance: 100,
      TransMode: "1",
      TransName: entry.transportName ?? "",
      TransDocDt: formatGstPortalDate(entry.documentDate),
      TransDocNo: entry.documentNo,
      VehNo: entry.vehicleNo ?? "",
      VehType: "R",
    };
  }
  return {
    Version: "1.1",
    TranDtls: { TaxSch: "GST", SupTyp: "B2B", RegRev: "N", IgstOnIntra: "N" },
    DocDtls: { Typ: "INV", No: entry.documentNo, Dt: formatGstPortalDate(entry.documentDate) },
    BuyerDtls: { Gstin: entry.partyGstin ?? "", LglNm: entry.partyName, Pos: entry.partyStateCode ?? "33", Addr1: entry.billingAddress ?? "", Loc: entry.partyStateName ?? "Tamil Nadu", Pin: 641607, Stcd: entry.partyStateCode ?? "33" },
    ItemList: entry.lines.map((line, index) => ({
      SlNo: String(index + 1),
      PrdDesc: line.productName,
      IsServc: "N",
      HsnCd: line.hsnCode ?? "",
      Qty: line.quantity,
      Unit: line.unit ?? "NOS",
      UnitPrice: line.rate,
      TotAmt: round(line.quantity * line.rate),
      Discount: line.discountAmount,
      AssAmt: round(Math.max(0, line.quantity * line.rate - line.discountAmount)),
      GstRt: line.taxRate,
      TotItemVal: line.lineTotal,
    })),
    ValDtls: { AssVal: entry.taxableTotal, CgstVal: entry.taxTotal / 2, SgstVal: entry.taxTotal / 2, IgstVal: 0, TotInvVal: entry.grandTotal },
  };
}

function complianceActivityMessage(operation: WhiteBooksOperation, document: ComplianceDocument) {
  if (operation === "generateEwaybillByIrn") return `E-way bill generated${document.ewayBillNo ? `: ${document.ewayBillNo}` : ""}`;
  if (operation === "cancelIrn") return "E-invoice cancellation requested";
  if (operation === "cancelEwaybill") return "E-way bill cancellation requested";
  return `E-invoice generated${document.irn ? `: ${document.irn}` : ""}`;
}

function entryToolMessage(tool: string, value: string | null) {
  const labels: Record<string, string> = {
    email: "Send to Email",
    assign: "Assign",
    attachments: "Attachment",
    tags: "Tag",
    whatsapp: "Send to WhatsApp",
    downloadPdf: "Download PDF",
  };
  return `${labels[tool] ?? tool}${value ? `: ${value}` : ""}`;
}

function stringFrom(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizeComplianceDate(value: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return today();
  const slashDate = text.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashDate) return `${slashDate[3]}-${slashDate[2]}-${slashDate[1]}`;
  return cleanDate(text) ?? today();
}

function formatGstPortalDate(value: unknown) {
  const normalized = cleanDate(value) ?? today();
  const [year, month, day] = normalized.split("-");
  return `${day}/${month}/${year}`;
}

function parseEntryKind(value: string): EntryKind {
  const normalized = value === "quotations"
    ? "quotation"
    : value === "export-sales" || value === "export_sales" || value === "exportsales" || value === "exportSales"
      ? "exportSales"
      : value === "purchases"
        ? "purchase"
        : value === "receipts"
          ? "receipt"
          : value === "payments"
            ? "payment"
            : value;
  if (!entryKinds.has(normalized as EntryKind)) throw AppError.notFound("Entry module not found");
  return normalized as EntryKind;
}

function normalizeLines(lines: EntryLineInput[]): Required<EntryLineInput>[] {
  return lines
    .filter((line) => String(line.productName ?? "").trim())
    .map((line) => ({
      lineId: line.lineId || newId(),
      productId: line.productId ?? null,
      productName: String(line.productName ?? "").trim(),
      description: line.description ?? null,
      colour: line.colour ?? null,
      hsnCode: line.hsnCode ?? null,
      poNo: line.poNo ?? null,
      dcNo: line.dcNo ?? null,
      size: line.size ?? null,
      unit: line.unit ?? null,
      quantity: positiveNumber(line.quantity, 1),
      rate: numberValue(line.rate),
      discountAmount: numberValue(line.discountAmount),
      taxRate: numberValue(line.taxRate),
    }));
}

function normalizeAllocations(allocations: EntryAllocationInput[]): Required<EntryAllocationInput>[] {
  return allocations
    .filter((allocation) => String(allocation.documentNo ?? "").trim())
    .map((allocation) => ({
      allocationId: allocation.allocationId || newId(),
      documentType: allocation.documentType || "document",
      documentId: allocation.documentId ?? null,
      documentNo: String(allocation.documentNo ?? "").trim(),
      documentDate: allocation.documentDate ?? null,
      documentTotal: numberValue(allocation.documentTotal),
      previousBalance: numberValue(allocation.previousBalance),
      allocatedAmount: numberValue(allocation.allocatedAmount),
    }));
}

function calculateLineTotals(input: EntryInput, lines: Required<EntryLineInput>[]) {
  const subtotal = round(lines.reduce((sum, line) => sum + line.quantity * line.rate, 0));
  const discountTotal = round(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const taxableTotal = round(lines.reduce((sum, line) => sum + Math.max(0, line.quantity * line.rate - line.discountAmount), 0));
  const taxTotal = round(lines.reduce((sum, line) => sum + Math.max(0, line.quantity * line.rate - line.discountAmount) * line.taxRate / 100, 0));
  const roundOff = numberValue(input.roundOff);
  const grandTotal = round(taxableTotal + taxTotal + roundOff);
  const paidAmount = numberValue(input.paidAmount);
  const balanceAmount = round(grandTotal - paidAmount);
  return {
    subtotal,
    discountTotal,
    taxableTotal,
    taxTotal,
    roundOff,
    grandTotal,
    paidAmount,
    balanceAmount,
    amount: 0,
    tdsAmount: 0,
    netAmount: 0,
    allocatedAmount: 0,
    unallocatedAmount: 0,
    paymentStatus: paidAmount <= 0 ? "unpaid" : paidAmount >= grandTotal ? "paid" : "partial",
  };
}

function calculateAllocationTotals(input: EntryInput, allocations: Required<EntryAllocationInput>[]) {
  const amount = numberValue(input.amount);
  const discountTotal = numberValue(input.discountTotal);
  const tdsAmount = numberValue(input.tdsAmount);
  const roundOff = numberValue(input.roundOff);
  const allocatedAmount = round(allocations.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0));
  const netAmount = round(amount - tdsAmount - discountTotal + roundOff);
  const unallocatedAmount = round(netAmount - allocatedAmount);
  return {
    subtotal: 0,
    discountTotal,
    taxableTotal: 0,
    taxTotal: 0,
    roundOff,
    grandTotal: netAmount,
    paidAmount: amount,
    balanceAmount: unallocatedAmount,
    amount,
    tdsAmount,
    netAmount,
    allocatedAmount,
    unallocatedAmount,
    paymentStatus: "paid",
  };
}

function responseMeta(request: { correlationId?: string; id: string; tenantId?: string }) {
  return {
    requestId: request.id,
    ...(request.correlationId ? { correlationId: request.correlationId } : {}),
    ...(request.tenantId ? { tenantId: request.tenantId } : {}),
  };
}

function entryLabel(kind: EntryKind) {
  if (kind === "exportSales") return "Export Sales";
  return kind[0]!.toUpperCase() + kind.slice(1);
}

function partyLabel(kind: EntryKind) {
  if (kind === "purchase" || kind === "payment") return "Supplier";
  if (kind === "receipt") return "Party";
  return "Customer";
}

function defaultPartyType(kind: EntryKind) {
  return kind === "purchase" || kind === "payment" ? "supplier" : "customer";
}

function defaultTerms(kind: EntryKind) {
  if (kind === "purchase") return "Supplier bill accepted subject to goods, rate, quantity, and quality verification.";
  if (kind === "exportSales") return "Export goods once dispatched will not be taken back unless agreed in writing.";
  if (kind === "quotation" || kind === "sales") return "Goods once sold will not be taken back unless agreed in writing.";
  return "";
}

function clean(value: unknown) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

function cleanDate(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;
  if (!/\b\d{4}\b/.test(text)) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function numberValue(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function positiveNumber(value: unknown, fallback: number) {
  const parsed = numberValue(value);
  return parsed > 0 ? parsed : fallback;
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function dateOnly(value: unknown) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function isoValue(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

function jsonValue(value: unknown) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return {};
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sqlNow() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
