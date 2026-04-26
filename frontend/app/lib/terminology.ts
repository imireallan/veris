import type { OrganizationTerminology, User } from "~/types";

export type TerminologyKey = "assessment" | "site" | "task" | "evidence" | "report";

export type TerminologyLabels = Record<TerminologyKey, string> & {
  plural: Record<TerminologyKey, string>;
};

export const DEFAULT_TERMINOLOGY: Required<
  Pick<
    OrganizationTerminology,
    "assessment_label" | "site_label" | "task_label" | "evidence_label" | "report_label"
  >
> = {
  assessment_label: "Assessment",
  site_label: "Site",
  task_label: "Task",
  evidence_label: "Evidence",
  report_label: "Report",
};

function cleanLabel(value: string | undefined | null, fallback: string): string {
  const label = value?.trim();
  return label || fallback;
}

export function pluralizeLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return trimmed;

  const words = trimmed.split(/\s+/);
  const last = words[words.length - 1];
  const lower = last.toLowerCase();

  if (lower === "evidence") return trimmed;
  if (/[sxz]$/i.test(last) || /(ch|sh)$/i.test(last)) {
    words[words.length - 1] = `${last}es`;
    return words.join(" ");
  }
  if (/[^aeiou]y$/i.test(last)) {
    words[words.length - 1] = `${last.slice(0, -1)}ies`;
    return words.join(" ");
  }
  if (/s$/i.test(last)) return trimmed;

  words[words.length - 1] = `${last}s`;
  return words.join(" ");
}

export function lowerFirst(value: string): string {
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

export function resolveTerminology(
  terminology?: OrganizationTerminology | null,
): TerminologyLabels {
  const assessment = cleanLabel(
    terminology?.assessment_label,
    DEFAULT_TERMINOLOGY.assessment_label,
  );
  const site = cleanLabel(terminology?.site_label, DEFAULT_TERMINOLOGY.site_label);
  const task = cleanLabel(terminology?.task_label, DEFAULT_TERMINOLOGY.task_label);
  const evidence = cleanLabel(
    terminology?.evidence_label,
    DEFAULT_TERMINOLOGY.evidence_label,
  );
  const report = cleanLabel(terminology?.report_label, DEFAULT_TERMINOLOGY.report_label);

  return {
    assessment,
    site,
    task,
    evidence,
    report,
    plural: {
      assessment: pluralizeLabel(assessment),
      site: pluralizeLabel(site),
      task: pluralizeLabel(task),
      evidence: pluralizeLabel(evidence),
      report: pluralizeLabel(report),
    },
  };
}

export function terminologyFromUser(user?: User | null): TerminologyLabels {
  return resolveTerminology(user?.activeTerminology ?? null);
}
