# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from datetime                   import timedelta

from django.contrib.auth        import get_user_model
from django.contrib.auth.models import Permission
from django.test                import TestCase
from django.urls                import reverse

from rest_framework.test        import APIClient

from wmlt.auth.models           import AccessCode
from wmlt.testlogs.models       import ChatMessageEvent
from wmlt.testlogs.models       import Event
from wmlt.testlogs.models       import EventException
from wmlt.testlogs.models       import QualityAssessment
from wmlt.testlogs.models       import StartChatEvent
from wmlt.testlogs.models       import TestRun

class RelatedObjectPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        first_access_code   = AccessCode.objects.create(access_code="FIRST")
        second_access_code  = AccessCode.objects.create(access_code="SECOND")
        first_testrun       = self.create_testrun(first_access_code)
        second_testrun      = self.create_testrun(second_access_code)

        self.first_objects  = self.create_related_objects(first_testrun)
        self.second_objects = self.create_related_objects(second_testrun)

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

    def create_related_objects(self, testrun):
        event = Event.objects.create(testrun=testrun, event_type=Event.EventType.PAGE_NAVIGATION)
        event_exception = EventException.objects.create(event=event, number=1, name="Test exception")
        chat = StartChatEvent.objects.create(testrun=testrun)

        message = ChatMessageEvent.objects.create(
            testrun           = testrun,
            chat              = chat,
            max_tokens        = 0,
            sampling          = False,
            first_token       = timedelta(),
            runtime           = timedelta(),
            tokens            = 0,
            tokens_per_second = 0,
        )

        assessment = QualityAssessment.objects.create(
            message                  = message,
            judge_type               = QualityAssessment.JudgeType.LLM,
            correct_syntax_grade     = QualityAssessment.Correctness.NO_ERRORS_FOUND,
            correct_lingua_grade     = QualityAssessment.Correctness.NO_ERRORS_FOUND,
            correct_content_grade    = QualityAssessment.Correctness.NO_ERRORS_FOUND,
            thematic_relevance_grade = QualityAssessment.ThematicRelevance.PERFECT_FIT,
            message_length_grade     = QualityAssessment.MessageLength.PERFECT_SIZE,
        )

        return {
            "event":               event,
            "event_exception":     event_exception,
            "quality_assessments": assessment,
        }

    def test_access_code_scopes_event_and_related_object_querysets(self):
        self.client.credentials(HTTP_AUTHORIZATION="access-code FIRST")

        for route_name, first_object in self.first_objects.items():
            with self.subTest(route_name=route_name):
                response = self.client.get(reverse(f"{route_name}-list"))

                self.assertEqual(response.status_code, 200, response.data)
                expected_ids = [first_object.pk]

                if route_name == "event":
                    expected_ids = Event.objects.filter(testrun__access_code__access_code="FIRST").values_list("pk", flat=True)

                self.assertCountEqual([item["id"] for item in response.data], expected_ids)

                other_object = self.second_objects[route_name]
                response     = self.client.get(reverse(f"{route_name}-detail", args=[other_object.pk]))

                self.assertEqual(response.status_code, 404)

    def test_authenticated_users_require_each_models_view_permission(self):
        user = get_user_model().objects.create_user(username="related-permission-test", password="test-password")
        self.client.force_authenticate(user=user)

        for route_name, first_object in self.first_objects.items():
            with self.subTest(route_name=route_name):
                detail_url = reverse(f"{route_name}-detail", args=[first_object.pk])
                response = self.client.get(detail_url)
                self.assertEqual(response.status_code, 403)

                view_permission = Permission.objects.get(content_type__app_label="wmlt_testlogs", codename=f"view_{first_object._meta.model_name}")
                user.user_permissions.add(view_permission)
                self.client.force_authenticate(user=get_user_model().objects.get(pk=user.pk))

                response = self.client.get(detail_url)
                self.assertEqual(response.status_code, 200, response.data)
                self.assertEqual(response.data["id"], first_object.pk)
