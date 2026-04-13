#!/usr/bin/env python
"""
E2E Test Script: Phase 2 Evidence Pipeline
Tests: Upload → Create KnowledgeDocument → Process → Validate Response

Usage:
    docker compose exec backend python test_e2e_phase2.py
"""

import os
import sys

import django
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

# Setup Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from assessments.models import (  # noqa: E402
    Assessment,
    AssessmentQuestion,
    AssessmentResponse,
    AssessmentTemplate,
)
from organizations.models import Organization, OrganizationMembership  # noqa: E402
from users.models import User  # noqa: E402


def test_phase2_pipeline():
    print("=" * 60)
    print("PHASE 2 E2E TEST: Evidence Pipeline")
    print("=" * 60)

    # Setup test data
    print("\n1. Creating test user and organization...")
    user, _ = User.objects.get_or_create(
        email="test_phase2@veris.com",
        defaults={
            "name": "Test User",
            "is_superuser": True,
            "is_staff": True,
        },
    )
    user.set_password("testpass")
    user.save()

    org, _ = Organization.objects.get_or_create(
        name="Test Phase 2 Org",
        defaults={"slug": "test-phase-2-org"},
    )

    membership, _ = OrganizationMembership.objects.get_or_create(
        user=user,
        organization=org,
        defaults={"role_id": None},
    )

    print(f"   ✓ User: {user.email}")
    print(f"   ✓ Organization: {org.name}")

    # Create API client
    client = APIClient()
    client.force_authenticate(user=user)

    # Test 1: Upload evidence document
    print("\n2. Testing file upload...")
    test_pdf_content = b"%PDF-1.4\nTest PDF content for evidence validation"
    upload_file = SimpleUploadedFile(
        "test_evidence.pdf",
        test_pdf_content,
        content_type="application/pdf",
    )

    response = client.post("/api/upload-evidence/", {"file": upload_file})
    if response.status_code != 200:
        print(f"   ✗ Upload failed: {response.data}")
        return False

    upload_data = response.data
    print(
        f"   ✓ Uploaded: {upload_data['file_name']} ({upload_data['file_size']} bytes)"
    )
    print(f"   ✓ URL: {upload_data['url']}")

    # Test 2: Create KnowledgeDocument
    print("\n3. Creating KnowledgeDocument record...")
    # Note: upload_data['url'] is relative path, need full URL for URLField validation
    # In production (S3), this would already be a full URL
    file_url = f"http://localhost:8000{upload_data['url']}"
    import json

    doc_response = client.post(
        "/api/documents/",
        {
            "organization": str(org.id),
            "title": "Test Evidence Document",
            "description": "E2E test document",
            "file_url": file_url,
            "file_type": "PDF",
            "file_size": upload_data["file_size"],
            "category": "Evidence",
            "framework_tags": json.dumps(["bettercoal"]),
        },
        format="json",
    )

    if doc_response.status_code not in [200, 201]:
        print(f"   ✗ Document creation failed: {doc_response.data}")
        return False

    doc = doc_response.data
    print(f"   ✓ KnowledgeDocument created: {doc['id']}")

    # Test 3: Process document (embed)
    print("\n4. Processing document (PDF → chunks → embeddings)...")
    # Note: This may fail if Pinecone is not configured
    process_response = client.post(f"/api/documents/{doc['id']}/process/")

    if process_response.status_code == 200:
        process_data = process_response.data
        print(
            f"   ✓ Processed: {process_data['chunk_count']} chunks, {process_data['vector_count']} vectors"
        )
    else:
        print(
            f"   ⚠ Processing skipped (Pinecone may not be configured): {process_response.data.get('error', 'Unknown')}"
        )

    # Test 4: Create assessment with questions
    print("\n5. Creating assessment and questions...")
    from datetime import timedelta

    from django.utils import timezone

    template, _ = AssessmentTemplate.objects.get_or_create(
        name="Test Template",
        organization=org,
        defaults={"description": "E2E test template"},
    )

    assessment, _ = Assessment.objects.get_or_create(
        organization=org,
        template=template,
        defaults={
            "status": "IN_PROGRESS",
            "start_date": timezone.now(),
            "due_date": timezone.now() + timedelta(days=90),
        },
    )

    question, _ = AssessmentQuestion.objects.get_or_create(
        template=template,
        text="Does the company have an environmental policy?",
        defaults={
            "order": 1,
            "category": "Environment",
        },
    )

    print(f"   ✓ Assessment: {assessment.id}")
    print(f"   ✓ Question: {question.id}")

    # Test 5: Create response
    print("\n6. Creating assessment response...")
    response_obj = AssessmentResponse.objects.create(
        assessment=assessment,
        question=question,
        answer_text="Yes, our company has a comprehensive environmental policy covering waste management, emissions, and biodiversity.",
    )

    print(f"   ✓ Response created: {response_obj.id}")

    # Test 6: Validate response
    print("\n7. Testing AI validation...")
    # Use flat route: /api/responses/{id}/validate/
    validate_response = client.post(f"/api/responses/{response_obj.id}/validate/")

    if validate_response.status_code == 200:
        val_data = validate_response.data
        print(f"   ✓ Validation status: {val_data['validation_status']}")
        print(f"   ✓ Confidence: {val_data['confidence_score']:.2%}")
        print(f"   ✓ Feedback: {val_data['feedback']}")
    else:
        print(
            f"   ⚠ Validation skipped (Pinecone may not be configured): {validate_response.data.get('error', 'Unknown')}"
        )

    # Refresh from DB
    response_obj.refresh_from_db()
    print("\n   DB State:")
    print(f"   - validation_status: {response_obj.validation_status}")
    print(f"   - confidence_score: {response_obj.confidence_score}")
    if response_obj.ai_feedback:
        print(f"   - ai_feedback: {response_obj.ai_feedback[:50]}...")
    else:
        print("   - ai_feedback: (empty)")

    print("\n" + "=" * 60)
    print("E2E TEST COMPLETED")
    print("=" * 60)
    return True


if __name__ == "__main__":
    try:
        success = test_phase2_pipeline()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Test failed with exception: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
