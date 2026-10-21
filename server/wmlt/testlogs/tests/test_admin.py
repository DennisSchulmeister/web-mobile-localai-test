# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.contrib.auth import get_user_model
from django.test        import RequestFactory
from django.test        import TestCase

from wmlt.admin          import admin_site
from wmlt.testlogs.models import Event
from wmlt.testlogs.models import StartChatEvent

class EventAdminTests(TestCase):
    def test_base_event_admin_is_read_only_and_child_admin_remains_editable(self):
        user = get_user_model().objects.create_superuser(
            username = "event-admin-test",
            email    = "event-admin@example.test",
            password = "test-password",
        )
        request = RequestFactory().get("/")
        request.user = user

        event_admin = admin_site._registry[Event]
        child_admin = admin_site._registry[StartChatEvent]

        self.assertTrue(event_admin.has_view_permission(request))
        self.assertFalse(event_admin.has_add_permission(request))
        self.assertFalse(event_admin.has_change_permission(request))
        self.assertFalse(event_admin.has_delete_permission(request))

        self.assertTrue(child_admin.has_add_permission(request))
        self.assertTrue(child_admin.has_change_permission(request))
        self.assertTrue(child_admin.has_delete_permission(request))

        event_inline = event_admin.get_inline_instances(request)[0]
        child_inline = child_admin.get_inline_instances(request)[0]

        self.assertFalse(event_inline.has_add_permission(request, None))
        self.assertFalse(event_inline.has_change_permission(request, None))
        self.assertFalse(event_inline.has_delete_permission(request, None))
        self.assertTrue(child_inline.has_add_permission(request, None))
        self.assertTrue(child_inline.has_change_permission(request, None))
        self.assertTrue(child_inline.has_delete_permission(request, None))
