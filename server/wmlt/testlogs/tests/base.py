# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.contrib.auth  import get_user_model
from django.test          import TestCase
from django.urls          import reverse

from rest_framework.test  import APIClient

from wmlt.auth.models     import AccessCode
from wmlt.testlogs.models import TestRun

class NestedObjectsAPITestCase(TestCase):
    def setUp(self):
        """Set up test case: Authenticate with fake user and create mock access
        code and mock testrun."""
        self.client = APIClient()

        self.client.force_authenticate(
            user=get_user_model().objects.create_superuser(
                username = "nested-objects-test",
                email    = "nested-objects@example.test",
                password = "test-password",
            )
        )

        access_code = AccessCode.objects.create(access_code="NESTED")

        self.testrun = TestRun.objects.create(
            access_code     = access_code,
            app_type        = TestRun.AppType.BROWSER,
            installation    = "test",
            device_type     = TestRun.DeviceType.PC,
            device_model    = "Test computer",
            os_family       = TestRun.OperatingSystemFamily.LINUX,
            os_version      = "1",
            browser_family  = TestRun.BrowserFamily.FIREFOX,
            browser_version = "1",
        )

    def create_event(self, route_name, payload):
        """Utility method to create new events via the webservice"""
        response = self.client.post(
            reverse(f"{route_name}-list"),
            {"testrun": self.testrun.pk, **payload},
            format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)
        return response
