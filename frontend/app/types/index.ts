/**
 * Theme configuration shape returned by the theme API.
 */
export interface ThemeConfig {
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  border: string;
  destructive: string;
  destructiveForeground: string;
  success: string;
}

export type ThemeContextValue = {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
};

/**
 * User shape returned by the auth session helpers.
 */
import { UserRole } from "~/types/rbac";

export interface User {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  orgId: string | null;
  role: UserRole;
  pictureUrl?: string;
}


/* ───────── Assessment & Related Models ───────── */

export interface Assessment {
  id: string;
  organization: string;
  site?: string;
  template?: string;
  focus_area?: string;
  status: "DRAFT" | "IN_PROGRESS" | "UNDER_REVIEW" | "COMPLETED" | "ARCHIVED";
  framework?: string;
  start_date: string;
  due_date: string;
  completed_at?: string;
  overall_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ai_summary: string;
  created_by?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAssessmentInput {
  site?: string;
  focus_area?: string;
  framework?: string;
  status?: string;
  start_date: string;
  due_date: string;
  risk_level?: string;
  ai_summary?: string;
}

export interface Finding {
  id: string;
  organization: string;
  report?: string;
  assessment?: string;
  site?: string;
  provision?: string;
  topic: string;
  summary: string;
  recommended_actions: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "WAIVED";
  responsible_party: string;
  supplier_response: string;
  assessor_comments: string;
  marked_as_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentReport {
  id: string;
  organization: string;
  assessment: string;
  title: string;
  status: string;
  executive_summary: string;
  methodology: string;
  scope: string;
  created_at: string;
  updated_at: string;
}

export interface AssessmentPlan {
  id: string;
  organization: string;
  assessment: string;
  site_assessment_start: string;
  site_assessment_end: string;
  draft_report_deadline: string;
  final_report_deadline?: string;
  opening_meeting_date?: string;
  closing_meeting_date?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CIPCycle {
  id: string;
  organization: string;
  assessment: string;
  label: string;
  deadline_period_months: number;
  start_date: string;
  end_date?: string;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  organization: string;
  assessment?: string;
  focus_area?: string;
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Framework {
  id: string;
  name: string;
  version: string;
  description: string;
  categories: Record<string, string>;
  scoring_methodology: Record<string, string>;
  reporting_period: string;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  organization: string;
  name: string;
  type: string;
  country_code: string;
  region: string;
  coordinates: Record<string, number>;
  operational_status: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ESGFocusArea {
  id: string;
  organization: string;
  name: string;
  internal_label: string;
  description: string;
  current_score: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentFullDetail {
  assessment: Assessment;
  report: AssessmentReport | null;
  findings: Finding[];
  plan: AssessmentPlan | null;
  cip_cycles: CIPCycle[];
  tasks: Task[];
}

