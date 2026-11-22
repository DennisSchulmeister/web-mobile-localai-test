# Web/Mobile Test for Local AI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .base                import NestedObjectsAPITestCase

from datetime             import timedelta
from django.urls          import reverse

from wmlt.testlogs.models import SemanticSearchEvent

class SemanticSearchEventNestedObjectsTests(NestedObjectsAPITestCase):
    route_name = "semantic_search_event"

    def test_create_saves_and_returns_nested_results(self):
        response = self.create_event(
            self.route_name,
            {
                "query":              "test query",
                "include_keywords":   True,
                "include_sentences":  True,
                "compare_embeddings": True,
                "compare_strings":    False,
                "download":           "00:00:00.217000",
                "embedding":          "00:00:00.080000",
                "search":             "00:00:00.001000",
                "results": [
                    {
                        "seqnr": 1,
                        "file":  "https://example.test/one",
                        "title": "First",
                        "text":  "matched keyword",
                        "type":  "KEYWORD",
                        "fit":   90,
                    }
                ],
            },
        )

        event = SemanticSearchEvent.objects.get(pk=response.data["id"])
        result = event.results.get()

        self.assertEqual(event.download, timedelta(microseconds=217000))
        self.assertEqual(event.embedding, timedelta(microseconds=80000))
        self.assertEqual(event.search, timedelta(microseconds=1000))
        self.assertEqual(
            (result.seqnr, result.text, result.type, result.fit),
            (1, "matched keyword", "KEYWORD", 90),
        )
        self.assertEqual(
            response.data["results"][0],
            {
                "seqnr": 1,
                "file":  "https://example.test/one",
                "title": "First",
                "text":  "matched keyword",
                "type":  "KEYWORD",
                "fit":   90,
            },
        )

    def test_patch_replaces_nested_results_and_omitting_results_preserves_them(self):
        created = self.create_event(
            self.route_name,
            {
                "query":              "test query",
                "include_keywords":   True,
                "include_sentences":  False,
                "compare_embeddings": True,
                "compare_strings":    False,
                "results": [
                    {
                        "seqnr": 1,
                        "file":  "https://example.test/old",
                        "title": "Old",
                        "text":  "old match",
                        "type":  "KEYWORD",
                        "fit":   70,
                    }
                ],
            },
        )
        event_id       = created.data["id"]
        original_event = SemanticSearchEvent.objects.get(pk=event_id)
        old_result     = original_event.results.get()
        old_result_id  = old_result.pk

        replacement = {
            "seqnr": 2,
            "file":  "https://example.test/new",
            "title": "New",
            "text":  "new match",
            "type":  "SENTENCE",
            "fit":   88,
        }
        response = self.client.patch(
            reverse(f"{self.route_name}-detail", args=[event_id]),
            {"results": [replacement]},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)

        event = SemanticSearchEvent.objects.get(pk=event_id)
        self.assertFalse(event.results.filter(pk=old_result_id).exists())

        new_result = event.results.get()

        self.assertEqual(
            (new_result.text, new_result.type, new_result.fit),
            ("new match", "SENTENCE", 88),
        )

        response = self.client.patch(
            reverse(f"{self.route_name}-detail", args=[event_id]),
            {"query": "updated query"},
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(event.results.count(), 1)

    def test_patch_with_empty_results_clears_results(self):
        created = self.create_event(
            self.route_name,
            {
                "query":              "test query",
                "include_keywords":   True,
                "include_sentences":  False,
                "compare_embeddings": True,
                "compare_strings":    False,
                "results": [
                    {
                        "seqnr": 1,
                        "file":  "https://example.test/one",
                        "title": "First",
                        "text":  "match",
                        "type":  "KEYWORD",
                        "fit":   90,
                    }
                ],
            },
        )

        response = self.client.patch(
            reverse(f"{self.route_name}-detail", args=[created.data["id"]]),
            {"results": []},
            format="json",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["results"], [])
        
        self.assertEqual(
            SemanticSearchEvent.objects.get(pk=created.data["id"]).results.count(),
            0,
        )
