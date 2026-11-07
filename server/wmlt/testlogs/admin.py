# Web/Mobile Test for Local AI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import logging

from .  import actions, models
from .. import admin

from django.contrib           import messages
from django.contrib.admin     import action
from django.contrib.admin     import ActionLocation
from django.contrib.admin     import display
from django.contrib.admin     import StackedInline
from django.contrib.admin     import TabularInline
from django.urls              import reverse
from django.utils.html        import format_html
from django.utils.formats     import date_format
from django.utils.translation import gettext_lazy as _

logger = logging.getLogger(__name__)

def _event_admin_url(admin_site, obj):
    """Return the concrete event's change URL."""
    model = models.EVENT_MODELS_BY_TYPE.get(obj.event_type)

    if model:
        return reverse(
            f"{admin_site.name}:{model._meta.app_label}_{model._meta.model_name}_change",
            args=[obj.pk],
        )
    return ""

class TestRunEventInline(TabularInline):
    model           = models.Event
    fields          = ["timestamp", "event_type_link"]
    readonly_fields = ["timestamp", "event_type_link"]
    ordering        = ["timestamp", "id"]
    extra           = 0

    @display(description=_("Event"))
    def event_type_link(self, obj):
        url = _event_admin_url(self.admin_site, obj)
        return format_html('<a href="{}">➡️ &nbsp; {}</a>', url, obj.get_event_type_display()) if url else ""

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

