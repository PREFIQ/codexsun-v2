import { expect, test, type Page } from "@playwright/test"
import { readFileSync } from "node:fs"
import { writeFileSync } from "node:fs"
import { join } from "node:path"

test("work and automation drill-down keeps references, timeline, and gantt in scope", async ({ page }) => {
  const browserErrors: string[] = []
  const failedResponses: string[] = []
  collectBrowserErrors(page, browserErrors)
  collectFailedResponses(page, failedResponses)

  await loginAsSuperAdmin(page)
  await page.goto("/sa/project-manager-work")
  await page.waitForLoadState("networkidle")

  const automationIssueTitle = "Complete TENANTS Foundation registry coverage"
  const automationIssueKey = "issue.platform-registry.foundation-coverage"
  const automationTaskTitle = "Complete TENANTS Foundation registry coverage - task"

  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible()
  await expect(page.getByRole("button", { name: automationIssueTitle, exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Tasks" })).toHaveCount(0)
  await page.getByRole("button", { name: "New issues" }).click()
  await expect(page.getByText("Reference no")).toBeVisible()
  await expect(page.getByRole("textbox").nth(1)).toHaveValue("002")
  await page.getByRole("button", { name: "Cancel" }).first().click()
  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible()

  await page.getByRole("button", { name: "001", exact: true }).click()
  await expect(page.getByRole("heading", { name: automationIssueTitle })).toBeVisible()
  await expect(page.getByRole("button", { name: "Task" })).toBeVisible()
  await page.getByRole("button", { name: "Cancel" }).first().click()
  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible()

  await page.getByRole("button", { name: `${automationIssueTitle} actions` }).click()
  await page.getByRole("menuitem", { name: "Ask AI" }).click()
  await expect(page.getByText("Queued for AI")).toBeVisible()
  await expect.poll(() => readFileSync(join(process.cwd(), "apps/platform/api/project-manager-json/automation.md"), "utf8")).toContain(`## Issue: ${automationIssueKey}`)
  await expect.poll(() => readFileSync(join(process.cwd(), "apps/platform/api/project-manager-json/automation.md"), "utf8")).toContain("Reference no: `001`")
  cleanupAutomation001Queue()

  await page.getByRole("button", { name: automationIssueTitle, exact: true }).click()
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible()
  await expect(page.getByRole("button", { name: automationTaskTitle, exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Implement Foundation registry coverage from platform registry review", exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Reviews" }).click()
  await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Review Foundation registry coverage", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Review automation 001 tenant foundation completion", exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Automation", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Automation" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Validate Foundation registry coverage", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Verify automation 001 tenant UI flow", exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Activity", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Foundation registry coverage completed", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Automation 001 completed live", exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Timeline" }).click()
  await expect(page.getByRole("heading", { name: "Timeline" })).toBeVisible()
  await expect(page.getByText("Foundation registry coverage completed").first()).toBeVisible()
  await expect(page.getByText("Automation 001 completed live").first()).toBeVisible()

  await page.getByRole("button", { name: "Gantt" }).click()
  await expect(page.getByRole("heading", { name: "Gantt" })).toBeVisible()
  await expect(page.getByText(`Issue: ${automationIssueTitle}`)).toBeVisible()
  await expect(page.getByText(`Task: ${automationTaskTitle}`)).toBeVisible()
  await expect(page.getByText("Automation 001 completed live")).toBeVisible()

  await page.getByRole("button", { name: "Issues" }).click()
  await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible()
  await expect(page.getByRole("button", { name: automationIssueTitle, exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Tasks" })).toHaveCount(0)

  await verifyRandomWorkflowPersistence(page)
  await verifyStandaloneDiscussions(page)
  await verifyPlatformRegistryIssueBridge(page)

  expect(failedResponses).toEqual([])
  expect(browserErrors.filter((message) => !message.includes("Failed to load resource"))).toEqual([])
})

async function verifyRandomWorkflowPersistence(page: Page) {
  const suffix = Date.now().toString(36)
  const keys = {
    issue: `e2e-issue-${suffix}`,
    task: `e2e-task-${suffix}`,
    review: `e2e-review-${suffix}`,
    automation: `e2e-automation-${suffix}`,
    activity: `e2e-activity-${suffix}`
  }
  const titles = {
    issue: `E2E Issue ${suffix}`,
    task: `E2E Task ${suffix}`,
    review: `E2E Review ${suffix}`,
    automation: `E2E Automation ${suffix}`,
    activity: `E2E Activity ${suffix}`
  }
  const created: Array<{ id: string; kind: string }> = []

  try {
    assertProjectManagerJsonReadable()
    const issue = await apiPostFromPage(page, "issues", maturityPayload(keys.issue, titles.issue, "", "", "enhancement", "in-progress"))
    created.push({ id: issue.id, kind: "issues" })
    const task = await apiPostFromPage(page, "tasks", maturityPayload(keys.task, titles.task, keys.issue, "issue", "task", "assigned"))
    created.push({ id: task.id, kind: "tasks" })
    const review = await apiPostFromPage(page, "reviews", maturityPayload(keys.review, titles.review, keys.task, "task", "review", "requested"))
    created.push({ id: review.id, kind: "reviews" })
    const automation = await apiPostFromPage(page, "automations", maturityPayload(keys.automation, titles.automation, keys.review, "review", "automation", "ready"))
    created.push({ id: automation.id, kind: "automations" })
    const activity = await apiPostFromPage(page, "activities", maturityPayload(keys.activity, titles.activity, keys.automation, "automation", "activity", "completed"))
    created.push({ id: activity.id, kind: "activities" })

    expect(readJsonFile("issue-board.json").some((record) => record.key === keys.issue)).toBeTruthy()
    expect(readJsonFile("task-registry.json").some((record) => record.key === keys.task && record.referenceId === keys.issue)).toBeTruthy()
    expect(readJsonFile("review-registry.json").some((record) => record.key === keys.review && record.referenceId === keys.task)).toBeTruthy()
    expect(readJsonFile("automation-registry.json").some((record) => record.key === keys.automation && record.referenceId === keys.review)).toBeTruthy()
    expect(readJsonFile("activity-registry.json").some((record) => record.key === keys.activity && record.referenceId === keys.automation)).toBeTruthy()

    await page.reload()
    await page.waitForLoadState("networkidle")
    await expect(page.getByRole("heading", { name: "Issues" })).toBeVisible()
    await page.getByPlaceholder("Search issues").fill(titles.issue)
    await expect(page.getByRole("button", { name: titles.issue, exact: true })).toBeVisible()
    await page.getByRole("button", { name: titles.issue, exact: true }).click()

    await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible()
    await expect(page.getByRole("button", { name: titles.task, exact: true })).toBeVisible()
    await page.getByRole("button", { name: titles.task, exact: true }).click()

    await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible()
    await expect(page.getByRole("button", { name: titles.review, exact: true })).toBeVisible()
    await page.getByRole("button", { name: titles.review, exact: true }).click()

    await expect(page.getByRole("heading", { name: "Automation" })).toBeVisible()
    await expect(page.getByRole("button", { name: titles.automation, exact: true })).toBeVisible()
    await page.getByRole("button", { name: titles.automation, exact: true }).click()

    await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible()
    await expect(page.getByRole("button", { name: titles.activity, exact: true })).toBeVisible()

    await page.getByRole("button", { name: "Timeline" }).click()
    await expect(page.getByText(`Issue created: ${titles.issue}`)).toBeVisible()
    await expect(page.getByText(`Task planned: ${titles.task}`)).toBeVisible()
    await expect(page.getByText(`Review created: ${titles.review}`)).toBeVisible()
    await expect(page.getByText(`Automation prepared: ${titles.automation}`)).toBeVisible()
    await expect(page.getByText(`Activity recorded: ${titles.activity}`)).toBeVisible()

    await page.getByRole("button", { name: "Gantt" }).click()
    await expect(page.getByText(`Issue: ${titles.issue}`)).toBeVisible()
    await expect(page.getByText(`Task: ${titles.task}`)).toBeVisible()
    await expect(page.getByText(`Review: ${titles.review}`)).toBeVisible()
    await expect(page.getByText(`Activity: ${titles.activity}`)).toBeVisible()
  } finally {
    for (const item of created.reverse()) {
      await apiDeleteFromPage(page, item.kind, item.id).catch(() => undefined)
    }
    cleanupRandomWorkflowArtifacts(suffix)
  }
}

async function verifyStandaloneDiscussions(page: Page) {
  await page.goto("/sa/project-manager-discussions")
  await page.waitForLoadState("networkidle")
  await expect(page.getByRole("heading", { name: "Discussions" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Discussion", exact: true })).toBeVisible()
  await expect(page.getByRole("button", { name: "Reviews" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "001", exact: true })).toBeVisible()
}

async function verifyPlatformRegistryIssueBridge(page: Page) {
  cleanupRegistryRaisedIssues()
  await page.goto("/sa/platform-registry")
  await page.waitForLoadState("networkidle")
  await expect(page.getByRole("heading", { name: "Platform Registry" })).toBeVisible()

  await page.getByRole("button", { name: "SUPER ADMIN", exact: true }).click()
  await expect(page.getByRole("heading", { name: "SUPER ADMIN Module Groups" })).toBeVisible()
  await page.getByRole("table").getByRole("button", { name: "Project Manager", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Project Manager Module Registry" })).toBeVisible()
  await page.getByRole("table").getByRole("button", { name: "Platform Registry", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Platform Registry" })).toBeVisible()

  await page.getByRole("button", { name: "Feature Registry" }).click()
  await expect(page.getByRole("heading", { name: "Feature Registry" })).toBeVisible()
  await page.getByRole("button", { name: "Feature registry actions" }).click()
  await page.getByRole("menuitem", { name: "Raise issue" }).click()
  await expect(page.getByText("Issue raised")).toBeVisible()
  await expect.poll(() => readJsonFile("issue-board.json").some((record) => record.referenceId === "feature-registry" && record.referenceType === "feature")).toBeTruthy()

  await page.getByRole("button", { name: "Planning" }).click()
  await expect(page.getByText("Planned")).toBeVisible()
  await expect(page.getByText("Ready")).toBeVisible()
  await expect(page.getByText("Blocked / review")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Model Notes" })).toHaveCount(0)
  await page.getByRole("button", { name: "New work item" }).click()
  await expect(page.getByText("Acceptance criteria")).toBeVisible()
  await expect(page.getByText("Risks / blockers")).toBeVisible()
  await expect(page.getByText("Validation plan")).toBeVisible()
  await page.getByRole("button", { name: "Cancel" }).last().click()
  await page.getByRole("button", { name: "Model Notes" }).click()
  await expect(page.getByRole("heading", { name: "Model Notes" })).toBeVisible()
  await expect(page.getByRole("button", { name: "New model note" })).toBeVisible()

  cleanupRegistryRaisedIssues()
}

async function loginAsSuperAdmin(page: Page) {
  await page.goto("/sa/login")
  await page.getByLabel("Email").fill("sundar@sundar.com")
  await page.getByLabel("Password").fill("Kalarani1")
  await page.getByRole("button", { name: /Sign in/i }).click()
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible()
}

function maturityPayload(key: string, title: string, referenceId: string, referenceType: string, type: string, status: string) {
  return {
    active: true,
    assignee: "E2E",
    endDate: "2026-07-10",
    key,
    moduleGroupKey: "project-manager",
    moduleId: "module-sa-platform-registry",
    moduleKey: "project-manager",
    ownerTeam: "QA",
    platformKey: "super-admin",
    priority: "medium",
    referenceId,
    referenceType,
    reviewer: "E2E",
    richNotes: `<p>${title}</p>`,
    startDate: "2026-07-09",
    status,
    title,
    type
  }
}

async function apiPostFromPage(page: Page, kind: string, payload: Record<string, unknown>) {
  return page.evaluate(async ({ kind: itemKind, payload: body }) => {
    const token = localStorage.getItem("codexsun_session_sa")
    const response = await fetch(`http://127.0.0.1:5510/admin/project-manager/maturity/${itemKind}`, {
      body: JSON.stringify(body),
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      method: "POST"
    })
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
    return (await response.json()).data
  }, { kind, payload })
}

async function apiDeleteFromPage(page: Page, kind: string, id: string) {
  return page.evaluate(async ({ id: recordId, kind: itemKind }) => {
    const token = localStorage.getItem("codexsun_session_sa")
    const response = await fetch(`http://127.0.0.1:5510/admin/project-manager/maturity/${itemKind}/${recordId}`, {
      headers: { Authorization: `Bearer ${token}` },
      method: "DELETE"
    })
    if (!response.ok) throw new Error(`${response.status} ${await response.text()}`)
    return (await response.json()).data
  }, { id, kind })
}

function assertProjectManagerJsonReadable() {
  for (const file of ["issue-board.json", "task-registry.json", "review-registry.json", "automation-registry.json", "activity-registry.json", "timeline-registry.json", "gantt-registry.json", "maturity-result.json"]) {
    expect(Array.isArray(readJsonFile(file)) || file === "maturity-result.json").toBeTruthy()
  }
}

function readJsonFile(file: string): any[] {
  return JSON.parse(readFileSync(join(process.cwd(), "apps/platform/api/project-manager-json", file), "utf8"))
}

function cleanupRandomWorkflowArtifacts(suffix: string) {
  const dir = join(process.cwd(), "apps/platform/api/project-manager-json")
  const keyIncludesSuffix = (record: any) => [record.key, record.referenceId, record.title].some((value) => String(value ?? "").includes(suffix))
  for (const file of ["issue-board.json", "task-registry.json", "review-registry.json", "automation-registry.json", "activity-registry.json", "timeline-registry.json", "gantt-registry.json"]) {
    const path = join(dir, file)
    const records = JSON.parse(readFileSync(path, "utf8")).filter((record: any) => !keyIncludesSuffix(record))
    writeFileSync(path, `${JSON.stringify(records, null, 2)}\n`, "utf8")
  }
  const resultPath = join(dir, "maturity-result.json")
  const result = JSON.parse(readFileSync(resultPath, "utf8"))
  for (const key of ["activity", "automation", "gantt", "issue", "review", "task", "timeline"]) {
    if (Array.isArray(result[key])) result[key] = result[key].filter((record: any) => !keyIncludesSuffix(record))
  }
  result.generatedAt = new Date().toISOString()
  safeWriteFile(resultPath, `${JSON.stringify(result, null, 2)}\n`)
}

function cleanupAutomation001Queue() {
  const dir = join(process.cwd(), "apps/platform/api/project-manager-json")
  const inboxPath = join(dir, "automation.md")
  const inbox = readFileSync(inboxPath, "utf8")
  writeFileSync(inboxPath, inbox.replace(/\n## Issue: issue\.platform-registry\.foundation-coverage\n\n- \[ \] Reference no: `001`\n- \[ \] Stage: Issue\n- \[ \] Title: Complete TENANTS Foundation registry coverage\n- \[ \] Status: closed\n- \[ \] Source: Project Manager \/ Work & Automation\n- \[ \] Requested at: [^\n]+\n\n### Codex Plan\n\n- Read this reference from Project Manager\.\n- Solve or update the related work\.\n- Update Timeline and Gantt after work is done\.\n- Move completed notes into `automation-log\.md` and clean this pending block\.\n/g, ""), "utf8")
  const logPath = join(dir, "automation-log.md")
  writeFileSync(logPath, readFileSync(logPath, "utf8").split(/\r?\n/).filter((line) => !line.includes("| queued | Issue | 001 | issue.platform-registry.foundation-coverage | Complete TENANTS Foundation registry coverage")).join("\n").replace(/\n*$/, "\n"), "utf8")
  const timelinePath = join(dir, "timeline-registry.json")
  const timeline = JSON.parse(readFileSync(timelinePath, "utf8")).filter((record: any) => !(record.eventName === "project_manager.communication.queued" && record.status === "queued"))
  writeFileSync(timelinePath, `${JSON.stringify(timeline, null, 2)}\n`, "utf8")
  const ganttPath = join(dir, "gantt-registry.json")
  const gantt = JSON.parse(readFileSync(ganttPath, "utf8")).map((record: any) => record.key === "gantt.issue.issue.platform-registry.foundation-coverage" ? { ...record, status: "completed", updatedAt: "2026-07-02T15:45:00.000Z" } : record)
  writeFileSync(ganttPath, `${JSON.stringify(gantt, null, 2)}\n`, "utf8")
  refreshMaturityResult()
}

function cleanupRegistryRaisedIssues() {
  const dir = join(process.cwd(), "apps/platform/api/project-manager-json")
  const issuePath = join(dir, "issue-board.json")
  const issues = JSON.parse(readFileSync(issuePath, "utf8")).filter((record: any) => !String(record.key ?? "").startsWith("issue.registry."))
  writeFileSync(issuePath, `${JSON.stringify(issues, null, 2)}\n`, "utf8")
  for (const file of ["timeline-registry.json", "gantt-registry.json"]) {
    const path = join(dir, file)
    const records = JSON.parse(readFileSync(path, "utf8")).filter((record: any) => !JSON.stringify(record).includes("issue.registry."))
    writeFileSync(path, `${JSON.stringify(records, null, 2)}\n`, "utf8")
  }
  refreshMaturityResult()
}

function refreshMaturityResult() {
  const dir = join(process.cwd(), "apps/platform/api/project-manager-json")
  const files = { action: "maturity-action-registry.json", agent_note: "agent-note-registry.json", activity: "activity-registry.json", automation: "automation-registry.json", changelog: "changelog-registry.json", coverage: "coverage-registry.json", discussion: "discussion-registry.json", gantt: "gantt-registry.json", github: "github-registry.json", issue: "issue-board.json", kanban: "kanban-board.json", planning: "planning-registry.json", pull_request: "pull-request-registry.json", release: "release-registry.json", review: "review-registry.json", security_quality: "security-quality-registry.json", task: "task-registry.json", timeline: "timeline-registry.json", todo: "todo-registry.json" }
  const result: Record<string, unknown> = { generatedAt: new Date().toISOString() }
  for (const [key, file] of Object.entries(files)) result[key] = JSON.parse(readFileSync(join(dir, file), "utf8"))
  safeWriteFile(join(dir, "maturity-result.json"), `${JSON.stringify(result, null, 2)}\n`)
}

function safeWriteFile(path: string, content: string) {
  try {
    writeFileSync(path, content, "utf8")
  } catch {
    // The API can briefly hold the derived report snapshot while reconciling JSON.
    // Source registry files are already cleaned; a later API read will rebuild this snapshot.
  }
}

function collectBrowserErrors(page: Page, browserErrors: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text())
  })
  page.on("pageerror", (error) => browserErrors.push(error.message))
}

function collectFailedResponses(page: Page, failedResponses: string[]) {
  page.on("response", (response) => {
    if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`)
  })
}

