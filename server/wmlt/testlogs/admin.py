# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .  import models
from .. import admin

from django.contrib.admin     import ModelAdmin
from django.contrib.admin     import StackedInline
from django.contrib.admin     import TabularInline
from django.utils.translation import gettext_lazy as _

class TestRunAdmin(ModelAdmin):
    model              = models.TestRun
    list_display       = ["start_date", "app_type", "device_type", "device_model", "os_family", "os_version", "browser_family", "browser_version", "remarks"]
    list_display_links = ["start_date", "app_type", "device_type", "device_model", "os_family", "os_version", "browser_family", "browser_version", "remarks"]
    ordering           = ["start_date", "id"]
    list_filter        = ["start_date", "app_type", "device_type", "os_family", "browser_family"]

    fieldsets = [
        (None, {
            "fields": (
                "start_date",
                ("access_code", "app_type"),
                
            ),
        }),
        (_("Device Information"), {
            "fields": (
                ("device_type", "device_model"),
                ("os_family", "os_version"),
                ("browser_family", "browser_version"),
            ),
        }),
        (_("Others"), {
            "fields": (
                "remarks",
            ),
        }),
    ]

class EventExceptionInline(TabularInline):
    model = models.EventException
    extra = 0

class ReadOnlyEventExceptionInline(EventExceptionInline):
    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

class EventAdmin(ModelAdmin):
    model              = models.Event
    list_display       = ["timestamp", "testrun", "event_type"]
    list_display_links = ["timestamp", "testrun", "event_type"]
    ordering           = ["timestamp", "id"]
    list_filter        = ["event_type", "timestamp"]
    readonly_fields    = ["event_type"]
    inlines            = [EventExceptionInline]

    fieldsets = [
        (None, {
            "fields": (
                "testrun",
                "timestamp",
                "event_type",
            ),
        }),
    ]

class ReadOnlyEventAdmin(EventAdmin):
    inlines = [ReadOnlyEventExceptionInline]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

class EventExceptionAdmin(ModelAdmin):
    model              = models.EventException
    list_display       = ["event", "seqnr", "name", "message"]
    list_display_links = ["event", "seqnr", "name", "message"]
    ordering           = ["event", "seqnr"]
    search_fields      = ["name", "message", "stack"]

    fieldsets = [
        (None, {
            "fields": (
                ("event", "seqnr"),
                "name",
                "message",
                "stack",
            ),
        }),
    ]

class StartTestRunEventAdmin(EventAdmin):
    model = models.StartTestRunEvent

class PageNavigationEventAdmin(EventAdmin):
    model = models.PageNavigationEvent

    fieldsets = [
        (None, {
            "fields": (
                "testrun",
                "timestamp",
                "event_type",
                "page_url",
            ),
        }),
    ]

class GetInformationLineInline(TabularInline):
    model = models.GetInformationLine
    fields = ("seqnr", "field", "icon", "label", "value")
    extra = 0

class GetInformationEventAdmin(EventAdmin):
    model   = models.GetInformationEvent
    inlines = [EventExceptionInline, GetInformationLineInline]

    fieldsets = [
        (None, {
            "fields": (
                "testrun",
                "timestamp",
                "event_type",
                ("engine_id", "engine_name"),
            ),
        }),
    ]

class GetInformationLineAdmin(ModelAdmin):
    model              = models.GetInformationLine
    list_display       = ["parent", "seqnr", "field", "label", "value"]
    list_display_links = ["parent", "seqnr", "field", "label", "value"]
    ordering           = ["parent", "seqnr"]

    fieldsets = [
        (_("Parent Relation"), {
            "fields": (
                ("parent", "seqnr"),
            ),
        }),
        (_("Information"), {
            "fields": (
                ("field", "icon"),
                ("label", "value"),
            ),
        }),
    ]

class LoadModelEventAdmin(EventAdmin):
    model = models.LoadModelEvent

    fieldsets = [
        (None, {
            "fields": (
                "testrun",
                "timestamp",
                "event_type",
            ),
        }),
        (_("Model Parameters"), {
            "fields": (
                "pipeline",
                ("engine_id", "model_id"),
                ("dtype", "device"),
            ),
        }),
        (_("Measurements"), {
            "fields": (
                "loadtime",
            ),
        }),
    ]

class SemanticSearchMatchInline(TabularInline):
    model = models.SemanticSearchMatch
    fields = ("seqnr", "text", "text_type", "similarity")
    extra = 0

class SemanticSearchResultInline(TabularInline):
    model = models.SemanticSearchResult
    fields = ("seqnr", "page_url", "page_title", "similarity")
    extra = 0

class SemanticSearchEventAdmin(EventAdmin):
    model   = models.SemanticSearchEvent
    inlines = [EventExceptionInline, SemanticSearchResultInline]

    fieldsets = [
        (None, {
            "fields": (
                "testrun",
                "timestamp",
                "event_type",
            ),
        }),
        (_("Model"), {
            "fields": (
                "model",
            ),
        }),
        (_("Search Request"), {
            "fields": (
                "query",
                ("include_keywords", "include_sentences"),
                ("compare_embeddings", "compare_strings"),
            ),
        }),
    ]

