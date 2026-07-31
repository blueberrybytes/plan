import { repairMermaidSyntax, normalizeGanttMilestones } from "./mermaidUtils";

describe("repairMermaidSyntax — quotes inside labels", () => {
  // Regression: the AI emitted `B{AI Agent "Berry"}`. Mermaid's lexer reads the
  // inner `"` as the start of a STR token and crashes expecting DIAMOND_STOP.
  // Neither the step-0 escape (which only matches a quote directly after the
  // bracket) nor FORBIDDEN_IN_LABEL caught it, so it reached the parser raw.
  it("quotes a rhombus label containing a quoted name", () => {
    const repaired = repairMermaidSyntax('graph TD\n    A --> B{AI Agent "Berry"}');
    expect(repaired).toContain(`B{"AI Agent 'Berry'"}`);
  });

  it("handles the same case in every shape", () => {
    expect(repairMermaidSyntax('graph TD\n    A[Agent "Berry"]')).toContain(`A["Agent 'Berry'"]`);
    expect(repairMermaidSyntax('graph TD\n    A(Agent "Berry")')).toContain(`A("Agent 'Berry'")`);
    expect(repairMermaidSyntax('graph TD\n    A[[Agent "Berry"]]')).toContain(
      `A[["Agent 'Berry'"]]`,
    );
  });

  it("quotes an edge label containing a quote", () => {
    const repaired = repairMermaidSyntax('graph TD\n    A -->|says "hi"| B');
    expect(repaired).toContain(`|"says 'hi'"|`);
  });

  it("leaves an already-quoted label untouched", () => {
    const chart = 'graph TD\n    A["Menu (Client)"] --> B';
    expect(repairMermaidSyntax(chart)).toBe(chart);
  });

  it("leaves a plain unquoted label unquoted", () => {
    const chart = "graph TD\n    A[User DB] --> B";
    expect(repairMermaidSyntax(chart)).toBe(chart);
  });

  it("does not touch non-flowchart diagrams", () => {
    // xychart arrays legitimately carry quotes — repairing them corrupts the source.
    const chart = 'xychart-beta\n    x-axis ["Jan", "Feb"]';
    expect(repairMermaidSyntax(chart)).toBe(chart);
  });
});

describe("normalizeGanttMilestones — zero-duration tasks become visible milestones", () => {
  // Regression: a real "Cronología de Hitos" rendered mostly-blank because every
  // milestone was written as a same-day task (`:done, D, D`) → zero-width bar.
  // Verified in the live mermaid renderer: converting to `milestone` yields a
  // visible diamond at the date.
  it("converts a same-day task (with status) to a milestone", () => {
    const line = "    Integración Cloud Code y GitHub :done, 2026-06-05, 2026-06-05";
    expect(normalizeGanttMilestones(line)).toBe(
      "    Integración Cloud Code y GitHub : milestone, 2026-06-05, 0d",
    );
  });

  it("converts a same-day task that carries an explicit id", () => {
    const line = "    Hito :done, hitoId, 2026-06-05, 2026-06-05";
    expect(normalizeGanttMilestones(line)).toBe("    Hito : milestone, 2026-06-05, 0d");
  });

  it("leaves real-duration tasks untouched", () => {
    for (const line of [
      "    Definición Roles :active, 2026-07-31, 2026-08-07",
      "    Investigación :active, invId, 2026-07-31, 2026-08-07",
      "    Reunión :crit, after invId, 3d",
      "    Plan :active, 2026-08-01, 2026-08-14",
    ]) {
      expect(normalizeGanttMilestones(line)).toBe(line);
    }
  });

  it("never disturbs non-task lines", () => {
    const header = "gantt\n    dateFormat YYYY-MM-DD\n    title Cronología\n    section Fase Inicial";
    expect(normalizeGanttMilestones(header)).toBe(header);
  });

  it("is applied automatically when repairing a gantt chart", () => {
    const chart =
      "gantt\n    dateFormat YYYY-MM-DD\n    Uno :done, 2026-06-05, 2026-06-05\n    Dos :active, 2026-07-31, 2026-08-07";
    const repaired = repairMermaidSyntax(chart);
    expect(repaired).toContain("Uno : milestone, 2026-06-05, 0d");
    expect(repaired).toContain("Dos :active, 2026-07-31, 2026-08-07");
  });
});
