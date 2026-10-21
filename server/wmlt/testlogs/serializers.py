# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .                          import models
from ..auth.serializers         import AccessCodeCheckingModelSerializer

from rest_framework.serializers import ValidationError

class TestRunSerializer(AccessCodeCheckingModelSerializer):
    class Meta:
        model  = models.TestRun
        fields = "__all__"

    def get_testrun_access_code(self, attrs):
        """Since this is the testrun itself, the access code is not read from
        database but the request body here.
        """
        return attrs.get("access_code", None)

class AbstractEventSerializer(AccessCodeCheckingModelSerializer):
    def get_testrun(self, attrs):
        if (testrun_pk := attrs.get("testrun", None) is not None):
            try:
                return models.TestRun.objects.get(pk = testrun_pk)
            except models.TestRun.DoesNotExist as error:
                detail = error.message_dict if hasattr(error, "message_dict") else error.messages
                raise ValidationError(detail) from error
        else:
            return None

    def get_testrun_access_code(self, attrs):
        if (testrun := self.get_testrun(attrs) is not None):
            return testrun.access_code
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
        if (event_pk := attrs.get("event", None)) is not None:
            try:
                event = models.Event.objects.get(pk = event_pk)
            except models.Event.DoesNotExist as error:
                detail = error.message_dict if hasattr(error, "message_dict") else error.messages
                raise ValidationError(detail) from error

            return event.testrun
        else:
            return None

class PageNavigationEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.PageNavigationEvent
        fields = "__all__"

class GetInformationEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.GetInformationEvent
        fields = "__all__"

class LoadModelEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.LoadModelEvent
        fields = "__all__"

class SemanticSearchEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.SemanticSearchEvent
        fields = "__all__"

class RunPipelineEventSerializer(AbstractEventSerializer):
    class Meta:
        model  = models.RunPipelineEvent
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
        if (message_pk := attrs.get("message", None)) is not None:
            try:
                message = models.Event.objects.get(pk = message_pk)
            except models.Event.DoesNotExist as error:
                detail = error.message_dict if hasattr(error, "message_dict") else error.messages
                raise ValidationError(detail) from error

            return message.testrun
        else:
            return None