class SemanticSearchResultAdmin(ModelAdmin):
    model              = models.SemanticSearchResult
    list_display       = ["parent", "seqnr", "page_title", "similarity"]
    list_display_links = ["parent", "seqnr", "page_title", "similarity"]
    ordering           = ["parent", "seqnr"]
    inlines            = [SemanticSearchMatchInline]

    fieldsets = [
        (_("Parent Relation"), {
            "fields": (
                ("parent", "seqnr"),
            ),
        }),
        (_("Matched Page"), {
            "fields": (
                "page_url",
                ("page_title", "similarity"),
            ),
        }),
    ]

class RunPipelineEventAdmin(EventAdmin):
    model = models.RunPipelineEvent

    fieldsets = [
        (None, {
            "fields": (
                "testrun",
                "timestamp",
                "event_type",
            ),
        }),
        (_("Model and Page"), {
            "fields": (
                ("model", "page_url"),
            ),
        }),
        (_("Model Input"), {
            "fields": (
                "query",
                ("max_tokens", "source_language", "target_language"),
                "context",
            ),
        }),
        (_("Model Output"), {
            "fields": (
                "result",
                "runtime",
            ),
        })
    ]

class StartChatEventAdmin(EventAdmin):
    model = models.StartChatEvent

class QualityAssessmentInline(StackedInline):
    model = models.QualityAssessment
    extra = 0

    fieldsets = [
        (_("Assessment Meta-data"), {
            "fields": (
                "timestamp",
                ("judge_type", "judge_name"),
            ),
        }),
        (_("Assessment"), {
            "fields": (
                ("correct_syntax_grade", "correct_syntax_note"),
                ("correct_lingua_grade", "correct_lingua_note"),
                ("correct_content_grade", "correct_content_note"),
                ("thematic_relevance_grade", "thematic_relevance_note"),
                ("message_length_grade", "message_length_note"),
            ),
        }),
    ]

class ChatMessageEventAdmin(EventAdmin):
    model = models.ChatMessageEvent
    inlines = [EventExceptionInline, QualityAssessmentInline]

    fieldsets = [
        (None, {
            "fields": (
                "testrun",
                "timestamp",
                "event_type",
            ),
        }),
        (_("Model and Chat Log"), {
            "fields": (
                ("model", "chat"),
            ),
        }),
        (_("Model Input"), {
            "fields": (
                ("user_message", "context"),
                ("max_tokens", "sampling"),
            ),
        }),
        (_("Model Output"), {
            "fields": (
                "assistant_message",
                ("first_token", "runtime"),
                ("tokens", "tokens_per_second"),
            ),
        }),
    ]

class QualityAssessmentAdmin(ModelAdmin):
    model              = models.QualityAssessment
    list_display       = ["timestamp", "message", "judge_type", "judge_name"]
    list_display_links = ["timestamp", "message", "judge_type", "judge_name"]
    ordering           = ["timestamp", "id"]
    list_filter        = ["judge_type", "timestamp"]

    fieldsets = [
        (_("Assessed Message"), {
            "fields": (
                "message",
            ),
        }),
        (_("Assessment Meta-data"), {
            "fields": (
                "timestamp",
                ("judge_type", "judge_name"),
            ),
        }),
        (_("Assessment"), {
            "fields": (
                ("correct_syntax_grade", "correct_syntax_note"),
                ("correct_lingua_grade", "correct_lingua_note"),
                ("correct_content_grade", "correct_content_note"),
                ("thematic_relevance_grade", "thematic_relevance_note"),
                ("message_length_grade", "message_length_note"),
            ),
        }),
    ]

admin.admin_site.register(models.TestRun,              TestRunAdmin)
admin.admin_site.register(models.Event,                ReadOnlyEventAdmin)
admin.admin_site.register(models.EventException,       EventExceptionAdmin)
admin.admin_site.register(models.StartTestRunEvent,    StartTestRunEventAdmin)
admin.admin_site.register(models.PageNavigationEvent,  PageNavigationEventAdmin)
admin.admin_site.register(models.GetInformationEvent,  GetInformationEventAdmin)
admin.admin_site.register(models.GetInformationLine,   GetInformationLineAdmin)
admin.admin_site.register(models.LoadModelEvent,       LoadModelEventAdmin)
admin.admin_site.register(models.SemanticSearchEvent,  SemanticSearchEventAdmin)
admin.admin_site.register(models.SemanticSearchResult, SemanticSearchResultAdmin)
admin.admin_site.register(models.RunPipelineEvent,     RunPipelineEventAdmin)
admin.admin_site.register(models.StartChatEvent,       StartChatEventAdmin)
admin.admin_site.register(models.ChatMessageEvent,     ChatMessageEventAdmin)
admin.admin_site.register(models.QualityAssessment,    QualityAssessmentAdmin)
