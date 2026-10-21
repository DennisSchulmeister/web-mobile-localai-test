# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .                          import models
from ..auth.serializers         import AccessCodeCheckingModelSerializer

from django.db                  import transaction
from rest_framework.serializers import ModelSerializer

class TestRunSerializer(AccessCodeCheckingModelSerializer):
    class Meta:
        model  = models.TestRun
        fields = "__all__"

    def get_access_code_from_request_body(self, attrs):
        """Since this is the testrun itself, the access code is not read from
        database but the request body here.
        """
        return attrs.get("access_code", None)

class AbstractEventSerializer(AccessCodeCheckingModelSerializer):
    def get_testrun(self, attrs):
        if (testrun := attrs.get("testrun", None)) is not None:
            return testrun
        elif self.instance is not None:
            return self.instance.testrun
        else:
            return None

    def get_access_code_from_request_body(self, attrs):
        if (testrun := self.get_testrun(attrs)) is not None and testrun.access_code is not None:
            return testrun.access_code.access_code
        else:
            return None

class EventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.Event
        fields = "__all__"

class EventExceptionSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.EventException
        fields = "__all__"

    def get_testrun(self, attrs):
        """``EventException`` is no event in itself, but is related to an event whose testrun
        must match the access code presented in the HTTP request header."""
        if (event := attrs.get("event", None)) is not None:
            return event.testrun
        elif self.instance is not None:
            return self.instance.event.testrun
        else:
            return None

class StartTestRunEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.StartTestRunEvent
        fields = "__all__"

class PageNavigationEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.PageNavigationEvent
        fields = "__all__"

class GetInformationLineSerializer(ModelSerializer):
    class Meta:
        model  = models.GetInformationLine

        # Cannot use "__all__" here because that would mark the parent attribute as required.
        # But the parent shall be invisible to the client and be added during saving, instead.
        fields = ["id", "seqnr", "field", "icon", "label", "value"]
        read_only_fields = ["id"]

class GetInformationEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.GetInformationEvent
        fields = "__all__"

    # Must match the related_name of the relation
    lines = GetInformationLineSerializer(many=True, required=False)

    @transaction.atomic
    def create(self, validated_data):
        """Create nested event lines since DRF doesn't automatically save nested data"""
        lines_data = validated_data.pop("lines", None)
        event = super().create(validated_data)

        if lines_data is not None:
            for line_data in lines_data:
                event.lines.create(**line_data)

        return event

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update nested event lines since DRF doesn't automatically save nested data"""
        lines_data = validated_data.pop("lines", None)
        event = super().update(instance, validated_data)

        if lines_data is not None:
            event.lines.all().delete()

            for line_data in lines_data:
                event.lines.create(**line_data)

        return event

class LoadModelEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.LoadModelEvent
        fields = "__all__"

class SemanticSearchMatchSerializer(ModelSerializer):
    class Meta:
        model  = models.SemanticSearchMatch

        # Cannot use "__all__" here because that would mark the parent attribute as required.
        # But the parent shall be invisible to the client and be added during saving, instead.
        fields = ["seqnr", "text", "text_type", "similarity"]
        read_only_fields = ["id"]

class SemanticSearchResultSerializer(ModelSerializer):
    class Meta:
        model  = models.SemanticSearchResult

        # Cannot use "__all__" here because that would mark the parent attribute as required.
        # But the parent shall be invisible to the client and be added during saving, instead.
        fields = ["seqnr", "page_url", "page_title", "similarity"]
        read_only_fields = ["id"]

    # Must match the related_name of the relation
    matches = SemanticSearchMatchSerializer(many=True, required=False)

class SemanticSearchEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.SemanticSearchEvent
        fields = "__all__"

    # Must match the related_name of the relation
    results = SemanticSearchResultSerializer(many=True, required=False)

    @staticmethod
    def create_results(event, results_data):
        for result_data in results_data:
            matches_data = result_data.pop("matches", [])
            result = event.results.create(**result_data)

            for match_data in matches_data:
                result.matches.create(**match_data)

    @transaction.atomic
    def create(self, validated_data):
        """Create nested results and matches since DRF doesn't save nested data automatically."""
        results_data = validated_data.pop("results", [])
        event = super().create(validated_data)
        self.create_results(event, results_data)
        return event

    @transaction.atomic
    def update(self, instance, validated_data):
        """Replace nested results and matches when results are provided."""
        results_data = validated_data.pop("results", None)
        event = super().update(instance, validated_data)

        if results_data is not None:
            event.results.all().delete()
            self.create_results(event, results_data)

        return event

class RunPipelineEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.RunPipelineEvent
        fields = "__all__"

class StartChatEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.StartChatEvent
        fields = "__all__"

class ChatMessageEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.ChatMessageEvent
        fields = "__all__"

class QualityAssessmentSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.QualityAssessment
        fields = "__all__"

    def get_testrun(self, attrs):
        """``QualityAssessment`` is no event in itself, but is related to an event whose
        testrun must match the access code presented in the HTTP request header."""
        if (message := attrs.get("message", None)) is not None:
            return message.testrun
        elif self.instance is not None:
            return self.instance.message.testrun
        else:
            return None
