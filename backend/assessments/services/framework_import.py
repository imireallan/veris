"""
Service for processing framework import files (Excel/CSV).
Parses hierarchy: Principle → Category → Provision
Creates Framework + AssessmentTemplate + AssessmentQuestions
"""
import json
import uuid
from pathlib import Path
from typing import Dict, List, Tuple

from django.db import transaction
from django.utils import timezone

from assessments.models import AssessmentQuestion, AssessmentTemplate, Framework


class FrameworkImportService:
    """
    Service for importing framework data from Excel/CSV files.
    Supports Bettercoal format: Principle → Category → Provision
    """

    def __init__(self, file_path: str, original_filename: str = None):
        self.file_path = Path(file_path)
        self.extension = self.file_path.suffix.lower()
        # Use original filename for deriving framework name, fallback to temp path
        self.original_filename = original_filename or self.file_path.name

    def parse_file(self) -> Tuple[Dict, List[Dict]]:
        """
        Parse Excel/CSV file and extract framework structure.
        Returns: (framework_metadata, list_of_provisions)
        """
        if self.extension in [".xlsx", ".xls"]:
            return self._parse_excel()
        elif self.extension == ".csv":
            return self._parse_csv()
        else:
            raise ValueError(f"Unsupported file format: {self.extension}")

    def _parse_excel(self) -> Tuple[Dict, List[Dict]]:
        """Parse Excel file using openpyxl."""
        try:
            import openpyxl
        except ImportError:
            raise ImportError("openpyxl is required for Excel parsing. Install with: pip install openpyxl")

        wb = openpyxl.load_workbook(self.file_path, read_only=True, data_only=True)
        ws = wb.active

        provisions = []
        principles_seen = set()
        categories_seen = set()

        # Expected columns (Bettercoal format):
        # Col A: Principle sequence (1, 2, 3...)
        # Col B: Principle name
        # Col C: Category sequence (1.1, 1.2...)
        # Col D: Category name
        # Col E: Provision code (1.1, 1.2...)
        # Col F: Provision description
        # Col G: Rating choices (comma-separated)

        current_principle = None
        current_category = None

        for row_idx, row in enumerate(ws.iter_rows(values_only=True), start=1):
            if row_idx == 1:
                # Skip header row
                continue

            # Extract columns (handle None values)
            principle_seq = str(row[0]).strip() if row[0] else None
            principle_name = str(row[1]).strip() if row[1] else None
            category_seq = str(row[2]).strip() if row[2] else None
            category_name = str(row[3]).strip() if row[3] else None
            provision_code = str(row[4]).strip() if row[4] else None
            provision_desc = str(row[5]).strip() if row[5] else ""
            rating_choices = str(row[6]).strip() if row[6] else "0,1,2,3"

            # Skip empty rows
            if not any([principle_seq, principle_name, provision_code, provision_desc]):
                continue

            # Track unique principles
            if principle_seq and principle_seq not in principles_seen:
                principles_seen.add(principle_seq)
                current_principle = principle_seq

            # Track unique categories
            if category_seq and category_seq not in categories_seen:
                categories_seen.add(category_seq)
                current_category = category_seq

            # Add provision
            if provision_code or provision_desc:
                provisions.append({
                    "principle_sequence": current_principle or "0",
                    "principle_name": principle_name or "",
                    "category_sequence": current_category or "0",
                    "category_name": category_name or "",
                    "provision_code": provision_code or "",
                    "description": provision_desc,
                    "rating_choices": [float(x.strip()) for x in rating_choices.split(",") if x.strip()],
                })

        wb.close()

        # Infer framework name from original filename
        name_from_file = self.original_filename.rsplit('.', 1)[0]  # Remove extension
        framework_name = name_from_file.replace("_", " ").replace("-", " ").title()

        metadata = {
            "framework_name": framework_name,
            "framework_version": "1.0.0",
            "framework_description": f"Imported from {self.file_path.name}",
            "total_principles": len(principles_seen),
            "total_categories": len(categories_seen),
            "total_provisions": len(provisions),
        }

        return metadata, provisions

    def _parse_csv(self) -> Tuple[Dict, List[Dict]]:
        """Parse CSV file (simpler format)."""
        import csv

        provisions = []
        principles_seen = set()
        categories_seen = set()

        with open(self.file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                principle_seq = row.get("principle_sequence", "").strip()
                principle_name = row.get("principle_name", "").strip()
                category_seq = row.get("category_sequence", "").strip()
                category_name = row.get("category_name", "").strip()
                provision_code = row.get("provision_code", "").strip()
                provision_desc = row.get("description", "").strip()
                rating_choices = row.get("rating_choices", "0,1,2,3").strip()

                if principle_seq and principle_seq not in principles_seen:
                    principles_seen.add(principle_seq)
                if category_seq and category_seq not in categories_seen:
                    categories_seen.add(category_seq)

                if provision_code or provision_desc:
                    provisions.append({
                        "principle_sequence": principle_seq,
                        "principle_name": principle_name,
                        "category_sequence": category_seq,
                        "category_name": category_name,
                        "provision_code": provision_code,
                        "description": provision_desc,
                        "rating_choices": [float(x.strip()) for x in rating_choices.split(",") if x.strip()],
                    })

        # Infer framework name from original filename
        name_from_file = self.original_filename.rsplit('.', 1)[0]  # Remove extension
        framework_name = name_from_file.replace("_", " ").replace("-", " ").title()

        metadata = {
            "framework_name": framework_name,
            "framework_version": "1.0.0",
            "framework_description": f"Imported from {self.original_filename}",
            "total_principles": len(principles_seen),
            "total_categories": len(categories_seen),
            "total_provisions": len(provisions),
        }

        return metadata, provisions

    @transaction.atomic
    def create_framework(
        self,
        name: str,
        version: str,
        description: str,
        provisions: List[Dict],
        create_template: bool = True,
        organization_id: uuid.UUID = None,
    ) -> Tuple[Framework, AssessmentTemplate, int]:
        """
        Create Framework + Template + Questions from parsed provisions.
        Returns: (framework, template, questions_count)
        """
        # Build categories JSON structure
        categories_tree = {"principles": [], "categories": [], "provisions_count": len(provisions)}
        principles_map = {}
        categories_map = {}

        for prov in provisions:
            p_seq = prov["principle_sequence"]
            p_name = prov["principle_name"]
            c_seq = prov["category_sequence"]
            c_name = prov["category_name"]

            if p_seq not in principles_map:
                principles_map[p_seq] = {"sequence": p_seq, "name": p_name, "categories": []}
                categories_tree["principles"].append(principles_map[p_seq])

            if c_seq not in categories_map:
                categories_map[c_seq] = {"sequence": c_seq, "name": c_name, "principle_sequence": p_seq}
                principles_map[p_seq]["categories"].append(categories_map[c_seq])

        # Create Framework
        framework = Framework.objects.create(
            name=name,
            version=version,
            description=description,
            categories=categories_tree,
            scoring_methodology={"type": "provision_based", "rating_scale": "0-4"},
            reporting_period="",
            last_synced=timezone.now(),
        )

        template = None
        questions_count = 0

        if create_template:
            # Create AssessmentTemplate
            template = AssessmentTemplate.objects.create(
                name=f"{name} Template",
                slug=f"{name.lower().replace(' ', '-').replace('.', '')}-template",
                description=f"Template for {name} assessments",
                framework=framework,
                version="1.0.0",
                version_notes="Initial import",
                is_public=False,
                organization_id=organization_id,
                owner_org_id=organization_id,
                status=AssessmentTemplate.Status.DRAFT,
            )

            # Create AssessmentQuestions (one per provision)
            questions = []
            for idx, prov in enumerate(provisions, start=1):
                category_label = f"{prov['principle_name']} – {prov['category_name']}".strip(" –")
                questions.append(
                    AssessmentQuestion(
                        template=template,
                        organization_id=organization_id,
                        text=prov["description"],
                        order=idx,
                        category=category_label,
                        scoring_criteria={
                            "rating_choices": prov["rating_choices"],
                            "provision_code": prov["provision_code"],
                        },
                        framework_mappings=[
                            {
                                "framework_id": str(framework.id),
                                "provision_code": prov["provision_code"],
                                "provision_name": prov["description"][:100],
                            }
                        ],
                    )
                )

            # Bulk create for performance
            AssessmentQuestion.objects.bulk_create(questions, batch_size=100)
            questions_count = len(questions)

        return framework, template, questions_count
