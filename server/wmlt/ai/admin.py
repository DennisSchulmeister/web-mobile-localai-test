# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import logging

from .                        import actions, forms, models
from ..                       import admin

from django.contrib           import messages
from django.contrib.admin     import action
from django.contrib.admin     import ActionLocation
from django.contrib.admin     import display
from django.contrib.admin     import StackedInline
from django.contrib.admin     import TabularInline
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext

logger = logging.getLogger(__name__)

class TraceInline(TabularInline):
    model            = models.Trace
    fields           = ["timestamp", "model", "description"]
    readonly_fields  = ["timestamp", "model", "description"]
    extra            = 0
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False

class AIModelAdmin(admin.CustomModelAdmin):
    model              = models.AIModel
    form               = forms.AIModelAdminForm
    list_display       = ["model_id", "base_url"]
    list_display_links = ["model_id", "base_url"]
    ordering           = ["model_id"]
    actions            = ["test_model"]
    inlines            = [TraceInline]
    readonly_fields    = ["prompt_templates_display"]

    fieldsets = [
        (_("Connection"), {
            "fields": (
                "model_id",
                ("api_key", "base_url"),
            ),
        }),
        (_("Settings"), {
            "fields": (
                ("mode", "max_retries", "cache_size"),
                "kwargs",
            ),
        }),
        (_("Assigned Prompt Templates"), {
            "fields": ("prompt_templates_display",),
        }),
    ]

    @display(description=_("Prompt Templates"))
    def prompt_templates_display(self, obj):
        if obj is None or not obj.pk:
            return _("No prompt templates assigned.")

        prompt_templates = obj.prompt_templates.order_by("use_case", "seqnr", "role")
        return ", ".join(
            f"{template.get_use_case_display()} / {template.seqnr} / {template.role} / {template.description}"
            for template in prompt_templates
        ) or _("No prompt templates assigned.")

    @action(
        permissions        = ["change"],
        location           = ActionLocation.CHANGE_LIST,
        description        = _("Test selected AI Model"),
        description_plural = _("Test selected AI Models"),
    )
    def test_model(self, request, queryset):
        """Send and trace a test message to check if the model connection works."""
        try:
            result = actions.test_ai_models(queryset)
            count  = len(result)

            if count:
                self.message_user(
                    request,
                    ngettext(
                        "The AI Model was successfully tested. Its response is: %(last_text)s",
                        "%(count)d AI Models were successfully tested. The last response is: %(last_text)s",
                        count,
                    ) % {"count": count, "last_text": result[-1]["response"].text},
                    messages.SUCCESS,
                )
            else:
                self.message_user(request, _("Test failed. No response was generated."), messages.WARNING)
        except Exception as error:
            logger.exception("Error while testing AI Model")
            self.message_user(request, _("Error while testing AI Model: %s") % error, messages.ERROR)

class PromptTemplateAdmin(admin.CustomModelAdmin):
    model               = models.PromptTemplate
    form                = forms.PromptTemplateModelForm
    list_display        = ["use_case", "seqnr", "role", "description", "ai_models__model_id"]
    list_display_links  = ["use_case", "seqnr", "role", "description"]
    ordering            = ["use_case", "seqnr", "role"]
    list_filter         = ["use_case", "role", "ai_models"]
    filter_horizontal   = ["ai_models"]
    readonly_fields     = ["ai_models__model_id"]
    list_select_related = True

    fieldsets = [
        (_("Prompt"), {
            "fields": (
                ("use_case", "seqnr"),
                ("role", "description"),
                "content",
            ),
        }),
        (_("Assigned AI Models"), {
            "fields": (
                "ai_models",
            ),
            "description": _("Make sure to assign each use case and role at most once to each AI Model."),
        })
    ]

    @display(description=_("AI Models"))
    def ai_models__model_id(self, obj):
        return ", ".join(list(obj.ai_models.values_list("model_id", flat=True)))

class MessageInline(StackedInline):
    model = models.Message
    extra = 0

    fieldsets = [
        (None, {
            "fields": (
                ("flownr", "msgnr", "role"),
                "content"
            )
        })
    ]

class TraceAdmin(admin.CustomModelAdmin):
    model              = models.Trace
    list_display       = ["timestamp", "model", "description"]
    list_display_links = ["timestamp", "model", "description"]
    ordering           = ["-timestamp", "model"]
    list_filter        = ["timestamp", "model"]
    date_hierarchy     = "timestamp"
    inlines            = [MessageInline]

    fieldsets = [
        (_("Meta-Data"), {
            "fields": (
                ("timestamp", "model"),
                "description",
            ),
        }),
        (_("Token Usage"), {
            "fields": (
                ("prompt_tokens", "reasoning_tokens", "completion_tokens"),
            ),
        }),
    ]

admin.admin_site.register(models.AIModel,        AIModelAdmin)
admin.admin_site.register(models.PromptTemplate, PromptTemplateAdmin)
admin.admin_site.register(models.Trace,          TraceAdmin)
