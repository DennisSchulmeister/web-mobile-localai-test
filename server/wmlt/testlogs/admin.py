# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .  import models
from .. import admin

from django.contrib.admin     import display
from django.contrib.admin     import StackedInline
from django.contrib.admin     import TabularInline
from django.utils.formats     import date_format
from django.utils.translation import gettext_lazy as _

class TestRunAdmin(admin.CustomModelAdmin):
    model              = models.TestRun
    list_display       = ["start_date", "access_code", "app_type", "device_type", "device_model", "os_family", "os_version", "browser_family", "browser_version", "remarks"]
    list_display_links = ["start_date", "access_code", "app_type", "device_type", "device_model", "os_family", "os_version", "browser_family", "browser_version", "remarks"]
    ordering           = ["start_date", "id"]
    list_filter        = ["start_date", "app_type", "device_type", "os_family", "browser_family"]
    date_hierarchy     = "start_date"

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

testrun_display  = ["testrun__access_code", "testrun__app_type", "testrun__device_type", "testrun__browser_family", "testrun__os_family"]
testrun_filter   = ["testrun__app_type", "testrun__device_type", "testrun__browser_family", "testrun__os_family"]

testrun_readonly = [
    "testrun__start_date",
    "testrun__start_date_display",
    "testrun__access_code",
    "testrun__app_type",
    "testrun__app_type_display",
    "testrun__device_type",
    "testrun__device_type_display",
    "testrun__device_model",
    "testrun__os_family",
    "testrun__os_family_display",
    "testrun__os_version",
    "testrun__browser_family",
    "testrun__browser_family_display",
    "testrun__browser_version",
    "testrun__remarks",
]

testrun_fieldsets = [
    (_("Test Run"), {
        "fields": (
            ("testrun", "testrun__start_date_display"),
            ("testrun__access_code", "testrun__app_type_display"),
            ("testrun__device_type_display", "testrun__device_model"),
            ("testrun__os_family_display", "testrun__os_version"),
            ("testrun__browser_family_display", "testrun__browser_version"),
            "testrun__remarks",
        ),
    }),
]

