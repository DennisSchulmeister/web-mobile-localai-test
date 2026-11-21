# Web/Mobile Test for Local AI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.urls import reverse

from wmlt.testlogs.models import Event
from wmlt.testlogs.models import EventException

from .base import NestedObjectsAPITestCase

class EventExceptionAPITests(NestedObjectsAPITestCase):
    def setUp(self):
        super().setUp()
        self.event = Event.objects.create(
            testrun=self.testrun,
            event_type=Event.EventType.PAGE_NAVIGATION,
            status=Event.Status.SUCCESS,
        )

    def create_exception(self, seqnr=None, include_seqnr=False):
        data = {"event": self.event.pk, "name": "Test exception"}

        if include_seqnr:
            data["seqnr"] = seqnr

        return self.client.post(reverse("event_exception-list"), data, format="json")

    def test_empty_sequence_number_increments_for_the_same_event(self):
        EventException.objects.create(event=self.event, seqnr=3, name="Earlier exception")
        response = self.create_exception()

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["seqnr"], 4)

    def test_empty_sequence_number_starts_at_one_and_accepts_blank(self):
        response = self.create_exception(seqnr="", include_seqnr=True)

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["seqnr"], 1)

    def test_sequence_number_uses_only_exceptions_from_the_same_event(self):
        other_event = Event.objects.create(
            testrun=self.testrun,
            event_type=Event.EventType.PAGE_NAVIGATION,
            status=Event.Status.SUCCESS,
        )
        EventException.objects.create(event=other_event, seqnr=8, name="Other event exception")

        response = self.create_exception()

        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["seqnr"], 1)
