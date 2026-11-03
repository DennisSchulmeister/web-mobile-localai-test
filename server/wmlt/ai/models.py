# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.core.exceptions   import ValidationError
from django.db                import models
from django.utils             import timezone
from django.utils.formats     import date_format
from django.utils.translation import gettext_lazy as _
from instructor               import Mode

def is_dict(value):
    if not isinstance(value, dict):
        raise ValidationError(_("The field must be empty or a JSON object."))

class AIModel(models.Model):
    """API keys and connection data for AI models"""
    class Mode(models.TextChoices):
        TOOLS          = str(Mode.TOOLS),           _("Tool Calling")
        JSON_SCHEMA    = str(Mode.JSON_SCHEMA),     _("JSON Schema")
        MD_JSON        = str(Mode.MD_JSON),         _("Extract JSON from Markdown")
        PARALLEL_TOOLS = str(Mode.PARALLEL_TOOLS),  _("Parallel Tool Calling")
        RESPONSE_TOOLS = str(Mode.RESPONSES_TOOLS), _("OpenAI Responses API Tools")

    model_id    = models.CharField(_("Model ID"), max_length=100, unique=True, help_text=_("See https://python.useinstructor.com/integrations/#getting-started"))
    api_key     = models.CharField(_("API Key"), max_length=255, blank=True)
    base_url    = models.URLField(_("Base URL"), blank=True, help_text=_("When different from the default base URL."))
    mode        = models.CharField(_("Call Mode"), blank=True, choices=Mode, help_text=_("Normally you shouldn't need to set this value."))
    batch       = models.BooleanField(_("Batch Mode"), help_text=_("Enabling this saves costs but requests take longer to process."))
    cache_size  = models.IntegerField(_("Response Cache Size"), blank=True, null=True, help_text=_("Setting this value enables the built-in response cache."))
    max_retries = models.IntegerField(_("Maximum Retries"), blank=True, null=True, default=2)
    kwargs      = models.JSONField(_("Provider-specific Parameters"), blank=True, default=dict, validators=[is_dict])

    class Meta:
        verbose_name        = _("AI Model")
        verbose_name_plural = _("AI Models")
        ordering            = ["model_id"]

    def __str__(self):
        return self.model_id

class Trace(models.Model):
    """Logged message traces"""
    timestamp         = models.DateTimeField(_("Timestamp"), default=timezone.now)
    model             = models.ForeignKey(AIModel, on_delete=models.CASCADE)
    description       = models.CharField(_("Description"), max_length=255, blank=True)
    prompt_tokens     = models.IntegerField(_("Prompt Tokens"), null=True)
    reasoning_tokens  = models.IntegerField(_("Reasoning Tokens"), null=True)
    completion_tokens = models.IntegerField(_("Completion Tokens"), null=True)

    class Meta:
        verbose_name        = _("Message Trace")
        verbose_name_plural = _("Message Traces")
        ordering            = ["timestamp", "model"]
        get_latest_by       = "timestamp"

    def __str__(self):
        return date_format(self.timestamp, "DATETIME_FORMAT")

class Message(models.Model):
    """Logged messages"""
    trace   = models.ForeignKey(Trace, on_delete=models.CASCADE)
    flownr  = models.IntegerField(_("Flow Number"), help_text=_("One request/response exchange"))
    msgnr   = models.IntegerField(_("Message Number"), help_text=_("Message number within a flow"))
    role    = models.CharField(_("Role"), max_length=25)
    content = models.TextField(_("Content"), blank=True)

    class Meta:
        verbose_name        = _("Message")
        verbose_name_plural = _("Messages")
        ordering            = ["trace", "flownr", "msgnr"]

    def __str__(self):
        return f"{self.trace}: {self.flownr}-{self.msgnr}"