class TestRunAdmin(admin.CustomModelAdmin):
    model              = models.TestRun
    inlines             = [TestRunEventInline]
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
    list_display        = ["testrun", "timestamp", "event_type", "status", *testrun_display]
    list_display_links  = ["testrun", "timestamp", "event_type", "status", *testrun_display]
    list_select_related = True
    ordering            = ["testrun", "timestamp", "id"]
    list_filter         = ["event_type", "status", "timestamp", *testrun_filter]
    readonly_fields     = ["event_type", *testrun_readonly]
    date_hierarchy      = "timestamp"
    inlines             = [EventExceptionInline]

    fieldsets = [
        *testrun_fieldsets,
        (_("Event"), {
            "fields": (
                "timestamp",
                ("event_type", "status"),
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
    inlines            = [ReadOnlyEventExceptionInline]
    list_display       = [EventAdmin.list_display[0], EventAdmin.list_display[1], "event_type_link", *EventAdmin.list_display[3:]]
    list_display_links = ["event_type_link"]
    readonly_fields    = ["event_type_link"]

    @display(description="Event")
    def event_type_link(self, obj):
        url = _event_admin_url(self.admin_site, obj)
        return format_html('<a href="{}">➡️ &nbsp; {}</a>', url, obj.get_event_type_display()) if url else ""

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

event_fieldsets = [
    (_("Event"), {
        "fields": (
            "timestamp",
            ("event_type", "status"),
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
    list_display       = ["testrun", "timestamp", *testrun_display]
    list_display_links = ["testrun", "timestamp", *testrun_display]
    ordering           = ["testrun", "timestamp", "id"]
    list_filter        = ["timestamp", *testrun_filter]

    fieldsets = [
        *testrun_fieldsets,
        *event_fieldsets,
    ]

    fieldsets_add = [
        *testrun_fieldsets_add,
        *event_fieldsets_add,
    ]

class StopTestRunEventAdmin(EventAdmin):
    model              = models.StopTestRunEvent
    list_display       = ["testrun", "timestamp", *testrun_display]
    list_display_links = ["testrun", "timestamp", *testrun_display]
    ordering           = ["testrun", "timestamp", "id"]
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
    list_display       = ["testrun", "timestamp", "page_url", *testrun_display]
    list_display_links = ["testrun", "timestamp", "page_url", *testrun_display]
    ordering           = ["testrun", "timestamp", "id"]
    list_filter        = ["testrun", "timestamp", "page_url", *testrun_filter]

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
    list_display       = ["testrun", "timestamp", "engine_id", "engine_name", *testrun_display]
    list_display_links = ["testrun", "timestamp", "engine_id", "engine_name", *testrun_display]
    ordering           = ["testrun", "timestamp", "id"]
    list_filter        = ["testrun", "timestamp", "engine_id", "engine_name", *testrun_filter]
    inlines            = [GetInformationLineInline, *EventAdmin.inlines]

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
    list_display       = ["testrun", "timestamp", "engine_id", "model_id", "dtype", "device", *testrun_display]
    list_display_links = ["testrun", "timestamp", "engine_id", "model_id", "dtype", "device", *testrun_display]
    ordering           = ["testrun", "timestamp", "id"]
    list_filter        = ["testrun", "timestamp", "engine_id", "model_id", *testrun_filter]

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
        (_("Measurement"), {
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
        (_("Measurement"), {
            "fields": (
                "loadtime",
            ),
        }),
    ]

class SemanticSearchResultInline(TabularInline):
    model  = models.SemanticSearchResult
    fields = ("seqnr", "page_url", "page_title", "text", "text_type", "similarity")
    extra  = 0

class SemanticSearchEventAdmin(EventAdmin):
    model   = models.SemanticSearchEvent
    list_display       = ["testrun", "timestamp", "model", "query", *testrun_display]
    list_display_links = ["testrun", "timestamp", "model", "query", *testrun_display]
    ordering           = ["testrun", "timestamp", "id"]
    list_filter        = ["testrun", "timestamp", "model", *testrun_filter]
    inlines            = [SemanticSearchResultInline, *EventAdmin.inlines]

    fieldsets = [
        *testrun_fieldsets,
        *event_fieldsets,
        (_("Model"), {
            "fields": (
                "model",
            ),
        }),
        (_("Search Request"), {
            "fields": (
                "query",
                ("include_keywords", "include_sentences", "compare_embeddings", "compare_strings"),
            ),
        }),
    ]

    fieldsets_add = [
        *testrun_fieldsets_add,
        *event_fieldsets_add,
        (_("Model"), {
            "fields": (
                "model",
            ),
        }),
        (_("Search Request"), {
            "fields": (
                "query",
                ("include_keywords", "include_sentences", "compare_embeddings", "compare_strings"),
            ),
        }),
    ]

class RunPipelineEventAdmin(EventAdmin):
    model              = models.RunPipelineEvent
    list_display       = ["testrun", "timestamp", "model__pipeline", "model__model_id", "query", *testrun_display]
    list_display_links = ["testrun", "timestamp", "model__pipeline", "model__model_id", "query", *testrun_display]
    ordering           = ["testrun", "timestamp", "id"]
    list_filter        = ["testrun", "timestamp", "model__pipeline", "model__model_id", *testrun_filter]
    
    readonly_fields = [
        *EventAdmin.readonly_fields,
        "model__pipeline",
        "model__pipeline_display",
        "model__engine_id",
        "model__model_id",
        "model__dtype",
        "model__device",
    ]

    fieldsets = [
        *testrun_fieldsets,
        *event_fieldsets,
        (_("Model"), {
            "fields": (
                "model__pipeline_display",
                ("model__engine_id", "model__model_id"),
                ("model__dtype", "model__device"),
            ),
        }),
        (_("Context"), {
            "fields": (
                "page_url",
                "context",
            ),
        }),
        (_("Model Input"), {
            "fields": (
                "query",
                ("max_tokens", "source_language", "target_language"),
            ),
        }),
        (_("Model Output"), {
            "fields": (
                "result",
            ),
        }),
        (_("Measurement"), {
            "fields": (
                "runtime",
            ),
        }),
    ]

    fieldsets_add = [
        *testrun_fieldsets_add,
        *event_fieldsets_add,
        (_("Model and Context"), {
            "fields": (
                ("model", "page_url"),
                "context",
            ),
        }),
        (_("Model Input"), {
            "fields": (
                "query",
                ("max_tokens", "source_language", "target_language"),
            ),
        }),
        (_("Model Output"), {
            "fields": (
                "result",
            ),
        }),
        (_("Measurement"), {
            "fields": (
                "runtime",
            ),
        }),
    ]

    @display(description=_("Model ID"))
    def model__model_id(self, obj):
        return obj.model.model_id

    @display(description=_("Pipeline"))
    def model__pipeline(self, obj):
        return obj.model.pipeline

    @display(description=_("Pipeline"))
    def model__pipeline_display(self, obj):
        return obj.model.get_pipeline_display()

    @display(description=_("Engine ID"))
    def model__engine_id(self, obj):
        return obj.model.engine_id

    @display(description=_("Model ID"))
    def model__model_id(self, obj):
        return obj.model.model_id

    @display(description=_("Quantization"))
    def model__dtype(self, obj):
        return obj.model.dtype

    @display(description=_("Device"))
    def model__device(self, obj):
        return obj.model.device
    
class StartChatEventAdmin(EventAdmin):
    model              = models.StartChatEvent
    list_display       = ["testrun", "timestamp", "page_url", *testrun_display]
    list_display_links = ["testrun", "timestamp", "page_url", *testrun_display]
    ordering           = ["testrun", "timestamp", "id"]
    list_filter        = ["timestamp", "page_url", *testrun_filter]

    fieldsets = [
        *testrun_fieldsets,
        *event_fieldsets,
        (_("Start Chat"), {
            "fields": (
                "page_url",
            )
        }),
    ]

    fieldsets_add = [
        *testrun_fieldsets_add,
        *event_fieldsets_add,
        (_("Start Chat"), {
            "fields": (
                "page_url",
            )
        }),
    ]

quality_assessment_fieldsets = [
    (_("Meta-data"), {
        "fields": (
            "timestamp",
            ("judge_type", "judge_name", "ai_trace"),
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

class QualityAssessmentInline(StackedInline):
    model = models.QualityAssessment
    extra = 0

    fieldsets = quality_assessment_fieldsets

class ChatMessageEventAdmin(EventAdmin):
    model = models.ChatMessageEvent
    list_display       = ["testrun", "timestamp", "chat", "model", "user_message", *testrun_display]
    list_display_links = ["testrun", "timestamp", "chat", "model", "user_message", *testrun_display]
    ordering           = ["testrun", "timestamp", "id"]
    list_filter        = ["timestamp", "model__model_id", *testrun_filter]
    actions            = ["run_ai_quality_assessment"]
    inlines            = [QualityAssessmentInline, *EventAdmin.inlines]

    readonly_fields = [
        *EventAdmin.readonly_fields,
        "chat__page_url",
        "chat__timestamp_display",
        "model__pipeline",
        "model__pipeline_display",
        "model__engine_id",
        "model__model_id",
        "model__dtype",
        "model__device",
    ]

    fieldsets = [
        *testrun_fieldsets,
        *event_fieldsets,
        (_("Chat"), {
            "fields": (
                ("chat__page_url", "chat__timestamp_display"),
            ),
        }),
        (_("Model"), {
            "fields": (
                "model__pipeline_display",
                ("model__engine_id", "model__model_id"),
                ("model__dtype", "model__device"),
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
            ),
        }),
        (_("Measurement"), {
            "fields": (
                ("first_token", "runtime"),
                ("tokens", "tokens_per_second"),
            ),
        }),
    ]

    fieldsets_add = [
        *testrun_fieldsets_add,
        *event_fieldsets_add,
        (_("Chat and Model"), {
            "fields": (
                ("chat", "model"),
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
            ),
        }),
        (_("Measurement"), {
            "fields": (
                ("first_token", "runtime"),
                ("tokens", "tokens_per_second"),
            ),
        }),
    ]

    @display(description=_("Page URL"))
    def chat__page_url(self, obj):
        return obj.chat.page_url

    @display(description=_("Timestamp"))
    def chat__timestamp_display(self, obj):
        return date_format(obj.chat.timestamp, "DATETIME_FORMAT")

    @display(description=_("Model ID"))
    def model__model_id(self, obj):
        return obj.model.model_id

    @display(description=_("Pipeline"))
    def model__pipeline(self, obj):
        return obj.model.pipeline

    @display(description=_("Pipeline"))
    def model__pipeline_display(self, obj):
        return obj.model.get_pipeline_display()

    @display(description=_("Engine ID"))
    def model__engine_id(self, obj):
        return obj.model.engine_id

    @display(description=_("Model ID"))
    def model__model_id(self, obj):
        return obj.model.model_id

    @display(description=_("Quantization"))
    def model__dtype(self, obj):
        return obj.model.dtype

    @display(description=_("Device"))
    def model__device(self, obj):
        return obj.model.device

    @action(
        permissions        = ["change"],
        location           = ActionLocation.CHANGE_LIST,
        description        = _("Run AI Quality Assessment"),
        description_plural = _("Run AI Quality Assessments"),
    )
    def run_ai_quality_assessment(self, request, queryset):
        """Add missing AI quality assessments for the selected chat messages."""
        try:
            result = actions.run_ai_quality_assessment(queryset)
            self.message_user(
                request,
                _("Created Quality Assessments: %(created)i, Errors: %(errors)i")
                % {"created": result[0], "errors": result[1]},
                messages.SUCCESS,
            )
        except Exception as error:
            logger.exception("Error while running AI quality assessments")
            self.message_user(
                request,
                _("Error while running AI quality assessments: %(error)s") % {"error": error},
                messages.ERROR,
            )

class QualityAssessmentAdmin(admin.CustomModelAdmin):
    model              = models.QualityAssessment
    list_display_links = ["timestamp", "message__model__model_id"]
    list_filter        = ["timestamp", "message__model__model_id", "judge_type", "judge_name"]
    ordering           = ["timestamp", "id"]
    date_hierarchy     = "timestamp"

    list_display = [
        "timestamp",
        "message__model__model_id",
        "ai_trace",
        "correct_syntax_grade",
        "correct_lingua_grade",
        "correct_content_grade",
        "thematic_relevance_grade",
        "message_length_grade",
    ]

    fieldsets = quality_assessment_fieldsets

    def has_add_permission(self, request):
        return False

admin.admin_site.register(models.TestRun,             TestRunAdmin)
admin.admin_site.register(models.Event,               ReadOnlyEventAdmin)
admin.admin_site.register(models.EventException,      EventExceptionAdmin)
admin.admin_site.register(models.StartTestRunEvent,   StartTestRunEventAdmin)
admin.admin_site.register(models.StopTestRunEvent,    StopTestRunEventAdmin)
admin.admin_site.register(models.PageNavigationEvent, PageNavigationEventAdmin)
admin.admin_site.register(models.GetInformationEvent, GetInformationEventAdmin)
admin.admin_site.register(models.GetInformationLine,  GetInformationLineAdmin)
admin.admin_site.register(models.LoadModelEvent,      LoadModelEventAdmin)
admin.admin_site.register(models.SemanticSearchEvent, SemanticSearchEventAdmin)
admin.admin_site.register(models.RunPipelineEvent,    RunPipelineEventAdmin)
admin.admin_site.register(models.StartChatEvent,      StartChatEventAdmin)
admin.admin_site.register(models.ChatMessageEvent,    ChatMessageEventAdmin)
admin.admin_site.register(models.QualityAssessment,   QualityAssessmentAdmin)