testrun_fieldsets_add = [
    (_("Test Run"), {
        "fields": (
            "testrun",
        )
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

class EventAdmin(admin.CustomModelAdmin):
    model               = models.Event
    list_display        = ["timestamp", "testrun", "event_type", *testrun_display]
    list_display_links  = ["timestamp", "testrun", "event_type", *testrun_display]
    list_select_related = True
    ordering            = ["timestamp", "id"]
    list_filter         = ["event_type", "timestamp", *testrun_filter]
    readonly_fields     = ["event_type", *testrun_readonly]
    date_hierarchy      = "timestamp"
    inlines             = [EventExceptionInline]

    fieldsets = [
        *testrun_fieldsets,
        (_("Event"), {
            "fields": (
                ("timestamp", "event_type"),
            ),
        }),
    ]

    # To make the testrun fields available to change forms
    @display(description=_("Start Date"))
    def testrun__start_date(self, obj):
        return obj.testrun.start_date
    
    @display(description=_("Start Date"))
    def testrun__start_date_display(self, obj):
        return date_format(obj.testrun.start_date, "DATETIME_FORMAT")

    @display(description=_("Access Code"))
    def testrun__access_code(self, obj):
        return obj.testrun.access_code

    @display(description=_("App Type"))
    def testrun__app_type(self, obj):
        return obj.testrun.app_type

    @display(description=_("App Type"))
    def testrun__app_type_display(self, obj):
        return obj.testrun.get_app_type_display()

    @display(description=_("Device Type"))
    def testrun__device_type(self, obj):
        return obj.testrun.device_type

    @display(description=_("Device Type"))
    def testrun__device_type_display(self, obj):
        return obj.testrun.get_device_type_display()

    @display(description=_("Device Model"))
    def testrun__device_model(self, obj):
        return obj.testrun.device_model

    @display(description=_("Operating System Family"))
    def testrun__os_family(self, obj):
        return obj.testrun.os_family
    
    @display(description=_("Operating System Family"))
    def testrun__os_family_display(self, obj):
        return obj.testrun.get_os_family_display()

    @display(description=_("Operating System Version"))
    def testrun__os_version(self, obj):
        return obj.testrun.os_version

    @display(description=_("Browser Family"))
    def testrun__browser_family(self, obj):
        return obj.testrun.browser_family

    @display(description=_("Browser Family"))
    def testrun__browser_family_display(self, obj):
        return obj.testrun.get_browser_family_display()
    
    @display(description=_("Browser Version"))
    def testrun__browser_version(self, obj):
        return obj.testrun.browser_version

    @display(description=_("Remarks"))
    def testrun__remarks(self, obj):
        return obj.testrun.remarks

class ReadOnlyEventAdmin(EventAdmin):
    inlines = [ReadOnlyEventExceptionInline]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

event_fieldsets = [
    (_("Event"), {
        "fields": (
            "event_type",
            "timestamp",
        ),
    }),
]

event_fieldsets_add = event_fieldsets

class EventExceptionAdmin(admin.CustomModelAdmin):
    model              = models.EventException
    list_display       = ["event__testrun", "event__timestamp", "event__event_type", "seqnr", "name", "message"]
    list_display_links = ["event__testrun", "event__timestamp", "event__event_type", "seqnr", "name", "message"]
    ordering           = ["event__testrun", "event__timestamp", "event__event_type", "seqnr"]
    search_fields      = ["name", "message", "stack"]

    readonly_fields = [
        "event__testrun",
        "event__testrun__start_date",
        "event__testrun__start_date_display",
        "event__testrun__access_code",
        "event__testrun__app_type",
        "event__testrun__app_type_display",
        "event__testrun__device_type",
        "event__testrun__device_type_display",
        "event__testrun__device_model",
        "event__testrun__os_family",
        "event__testrun__os_family_display",
        "event__testrun__os_version",
        "event__testrun__browser_family",
        "event__testrun__browser_family_display",
        "event__testrun__browser_version",
        "event__testrun__remarks",
    ]

    fieldsets = [
        (_("Test Run"), {
            "fields": (
                ("event__testrun", "event__testrun__start_date_display"),
                ("event__testrun__access_code", "event__testrun__app_type_display"),
                ("event__testrun__device_type_display", "event__testrun__device_model"),
                ("event__testrun__os_family_display", "event__testrun__os_version"),
                ("event__testrun__browser_family_display", "event__testrun__browser_version"),
                "event__testrun__remarks",
            ),
        }),
        (_("Event"), {
            "fields": (
                "event",
            ),
        }),
        (_("Exception"), {
            "fields": (
                "seqnr",
                ("name", "message"),
                "stack",
            ),
        }),
    ]

    fieldsets_add = [
        (_("Event"), {
            "fields": (
                "event",
            ),
        }),
        (_("Exception"), {
            "fields": (
                "seqnr",
                ("name", "message"),
                "stack",
            ),
        }),
    ]

    @display(description=_("Test Run"))
    def event__testrun(self, obj):
        return obj.event.testrun
    
    @display(description=_("Start Date"))
    def event__testrun__start_date(self, obj):
        return obj.event.testrun.start_date
    
    @display(description=_("Start Date"))
    def event__testrun__start_date_display(self, obj):
        return date_format(obj.event.testrun.start_date, "DATETIME_FORMAT")

    @display(description=_("Access Code"))
    def event__testrun__access_code(self, obj):
        return obj.event.testrun.access_code

    @display(description=_("App Type"))
    def event__testrun__app_type(self, obj):
        return obj.event.testrun.app_type
    
    @display(description=_("App Type"))
    def event__testrun__app_type_display(self, obj):
        return obj.event.testrun.get_app_type_display()

    @display(description=_("Device Type"))
    def event__testrun__device_type(self, obj):
        return obj.event.testrun.device_type
    
    @display(description=_("Device Type"))
    def event__testrun__device_type_display(self, obj):
        return obj.event.testrun.get_device_type_display()

    @display(description=_("Device Model"))
    def event__testrun__device_model(self, obj):
        return obj.event.testrun.device_model

    @display(description=_("Operating System Family"))
    def event__testrun__os_family(self, obj):
        return obj.event.testrun.os_family
    
    @display(description=_("Operating System Family"))
    def event__testrun__os_family_display(self, obj):
        return obj.event.testrun.get_os_family_display()

    @display(description=_("Operating System Version"))
    def event__testrun__os_version(self, obj):
        return obj.event.testrun.os_version

    @display(description=_("Browser Family"))
    def event__testrun__browser_family(self, obj):
        return obj.event.testrun.browser_family
    
    @display(description=_("Browser Family"))
    def event__testrun__browser_family_display(self, obj):
        return obj.event.testrun.get_browser_family_display()

    @display(description=_("Browser Version"))
    def event__testrun__browser_version(self, obj):
        return obj.event.testrun.browser_version

    @display(description=_("Remarks"))
    def event__testrun__remarks(self, obj):
        return obj.event.testrun.remarks

class StartTestRunEventAdmin(EventAdmin):
    model              = models.StartTestRunEvent
    list_display       = ["timestamp", "testrun", *testrun_display]
    list_display_links = ["timestamp", "testrun", *testrun_display]
    ordering           = ["timestamp", "id"]
    list_filter        = ["timestamp", *testrun_filter]

    fieldsets = [
        *testrun_fieldsets,
        *event_fieldsets,
    ]

    fieldsets_add = [
        *testrun_fieldsets_add,
        *event_fieldsets_add,
    ]

class PageNavigationEventAdmin(EventAdmin):
    model              = models.PageNavigationEvent
    list_display       = ["timestamp", "testrun", "page_url", *testrun_display]
    list_display_links = ["timestamp", "testrun", "page_url", *testrun_display]
    ordering           = ["timestamp", "testrun", "id"]
    list_filter        = ["timestamp", "testrun", "page_url", *testrun_filter]

    fieldsets = [
        *testrun_fieldsets,
        *event_fieldsets,
        (_("Navigation"), {
            "fields": (
                "page_url",
            ),
        }),
    ]

    fieldsets_add = [
        *testrun_fieldsets_add,
        *event_fieldsets_add,
        (_("Navigation"), {
            "fields": (
                "page_url",
            ),
        }),
    ]

class GetInformationLineInline(TabularInline):
    model  = models.GetInformationLine
    fields = ("seqnr", "icon", "field", "label", "value")
    extra  = 0

class GetInformationEventAdmin(EventAdmin):
    model              = models.GetInformationEvent
    list_display       = ["timestamp", "testrun", "engine_id", "engine_name", *testrun_display]
    list_display_links = ["timestamp", "testrun", "engine_id", "engine_name", *testrun_display]
    ordering           = ["timestamp", "testrun", "id"]
    list_filter        = ["timestamp", "testrun", "engine_id", "engine_name", *testrun_filter]
    inlines            = [GetInformationLineInline, EventExceptionInline]

    fieldsets = [
        *testrun_fieldsets,
        *event_fieldsets,
        (_("Get Information"), {
            "fields": (
                ("engine_id", "engine_name"),
            ),
        }),
    ]

    fieldsets_add = [
        *testrun_fieldsets_add,
        *event_fieldsets_add,
        (_("Get Information"), {
            "fields": (
                ("engine_id", "engine_name"),
            ),
        }),
    ]

class GetInformationLineAdmin(admin.CustomModelAdmin):
    model              = models.GetInformationLine
    list_display       = ["parent", "seqnr", "icon", "field", "label", "value"]
    list_display_links = ["parent", "seqnr", "icon", "field", "label", "value"]
    ordering           = ["parent", "seqnr"]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

class LoadModelEventAdmin(EventAdmin):
    model              = models.LoadModelEvent
    list_display       = ["timestamp", "testrun", "engine_id", "model_id", "dtype", "device", *testrun_display]
    list_display_links = ["timestamp", "testrun", "engine_id", "model_id", "dtype", "device", *testrun_display]
    ordering           = ["timestamp", "testrun", "id"]
    list_filter        = ["timestamp", "testrun", "engine_id", "model_id", *testrun_filter]

    fieldsets = [
        *testrun_fieldsets,
        *event_fieldsets,
        (_("Load Model"), {
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

    fieldsets_add = [
        *testrun_fieldsets_add,
        *event_fieldsets_add,
        (_("Load Model"), {
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

class SemanticSearchResultAdmin(admin.CustomModelAdmin):
    model              = models.SemanticSearchResult
    list_display       = ["parent", "seqnr", "page_title", "similarity"]
    list_display_links = ["parent", "seqnr", "page_title", "similarity"]
    ordering           = ["parent", "seqnr"]
    inlines            = [SemanticSearchMatchInline]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

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

class QualityAssessmentAdmin(admin.CustomModelAdmin):
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
