# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.core.management.base import BaseCommand
from django.core.management.base import CommandError
from django.utils.translation    import gettext as _
from django.utils.translation    import ngettext

from ...actions                  import iter_ai_quality_assessment
from ...models                   import ChatMessageEvent

class Command(BaseCommand):
    help = _("Run AI quality assessments for all chat messages")

    def add_arguments(self, parser):
        parser.add_argument(
            "pk",
            nargs = "*",
            type  = int,
            help  = _("One or more Chat Message IDs"),
        )

    def handle(self, *args, **options):
        if options["pk"]:
            queryset = ChatMessageEvent.objects.filter(pk__in=options["pk"])
        else:
            queryset = ChatMessageEvent.objects.all()

        count = queryset.count()
        self.stdout.write(
            ngettext(
                "Found %(count)s chat message",
                "Found %(count)s chat messages",
                count,
            ) % {"count": count}
        )

        count_created = 0
        count_errors  = 0

        for status in iter_ai_quality_assessment(queryset):
            match status["status"]:
                case "start":
                    self.stdout.write(str(status["chat_message"]), ending="")
                case "success":
                    count_created += 1
                    self.stdout.write(" ", ending="")
                    self.stdout.write(self.style.SUCCESS(_("Ok")))
                case "error":
                    count_errors += 1
                    self.stdout.write(" ", ending="")
                    self.stdout.write(self.style.SUCCESS(_("Error")))
                    self.stdout.write(f"\n{str(status["error"])}\n")
                case _:
                    self.stdout.write()

        self.stdout.write(
            _("Created Quality Assessments: %(created)i, Errors: %(errors)i")
            % {"created": count_created, "errors": count_errors}
        )
