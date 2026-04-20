"""
Report generation service - converts AssessmentReport to PDF.

Uses WeasyPrint for HTML → PDF conversion with CSS styling.
"""

from pathlib import Path

from django.conf import settings
from django.template.loader import render_to_string

from themes.models import OrganizationTheme

try:
    from weasyprint import CSS, HTML

    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False


class ReportGenerationError(Exception):
    """Raised when report generation fails."""

    pass


class ReportGenerator:
    """
    Generates PDF reports from AssessmentReport instances.

    Usage:
        generator = ReportGenerator(assessment_report)
        pdf_bytes = generator.generate_pdf()
    """

    def __init__(self, assessment_report):
        self.report = assessment_report
        self.assessment = assessment_report.assessment

    def generate_pdf(self) -> bytes:
        """
        Generate PDF report.

        Returns:
            PDF file as bytes

        Raises:
            ReportGenerationError: If generation fails
        """
        if not WEASYPRINT_AVAILABLE:
            raise ReportGenerationError(
                "WeasyPrint not installed. Run: pip install weasyprint"
            )

        try:
            # Render HTML template
            html_content = self._render_html()

            # Generate PDF
            html = HTML(string=html_content)

            # Optional: Add CSS styling
            css_path = Path(settings.BASE_DIR) / "reports" / "templates" / "report.css"
            if css_path.exists():
                css = CSS(filename=css_path)
                pdf_bytes = html.write_pdf(stylesheets=[css])
            else:
                pdf_bytes = html.write_pdf()

            return pdf_bytes

        except Exception as e:
            raise ReportGenerationError(f"Failed to generate PDF: {str(e)}") from e

    def _render_html(self) -> str:
        """Render the report HTML template."""
        context = self._get_template_context()

        template_path = (
            Path(settings.BASE_DIR) / "reports" / "templates" / "report.html"
        )

        if not template_path.exists():
            # Fallback to Django template rendering
            return render_to_string("reports/report.html", context)

        # Use Django template engine for proper rendering with filters and tags
        from django.template import Context, Template

        with open(template_path, "r", encoding="utf-8") as f:
            template_content = f.read()

        template = Template(template_content)
        return template.render(Context(context))

    def _get_template_context(self) -> dict:
        """Build template context from report and assessment data."""
        report = self.report
        assessment = self.assessment
        organization = getattr(report, "organization", None) or getattr(
            assessment, "organization", None
        )
        theme = None
        if organization:
            theme = OrganizationTheme.objects.filter(organization=organization).first()

        # Get findings for this assessment
        findings = list(assessment.findings.all()[:10])  # Limit to 10 for summary

        # Get CIP cycles
        cip_cycles = list(assessment.cip_cycles.all())

        # Pre-process findings for template (add formatted values)
        findings_data = []
        for f in findings:
            findings_data.append(
                {
                    "description": getattr(f, "description", "")
                    or "No description provided.",
                    "severity": f.severity,
                    "get_severity_display": (
                        f.get_severity_display()
                        if hasattr(f, "get_severity_display")
                        else f.severity
                    ),
                    "status": getattr(f, "status", "OPEN"),
                    "get_status_display": (
                        f.get_status_display()
                        if hasattr(f, "get_status_display")
                        else getattr(f, "status", "OPEN")
                    ),
                }
            )

        critical_findings = [f for f in findings_data if f["severity"] == "CRITICAL"]
        high_findings = [f for f in findings_data if f["severity"] == "HIGH"]

        # Pre-process CIP cycles for template (add formatted values)
        cip_cycles_data = []
        for cycle in cip_cycles:
            cip_cycles_data.append(
                {
                    "cycle_number": getattr(cycle, "cycle_number", None),
                    "start_date": getattr(cycle, "start_date", None),
                    "end_date": getattr(cycle, "end_date", None),
                    "status": getattr(cycle, "status", "N/A"),
                    "get_status_display": (
                        cycle.get_status_display()
                        if hasattr(cycle, "get_status_display")
                        else getattr(cycle, "status", "N/A")
                    ),
                }
            )

        branding = {
            "brand_app_name": theme.app_name if theme and theme.app_name else "Veris",
            "brand_logo_url": theme.logo_url if theme else "",
            "brand_favicon_url": theme.favicon_url if theme else "",
            "brand_font_family": (
                theme.font_family
                if theme and theme.font_family
                else "Inter, system-ui, sans-serif"
            ),
            "brand_primary": theme.primary_color if theme else "160 84 39",
            "brand_primary_foreground": (
                theme.primary_foreground_color if theme else "0 0 100"
            ),
            "brand_secondary": theme.secondary_color if theme else "210 40 96",
            "brand_secondary_foreground": (
                theme.secondary_foreground_color if theme else "222 47 11"
            ),
            "brand_accent": theme.accent_color if theme else "38 92 50",
            "brand_accent_foreground": (
                theme.accent_foreground_color if theme else "0 0 0"
            ),
            "brand_background": theme.background_color if theme else "0 0 100",
            "brand_foreground": theme.text_color if theme else "222 84 5",
            "brand_muted": theme.muted_color if theme else "210 40 96",
            "brand_muted_foreground": (
                theme.muted_foreground_color if theme else "215 16 47"
            ),
            "brand_border": theme.border_color if theme else "214 32 91",
        }

        # Build context
        context = {
            # Report metadata
            "report_title": report.title,
            "report_status": report.get_status_display(),
            "report_published_date": report.report_published_date,
            # Assessment info
            "assessment_name": str(assessment.id)[:8],
            "assessment_code": str(assessment.id)[:8],
            "assessment_status": assessment.get_status_display(),
            "assessment_risk": getattr(assessment, "risk_level", "N/A"),
            "assessment_score": getattr(assessment, "overall_score", "N/A"),
            "assessment_start_date": getattr(assessment, "start_date", "N/A"),
            "assessment_due_date": getattr(assessment, "due_date", "N/A"),
            # Organization
            "organization_name": organization.name if organization else "Organization",
            # Branding
            **branding,
            # Report sections
            "executive_summary": report.executive_summary
            or "No executive summary provided.",
            "methodology": report.methodology
            or "Standard ESG assessment methodology applied.",
            "scope": report.scope or f"Assessment {str(assessment.id)[:8]}",
            "country_context": report.country_context or "Not specified.",
            "conclusion": report.conclusion or "Assessment completed successfully.",
            "disclaimer": report.disclaimer or self._get_default_disclaimer(),
            # Findings summary
            "findings_count": len(findings_data),
            "findings": findings_data,
            "critical_findings": critical_findings,
            "high_findings": high_findings,
            # CIP cycles
            "cip_cycles_count": len(cip_cycles_data),
            "cip_cycles": cip_cycles_data,
            # Meeting participants
            "meeting_participants": report.meeting_participants or [],
            "stakeholder_meetings": report.stakeholder_meetings or [],
            # Limitations
            "limitations": report.limitations or [],
            # Generated date
            "generated_at": (
                assessment.updated_at.strftime("%B %d, %Y")
                if assessment.updated_at
                else "N/A"
            ),
        }

        return context

    def _get_default_disclaimer(self) -> str:
        """Return default disclaimer text."""
        return (
            "This report has been generated based on information provided during the assessment "
            "process. While every effort has been made to ensure accuracy, the assessing party "
            "does not guarantee the completeness or accuracy of the information presented. "
            "This report is intended for the use of the assessed organization and should not be "
            "relied upon by third parties without explicit permission."
        )

    def generate_filename(self) -> str:
        """Generate a safe filename for the PDF."""
        # Use assessment ID since there's no name field
        safe_name = f"Assessment_{str(self.assessment.id)[:8]}"
        return f"{safe_name}_Report.pdf"
