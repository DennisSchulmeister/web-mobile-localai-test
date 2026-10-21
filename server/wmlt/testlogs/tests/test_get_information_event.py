# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .base                import NestedObjectsAPITestCase
from django.urls          import reverse
from wmlt.testlogs.models import GetInformationEvent

class GetInformationEventNestedObjectsTests(NestedObjectsAPITestCase):
    route_name = "get_information_event"

    def test_create_saves_and_returns_nested_lines(self):
        response = self.create_event(
            self.route_name,
            {
                "engine_id":   "test-engine",
                "engine_name": "Test Engine",
                "lines": [
                    {
                        "seqnr": 1,
                        "field": "version",
                        "icon":  "info",
                        "label": "Version",
                        "value": "1.0",
                    },
                    {
                        "seqnr": 2,
                        "field": "runtime",
                        "icon":  "cpu",
                        "label": "Runtime",
                        "value": "Local",
                    },
                ],
            },
        )

        event = GetInformationEvent.objects.get(pk=response.data["id"])

        self.assertEqual(
            list(event.lines.values_list("seqnr", "field", "value")),
            [(1, "version", "1.0"), (2, "runtime", "Local")],
        )
        
        self.assertEqual(
            response.data["lines"],
            [
                {
                    "id":    event.lines.get(seqnr=1).pk,
                    "seqnr": 1,
                    "field": "version",
                    "icon":  "info",
                    "label": "Version",
                    "value": "1.0",
                },
                {
                    "id":    event.lines.get(seqnr=2).pk,
                    "seqnr": 2,
                    "field": "runtime",
                    "icon":  "cpu",
                    "label": "Runtime",
                    "value": "Local",
                },
            ],
        )

    def test_patch_replaces_lines_and_omitting_lines_preserves_them(self):
        created = self.create_event(
            self.route_name,
            {
                "engine_id":   "test-engine",
                "engine_name": "Test Engine",
                "lines": [
                    {
                        "seqnr": 1,
                        "field": "version",
                        "icon":  "info",
                        "label": "Version",
                        "value": "1.0",
                    }
                ],
            },
        )
        event_id    = created.data["id"]
        old_line_id = created.data["lines"][0]["id"]

        replacement = {
            "seqnr": 2,
            "field": "runtime",
            "icon":  "cpu",
            "label": "Runtime",
            "value": "Local",
        }
        response = self.client.patch(
            reverse(f"{self.route_name}-detail", args=[event_id]),
            {"lines": [replacement]},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        event = GetInformationEvent.objects.get(pk=event_id)

        self.assertFalse(event.lines.filter(pk=old_line_id).exists())

        self.assertEqual(
            list(event.lines.values_list("seqnr", "field", "value")),
            [(2, "runtime", "Local")],
        )

        response = self.client.patch(
            reverse(f"{self.route_name}-detail", args=[event_id]),
            {"engine_name": "Updated Engine"},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(event.lines.count(), 1)

    def test_patch_with_empty_lines_clears_nested_objects(self):
        created = self.create_event(
            self.route_name,
            {
                "engine_id":   "test-engine",
                "engine_name": "Test Engine",
                "lines": [
                    {
                        "seqnr": 1,
                        "field": "version",
                        "icon":  "info",
                        "label": "Version",
                        "value": "1.0",
                    }
                ],
            },
        )

        response = self.client.patch(
            reverse(f"{self.route_name}-detail", args=[created.data["id"]]),
            {"lines": []},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["lines"], [])
        self.assertEqual(GetInformationEvent.objects.get(pk=created.data["id"]).lines.count(), 0)
