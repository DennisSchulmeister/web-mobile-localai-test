# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import logging

from .                        import client, models
from ..                       import admin

from django                   import forms
from django.contrib           import messages
from django.contrib.admin     import action
from django.contrib.admin     import ActionLocation
from django.contrib.admin     import StackedInline
from django.contrib.admin     import TabularInline
from django.utils.translation import gettext_lazy as _
from django.utils.translation import ngettext
from pydantic                 import BaseModel

logger = logging.getLogger(__name__)

class AIModelAdminForm(forms.ModelForm):
    """Hide API Key in the UI"""
    class Meta:
        model   = models.AIModel
        fields  = "__all__"
        widgets = {"api_key": forms.PasswordInput()}

    def __init__(self, *args, **kwargs):
        """Work around an UX problem of the password field and provide at least some visual
        feedback, when a saved model does have an API Key."""
        super().__init__(*args, **kwargs)

        if self.instance.pk and self.instance.api_key:
            self.fields["api_key"].help_text = _("Leave blank to keep the existing API Key.")

    def clean_api_key(self):
        """Restore saved API key when submitting the unchanged empty API key field."""
        api_key = self.cleaned_data["api_key"]
        return api_key or self.instance.api_key

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
    form               = AIModelAdminForm
    list_display       = ["model_id", "base_url"]
    list_display_links = ["model_id", "base_url"]
    ordering           = ["model_id"]
    actions            = ["test_model"]
    inlines            = [TraceInline]

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
    ]

    @action(
        permissions        = ["change"],
        location           = ActionLocation.CHANGE_LIST,
        description        = _("Test selected AI Model"),
        description_plural = _("Test selected AI Models"),
    )
    def test_model(self, request, queryset):
        """Send and trace a test message to check if the model connection works."""
        responses = 0
        last_text = ""

        class TestResponse(BaseModel):
            """Response to a test message"""
            text: str

        try:
            for model in queryset.all():
                if not model.model_id:
                    continue

                ai_client = client.get_ai_client(model.model_id)
                ai_client.start_trace(description=_("Test AI Model"))

                response = ai_client.create(
                    messages = [{
                        "role":    "user",
                        "content": _("This is a test. Please acknowledge.")
                    }],
                    response_model = TestResponse,
                )

                if response and response.text:
                    responses += 1
                    last_text  = response.text

                ai_client.save_trace()

            self.message_user(
                request,
                ngettext(
                    "The AI Model was successfully tested. Its response is: %(last_text)s",
                    "%(count)d AI Models were successfully tested. The last response is: %(last_text)s",
                    responses,
                ) % {"count": responses, "last_text": last_text},
                messages.SUCCESS,
            )
        except Exception as error:
            logger.exception("Error while testing AI Model")
            self.message_user(request, _("Error while testing AI Model: %s") % error, messages.ERROR)

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

admin.admin_site.register(models.AIModel, AIModelAdmin)
admin.admin_site.register(models.Trace,   TraceAdmin)
