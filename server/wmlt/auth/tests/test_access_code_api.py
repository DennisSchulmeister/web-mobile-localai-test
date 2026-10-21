# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.contrib.auth        import get_user_model
from django.contrib.auth.models import Permission
from django.test                import TestCase
from django.urls                import reverse

from rest_framework.test        import APIClient

from wmlt.auth.models           import AccessCode

class AccessCodeAPITests(TestCase):
    def setUp(self):
        self.client             = APIClient()
        self.first_access_code  = AccessCode.objects.create(access_code="FIRST")
        self.second_access_code = AccessCode.objects.create(access_code="SECOND")

    def test_access_code_header_limits_read_access_to_matching_code(self):
        self.client.credentials(HTTP_AUTHORIZATION="access-code FIRST")

        response = self.client.get(reverse("access_code-list"))
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual([item["id"] for item in response.data], [self.first_access_code.pk])

        response = self.client.get(reverse("access_code-detail", args=[self.first_access_code.pk]))
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["id"], self.first_access_code.pk)

        response = self.client.get(reverse("access_code-detail", args=[self.second_access_code.pk]))
        self.assertEqual(response.status_code, 404)

    def test_authenticated_user_can_read_codes_with_view_permission(self):
        user = get_user_model().objects.create_user(username="access-code-permission-test", password="test-password")
        self.client.force_authenticate(user=user)

        response = self.client.get(reverse("access_code-list"))
        self.assertEqual(response.status_code, 403)

        view_permission = Permission.objects.get(content_type__app_label="wmlt_auth", codename="view_accesscode")
        user.user_permissions.add(view_permission)
        self.client.force_authenticate(user=get_user_model().objects.get(pk=user.pk))

        response = self.client.get(reverse("access_code-list"))
        self.assertEqual(response.status_code, 200, response.data)
        self.assertCountEqual([item["id"] for item in response.data], [self.first_access_code.pk, self.second_access_code.pk])

    def test_access_code_api_does_not_allow_writes(self):
        self.client.credentials(HTTP_AUTHORIZATION="access-code FIRST")

        response = self.client.post(
            reverse("access_code-list"),
            {"access_code": "THIRD"},
            format="json",
        )
        self.assertEqual(response.status_code, 405)

        response = self.client.patch(
            reverse("access_code-detail", args=[self.first_access_code.pk]),
            {"remarks": "Updated"},
            format="json",
        )
        self.assertEqual(response.status_code, 405)

        response = self.client.delete(reverse("access_code-detail", args=[self.first_access_code.pk]))
        self.assertEqual(response.status_code, 405)

        self.assertEqual(AccessCode.objects.count(), 2)
        self.assertEqual(self.first_access_code.remarks, "")
