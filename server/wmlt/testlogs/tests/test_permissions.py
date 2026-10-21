# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import datetime

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.urls import reverse
from django.utils import timezone
from django.test import TestCase

from rest_framework.test import APIClient

from wmlt.auth.models import AccessCode
from wmlt.testlogs.models import TestRun

class PermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.first_access_code  = AccessCode.objects.create(access_code="FIRST")
        self.second_access_code = AccessCode.objects.create(access_code="SECOND")
        self.first_testrun      = self.create_testrun(self.first_access_code)
        self.second_testrun     = self.create_testrun(self.second_access_code)

    def create_testrun(self, access_code):
        return TestRun.objects.create(
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

    def test_access_code_limits_unauthenticated_users_to_linked_objects(self):
        self.client.credentials(HTTP_AUTHORIZATION="access-code FIRST")

        response = self.client.get(reverse("test_run-list"))
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual([item["id"] for item in response.data], [self.first_testrun.pk])

        response = self.client.get(reverse("test_run-detail", args=[self.second_testrun.pk]))
        self.assertEqual(response.status_code, 404)

    def test_invalid_and_expired_access_codes_are_denied(self):
        now = timezone.now()

        expired_access_code = AccessCode.objects.create(
            access_code = "EXPIRED",
            valid_from  = now - datetime.timedelta(days=2),
            valid_until = now - datetime.timedelta(days=1),
        )

        for access_code in ("UNKNOWN", expired_access_code.access_code):
            with self.subTest(access_code=access_code):
                self.client.credentials(HTTP_AUTHORIZATION=f"access-code {access_code}")

                response = self.client.get(reverse("test_run-list"))
                self.assertEqual(response.status_code, 403)

        self.client.credentials(HTTP_AUTHORIZATION="access-code")
        response = self.client.get(reverse("test_run-list"))

        self.assertEqual(response.status_code, 403)

    def test_authenticated_users_need_django_model_permissions(self):
        user = get_user_model().objects.create_user(username="permission-test-user", password="test-password")
        self.client.force_authenticate(user=user)

        response = self.client.get(reverse("test_run-detail", args=[self.first_testrun.pk]))
        self.assertEqual(response.status_code, 403)

        view_permission = Permission.objects.get(content_type__app_label="wmlt_testlogs", codename="view_testrun")
        user.user_permissions.add(view_permission)

        self.client.force_authenticate(user=get_user_model().objects.get(pk=user.pk))
        response = self.client.get(reverse("test_run-detail", args=[self.first_testrun.pk]))

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["id"], self.first_testrun.pk)
