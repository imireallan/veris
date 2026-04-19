/**
 * Theme configuration shape returned by the theme API.
 * All color values are HSL strings (e.g., "217 89 51") for CSS variables.
 * Supports both light and dark mode color schemes.
 */
export interface ThemeConfig {
  // Primary colors - light mode
  primary: string;
  primary_foreground: string;
  secondary: string;
  secondary_foreground: string;
  accent: string;
  accent_foreground: string;

  // Surface colors - light mode
  background: string;
  foreground: string;
  muted: string;
  muted_foreground: string;
  card: string;
  card_foreground: string;

  // State colors - light mode
  border: string;
  destructive: string;
  destructive_foreground: string;
  success: string;

  // Primary colors - dark mode
  primary_dark?: string;
  primary_foreground_dark?: string;
  secondary_dark?: string;
  secondary_foreground_dark?: string;
  accent_dark?: string;
  accent_foreground_dark?: string;

  // Surface colors - dark mode
  background_dark?: string;
  foreground_dark?: string;
  muted_dark?: string;
  muted_foreground_dark?: string;
  card_dark?: string;
  card_foreground_dark?: string;

  // State colors - dark mode
  border_dark?: string;
  destructive_dark?: string;
  destructive_foreground_dark?: string;
  success_dark?: string;

  // Branding
  app_name?: string;
  login_title?: string;
  login_subtitle?: string;
  support_email?: string;
  logo_url?: string;
  logo_url_dark?: string;
  favicon_url?: string;
  font_family?: string;
  button_radius?: number;
  custom_css?: string;
  custom_css_dark?: string;
}

export type ThemeContextValue = {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
};

/**
 * Frontend auth / tenant types
 */

export interface ActiveOrganization {
  id: string;
  name: string;
  slug?: string;
}

export interface ActiveMembership {
  role?: string | null;
  fallback_role?: string;
  is_default?: boolean;
  status?: string;
}

export interface OrganizationListItem {
  id: string;
  name: string;
  slug?: string;
  role?: string | null;
  fallback_role?: string;
  status?: string;
  is_default?: boolean;
}

export type User = {
  id: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  pictureUrl?: string;

  // Flattened convenience fields for UI compatibility
  orgId: string | null;
  orgName?: string;
  role: string;
  fallbackRole?: string;

  // Active tenant context
  activeOrganization?: ActiveOrganization | null;
  activeMembership?: ActiveMembership | null;
  activePermissions?: string[];

  // Optional org switcher/bootstrap data
  organizationCount?: number;
  organizations?: OrganizationListItem[];
  recentOrganizations?: OrganizationListItem[];

  // Platform-level flags
  isSuperuser: boolean;
  isStaff: boolean;

  // Profile
  timezone?: string;
  country?: string;
};

export type MeResponse = {
  id: string;
  email: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  picture_url?: string | null;
  is_superuser: boolean;
  is_staff: boolean;
  timezone?: string;
  country?: string;

  organization_count?: number;
  active_organization?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  active_membership?: {
    role?: string | null;
    fallback_role?: string;
    is_default?: boolean;
    status?: string;
  } | null;
  active_permissions?: string[];
  recent_organizations?: Array<{
    id: string;
    name: string;
    slug?: string;
    role?: string | null;
    fallback_role?: string;
    status?: string;
    is_default?: boolean;
  }>;
};

export type LoginResponse = {
  access_token?: string;
  access?: string;
  refresh_token?: string;
  refresh?: string;
  user_id?: string;
  active_organization?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  active_membership?: {
    role?: string | null;
    fallback_role?: string;
    is_default?: boolean;
    status?: string;
  } | null;
  organization_count?: number;
  requires_org_selection?: boolean;
};

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
