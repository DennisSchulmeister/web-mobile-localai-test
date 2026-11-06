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
from instructor               import Mode as ModeInspector

def is_dict(value):
    if not isinstance(value, dict):
        raise ValidationError(_("The field must be empty or a JSON object."))

class AIModel(models.Model):
    """API keys and connection data for AI models"""
    class Mode(models.TextChoices):
        TOOLS          = str(ModeInspector.TOOLS),           _("Tool Calling")
        JSON_SCHEMA    = str(ModeInspector.JSON_SCHEMA),     _("JSON Schema")
        MD_JSON        = str(ModeInspector.MD_JSON),         _("Extract JSON from Markdown")
        PARALLEL_TOOLS = str(ModeInspector.PARALLEL_TOOLS),  _("Parallel Tool Calling")
        RESPONSE_TOOLS = str(ModeInspector.RESPONSES_TOOLS), _("OpenAI Responses API Tools")

    model_id    = models.CharField(_("Model ID"), max_length=100, unique=True, help_text=_("See https://python.useinstructor.com/integrations/#getting-started"))
    api_key     = models.CharField(_("API Key"), max_length=255, blank=True)
    base_url    = models.URLField(_("Base URL"), blank=True, help_text=_("When different from the default base URL."))
    mode        = models.CharField(_("Call Mode"), blank=True, choices=Mode, help_text=_("Normally you shouldn't need to set this value."))
    cache_size  = models.IntegerField(_("Response Cache Size"), blank=True, null=True, help_text=_("Setting this value enables the built-in response cache."))
    max_retries = models.IntegerField(_("Maximum Retries"), blank=True, null=True, default=2)
    kwargs      = models.JSONField(_("Provider-specific Parameters"), blank=True, default=dict, validators=[is_dict])

    @property
    def mode_inspector(self):
        """Get ``Mode`` constant from ``Inspector``"""
        match self.mode:
            case self.Mode.TOOLS:
                return ModeInspector.TOOLS
            case self.Mode.JSON_SCHEMA:
                return ModeInspector.JSON_SCHEMA
            case self.Mode.MD_JSON:
                return ModeInspector.MD_JSON
            case self.Mode.PARALLEL_TOOLS:
                return ModeInspector.PARALLEL_TOOLS
            case self.Mode.RESPONSE_TOOLS:
                return ModeInspector.RESPONSES_TOOLS
            case _:
                return None

    class Meta:
        verbose_name        = _("AI Model")
        verbose_name_plural = _("AI Models")
        ordering            = ["model_id"]

    def __str__(self):
        return self.model_id

class PromptTemplateManager(models.Manager):
    """Custom manager for prompt templates with added filter methods."""
    def for_use_case(self, model_id, use_case):
        """Filter prompt templates by AI Model ID and use case."""
        return self.filter(ai_models__model_id=model_id, use_case=use_case).order_by("seqnr")

class PromptTemplate(models.Model):
    """Prompt templates"""
    class UseCase(models.TextChoices):
        QUALITY_ASSESSMENT = "QUALITY_ASSESSMENT", _("Quality Assessment")

    objects     = PromptTemplateManager()

    ai_models   = models.ManyToManyField(AIModel, related_name="prompt_templates", blank=True)
    use_case    = models.CharField(_("Use Case"), max_length=25, choices=UseCase)
    seqnr       = models.IntegerField(_("Sequence Number"))
    description = models.CharField(_("Description"), max_length=255, blank=True)
    role        = models.CharField(_("Role"), max_length=25)
    content     = models.TextField(_("Content"), blank=True, help_text=_("Placeholders: {QUESTION}, {ANSWER}"))

    class Meta:
        verbose_name        = _("Prompt Template")
        verbose_name_plural = _("Prompt Templates")
        ordering            = ["use_case", "seqnr", "role"]

    def __str__(self):
        return self.description

    def apply_template(self, placeholders):
        """Insert placeholders and return the template as a ``{"role": "", "content": ""}`` dictionary."""
        content = self.content
        content = content.replace("{QUESTION}", placeholders.get("question", ""))
        content = content.replace("{ANSWER}", placeholders.get("answer", ""))
        return {"role": self.role, "content": content}

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
        timestamp = date_format(self.timestamp, "DATETIME_FORMAT")
        return f"{timestamp}: {self.description}"

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
