# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .              import models, serializers
from rest_framework import viewsets

class TestRunViewSet(viewsets.ModelViewSet):
    queryset         = models.TestRun.objects.all()
    serializer_class = serializers.TestRunSerializer

    def get_queryset(self):
        access_code = getattr(self.request, "access_code", None)

        if access_code is not None:
            return self.queryset.filter(access_code__access_code = access_code)
        else:
            return self.queryset

class AbstractEventViewSet(viewsets.ModelViewSet):
    def get_testrun_lookup_path(self):
        return "testrun"

    def get_queryset(self):
        access_code = getattr(self.request, "access_code", None)

        if access_code is not None:
            testrun = self.get_testrun_lookup_path()
            filter  = {t"{testrun}__access_code__access_code": access_code}

            return self.queryset.objects.filter(**filter)
        else:
            return self.queryset.objects.all()

class EventViewSet(AbstractEventViewSet):
    queryset         = models.Event.objects.all()
    serializer_class = serializers.EventSerializer

class EventExceptionViewSet(AbstractEventViewSet):
    queryset         = models.EventException.objects.all()
    serializer_class = serializers.EventExceptionSerializer

    def get_testrun_lookup_path(self):
        """``EventException`` is no event in itself, but is related to an event whose testrun
        must match the access code presented in the HTTP request header."""
        return "event__testrun"

class StartTestRunEventViewSet(AbstractEventViewSet):
    queryset         = models.StartTestRunEvent.objects.all()
    serializer_class = serializers.StartTestRunEventSerializer

class PageNavigationEventViewSet(AbstractEventViewSet):
    queryset         = models.PageNavigationEvent.objects.all()
    serializer_class = serializers.PageNavigationEventSerializer

class GetInformationEventViewSet(AbstractEventViewSet):
    queryset         = models.GetInformationEvent.objects.all()
    serializer_class = serializers.GetInformationEventSerializer

class LoadModelEventViewSet(AbstractEventViewSet):
    queryset         = models.LoadModelEvent.objects.all()
    serializer_class = serializers.LoadModelEventSerializer

class SemanticSearchEventViewSet(AbstractEventViewSet):
    queryset         = models.SemanticSearchEvent.objects.all()
    serializer_class = serializers.SemanticSearchEventSerializer

class RunPipelineEventViewSet(AbstractEventViewSet):
    queryset         = models.RunPipelineEvent.objects.all()
    serializer_class = serializers.RunPipelineEventSerializer

class StartChatEventViewSet(AbstractEventViewSet):
    queryset         = models.StartChatEvent.objects.all()
    serializer_class = serializers.StartChatEventSerializer

class ChatMessageEventViewSet(AbstractEventViewSet):
    queryset         = models.ChatMessageEvent.objects.all()
    serializer_class = serializers.ChatMessageEventSerializer

class QualityAssessmentViewSet(AbstractEventViewSet):
    queryset         = models.QualityAssessment.objects.all()
    serializer_class = serializers.QualityAssessmentSerializer

    def get_testrun_lookup_path(self):
        """``QualityAssessment`` is no event in itself, but is related to an event whose
        testrun must match the access code presented in the HTTP request header."""
        return "message__testrun"
