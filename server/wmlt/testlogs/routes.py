# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import typing
from . import viewsets

if typing.TYPE_CHECKING:
    from rest_framework.routers import DefaultRouter

def register_api_routes(router: DefaultRouter, prefix: str) -> None:
    router.register(f"{prefix}/test_runs",              viewsets.TestRunViewSet,             basename="test_run")
    router.register(f"{prefix}/events",                 viewsets.EventViewSet,               basename="event")
    router.register(f"{prefix}/event_exceptions",       viewsets.EventExceptionViewSet,      basename="event_exception")
    router.register(f"{prefix}/start_test_run_events",  viewsets.StartTestRunEventViewSet,   basename="start_test_run_event")
    router.register(f"{prefix}/page_navigation_events", viewsets.PageNavigationEventViewSet, basename="page_navigation_event")
    router.register(f"{prefix}/get_information_events", viewsets.GetInformationEventViewSet, basename="get_information_event")
    router.register(f"{prefix}/load_model_events",      viewsets.LoadModelEventViewSet,      basename="load_model_event")
    router.register(f"{prefix}/semantic_search_events", viewsets.SemanticSearchEventViewSet, basename="semantic_search_event")
    router.register(f"{prefix}/run_pipeline_events",    viewsets.RunPipelineEventViewSet,    basename="run_pipeline_event")
    router.register(f"{prefix}/start_chat_events",      viewsets.StartChatEventViewSet,      basename="start_chat_event")
    router.register(f"{prefix}/chat_message_events",    viewsets.ChatMessageEventViewSet,    basename="chat_message_event")
    router.register(f"{prefix}/quality_assessments",    viewsets.QualityAssessmentViewSet,   basename="quality_assessments")
