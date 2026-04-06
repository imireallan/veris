import os
import sys
django_settings = "config.settings.development"
os.environ.setdefault("DJANGO_SETTINGS_MODULE", django_settings)
import django
django.setup()

from assessments.models import Assessment

target_id = "2631fe5b-6140-4b07-9cb0-49ca7a344335"
try:
    a = Assessment.objects.get(pk=target_id)
    print(f"Found: id={a.id}, status={a.status}, org={a.organization_id}")
except Assessment.DoesNotExist:
    print("NOT FOUND")
    for a in Assessment.objects.all()[:5]:
        print(f"  Available: id={a.id}, status={a.status}, org={a.organization_id}")
