# Web/Mobile Test for Local AI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .base                import NestedObjectsAPITestCase

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
                "results": [
                    {
                        "seqnr":      1,
                        "page_url":   "https://example.test/one",
                        "page_title": "First",
                        "text":       "matched keyword",
                        "text_type":  "KEYWORD",
                        "similarity":  90,
                    }
                ],
            },
        )

        event = SemanticSearchEvent.objects.get(pk=response.data["id"])
        result = event.results.get()

        self.assertEqual(
            (result.seqnr, result.text, result.text_type, result.similarity),
            (1, "matched keyword", "KEYWORD", 90),
        )
        self.assertEqual(
            response.data["results"][0],
            {
                "seqnr":      1,
                "page_url":   "https://example.test/one",
                "page_title": "First",
                "text":       "matched keyword",
                "text_type":  "KEYWORD",
                "similarity": 90,
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
                        "seqnr":      1,
                        "page_url":   "https://example.test/old",
                        "page_title": "Old",
                        "text":       "old match",
                        "text_type":  "KEYWORD",
                        "similarity": 70,
                    }
                ],
            },
        )
        event_id       = created.data["id"]
        original_event = SemanticSearchEvent.objects.get(pk=event_id)
        old_result     = original_event.results.get()
        old_result_id  = old_result.pk

        replacement = {
            "seqnr":      2,
            "page_url":   "https://example.test/new",
            "page_title": "New",
            "text":       "new match",
            "text_type":  "SENTENCE",
            "similarity": 88,
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
            (new_result.text, new_result.text_type, new_result.similarity),
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
                        "seqnr":      1,
                        "page_url":   "https://example.test/one",
                        "page_title": "First",
                        "text":       "match",
                        "text_type":  "KEYWORD",
                        "similarity": 90,
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
