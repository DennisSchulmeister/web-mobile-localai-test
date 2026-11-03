# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .  import models
from .. import admin

from django                   import forms
from django.contrib.admin     import action
from django.contrib.admin     import ActionLocation
from django.contrib.admin     import StackedInline
from django.utils.translation import gettext_lazy as _

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
    
class AIModelAdmin(admin.CustomModelAdmin):
    model              = models.AIModel
    form               = AIModelAdminForm
    list_display       = ["model_id", "base_url", "batch"]
    list_display_links = ["model_id", "base_url", "batch"]
    ordering           = ["model_id"]
    actions            = ["test_model"]

    fieldsets = [
        (_("Connection"), {
            "fields": (
                "model_id",
                ("api_key", "base_url"),
            ),
        }),
        (_("Settings"), {
            "fields": (
                "batch",
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
        pass

class MessageInline(StackedInline):
    model = models.Message
    #fields = ["flownr", "msgnr", "role", "content"]
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
    ordering           = ["timestamp", "model"]
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
