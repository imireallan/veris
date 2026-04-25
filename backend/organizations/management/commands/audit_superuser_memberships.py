from django.core.management.base import BaseCommand

from organizations.models import OrganizationMembership


class Command(BaseCommand):
    help = "List superuser OrganizationMembership rows for manual review."

    def handle(self, *args, **options):
        memberships = (
            OrganizationMembership.objects.filter(user__is_superuser=True)
            .select_related("user", "organization", "role")
            .order_by("user__email", "organization__name")
        )

        if not memberships.exists():
            self.stdout.write(
                self.style.SUCCESS("No superuser organization memberships found.")
            )
            return

        self.stdout.write("email\torganization\tfallback_role\tstatus\tmembership_id")
        for membership in memberships:
            self.stdout.write(
                f"{membership.user.email}\t{membership.organization.name}\t"
                f"{membership.fallback_role}\t{membership.status}\t{membership.id}"
            )
