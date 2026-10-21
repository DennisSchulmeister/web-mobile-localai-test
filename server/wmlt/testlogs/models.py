# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.db                import models
from django.utils.translation import gettext_lazy as _
from django.utils             import timezone
from django.core.validators   import MaxValueValidator
from django.core.validators   import MinValueValidator

class TestRun(models.Model):
    """A single testrun: Root for all other information"""
    class AppType(models.TextChoices):
        ANDROID = "ANDROID", _("Android")
        BROWSER = "BROWSER", _("Browser")

    class DeviceType(models.TextChoices):
        PHONE  = "PHONE",  _("Smartphone")
        TABLET = "TABLET", _("Tablet")
        PC     = "PC",     _("Personal Computer")

    class OperatingSystemFamily(models.TextChoices):
        ANDROID  = "ANDROID",  _("Android")
        IOS      = "IOT",      _("iOS")
        LINUX    = "LINUX",    _("Linux")
        MACOS    = "MACOS",    _("mac OS")
        SAILFISH = "SAILFISH", _("Sailfish")
        WINDOWS  = "WINDOWS",  _("Windows")
        OTHER    = "OTHER",    _("Other")

    class BrowserFamily(models.TextChoices):
        BRAVE   = "BRAVE",   _("Brave")
        CHROME  = "CHROME",  _("Chrome")
        EDGE    = "EDGE",    _("Edge")
        FIREFOX = "FIREFOX", _("Firefox")
        OPERA   = "OPERA",   _("Opera")
        SAFARI  = "SAFARI",  _("Safari")
        OTHER   = "OTHER",   _("Other")

    start_date      = models.DateTimeField(_("Started at"), default=timezone.now)
    access_code     = models.ForeignKey("wmlt_auth.AccessCode", on_delete=models.SET_NULL, null=True)
    app_type        = models.CharField(_("App Type"), max_length=25, choices=AppType)
    installation    = models.CharField(_("Installation"), max_length=10)
    device_type     = models.CharField(_("Device Type"), max_length=25, choices=DeviceType)
    device_model    = models.CharField(_("Device Model"), max_length=100)
    os_family       = models.CharField(_("Operating System Family"), max_length=25, choices=OperatingSystemFamily)
    os_version      = models.CharField(_("Operating System Version"), max_length=25)
    browser_family  = models.CharField(_("Browser Family"), max_length=25, choices=BrowserFamily)
    browser_version = models.CharField(_("Browser Version"), max_length=25)
    remarks         = models.CharField(_("Remarks"), max_length=255, blank=True)

    class Meta:
        verbose_name        = _("Test Run")
        verbose_name_plural = _("Test Runs")
        ordering            = ["-start_date"]

    def __str__(self):
        return str(self.id)

class Event(models.Model):
    """Actions performed during a single test run"""
    class EventType(models.TextChoices):
        START_TESTRUN    = "START_TESTRUN",    _("Start Testrun")
        PAGE_NAVIGATION  = "PAGE_NAVIGATION",  _("Page Navigation")
        GET_INFORMATION  = "GET_INFORMATION",  _("Get Information")
        LOAD_MODEL       = "LOAD_MODEL",       _("Load Model")
        SEMANTIC_SEARCH  = "SEMANTIC_SEARCH",  _("Semantic Search")
        RUN_PIPELINE     = "RUN_PIPELINE",     _("Run Pipeline")
        START_CHAT       = "START_CHAT",       _("Start Chat")
        CHAT_MESSAGE     = "CHAT_MESSAGE",     _("Chat Message")

    testrun    = models.ForeignKey(TestRun, on_delete=models.CASCADE)
    timestamp  = models.DateTimeField(_("Timestamp"), default=timezone.now)
    event_type = models.CharField(_("Event Type"), max_length=30, choices=EventType, editable=False)

    class Meta:
        verbose_name        = _("Test Event")
        verbose_name_plural = _("Test Events")
        ordering            = ["testrun", "timestamp"]
        get_latest_by       = "timestamp"

    def __str__(self):
        return self.event_type.label

class EventMixin:
    """Mixin-class for events to hard-code the event type during saving in those cases
    where Django's ''save()'' method is actually being called (no bulk updates etc.)."""
    def save(self, event_type, *args, **kwargs):
        self.event_type = event_type

        if (update_fields := kwargs.get("update_fields")) is not None:
            update_fields = list(update_fields)

            # Empty update_fields list is a no-op save in Django
            if len(update_fields) > 0:
                if "event_type" not in update_fields:
                    update_fields.append("event_type")

                kwargs["update_fields"] = update_fields

        super().save(*args, **kwargs)

class EventException(models.Model):
    """Catched exception. This is not an event in itself, but rather for any event
    a number of exceptions can be logged."""
    event   = models.ForeignKey(Event, on_delete=models.CASCADE)
    number  = models.IntegerField(_("Number"))
    name    = models.CharField(_("Name"), max_length=50)
    message = models.CharField(_("Message"), max_length=255, blank=True)
    stack   = models.TextField(_("Stack Trace"), blank=True)

    class Meta:
        verbose_name        = _("Exception")
        verbose_name_plural = _("Exceptions")

    def __str__(self):
        return self.name

class StartTestRunEvent(EventMixin, Event):
    """Event: Start Testrun"""
    class Meta:
        verbose_name        = _("Start Testrun Event")
        verbose_name_plural = _("Start Testrun Events")

    def save(self, *args, **kwargs):
        return super().save(self.EventType.START_TESTRUN, *args, **kwargs)

class PageNavigationEvent(EventMixin, Event):
    """Event: Page Navigation"""
    page_url = models.CharField(_("Page URL"), max_length=50)

    class Meta:
        verbose_name        = _("Page Navigation Event")
        verbose_name_plural = _("Page Navigation Events")

    def __str__(self):
        return self.page_url

    def save(self, *args, **kwargs):
        return super().save(self.EventType.PAGE_NAVIGATION, *args, **kwargs)

class GetInformationEvent(EventMixin, Event):
    """Event: Get engine information (head)"""
    engine_id   = models.CharField(_("Technical Id"), max_length=25)
    engine_name = models.CharField(_("Name"), max_length=25)

    class Meta:
        verbose_name        = _("Get Information Event")
        verbose_name_plural = _("Get Information Events")

    def __str__(self):
        return self.backend_name

    def save(self, *args, **kwargs):
        return super().save(self.EventType.GET_INFORMATION, *args, **kwargs)

class GetInformationLine(models.Model):
    """Event: Get engine information (lines)"""
    parent  = models.ForeignKey(GetInformationEvent, on_delete=models.CASCADE, related_name="lines")
    seqnr   = models.IntegerField(_("Sequence Number"))
    field   = models.CharField(_("Field"), max_length=50)
    icon    = models.CharField(_("Icon"), max_length=20)
    label   = models.CharField(_("Label"), max_length=100)
    value   = models.CharField(_("Value"), max_length=100)

    class Meta:
        verbose_name        = _("Information Line")
        verbose_name_plural = _("Information Lines")
        ordering            = ["parent", "seqnr"]
        get_latest_by       = ["parent__timestamp", "seqnr"]

    def __str__(self):
        return t"{self.label}: {self.value}"

class LoadModelEvent(EventMixin, Event):
    """Event: Load Model"""
    class PipelineType(models.TextChoices):
        SUMMARIZATION        = "summarization",        _("Summarization")
        TRANSLATION          = "translation",          _("Translation")
        QUESTION_ANSWERING   = "question-answering",   _("Question Answering")
        FEATURE_EXTRACTION   = "feature-extraction",   _("Feature Extraction")
        TEXT_GENERATION      = "text-generation",      _("Text Generation")
        TEXT2TEXT_GENERATION = "text2text-generation", _("Text-to-Text Generation")

    pipeline  = models.CharField(_("Pipeline"), max_length=50, choices=PipelineType)
    engine_id = models.CharField(_("Engine ID"), max_length=25)
    model_id  = models.CharField(_("Model ID"), max_length=100)
    dtype     = models.CharField(_("Quantization"), max_length=10, blank=True)
    device    = models.CharField(_("Device"), max_length=20, blank=True)
    loadtime  = models.DurationField(_("Loading Duration"), blank=True)

    class Meta:
        verbose_name        = _("Load Model Event")
        verbose_name_plural = _("Load Model Events")

    def __str__(self):
        result     = t"{self.pipeline}: {self.model}"
        additional = ""

        if self.dtype:
            additional += t" {self.dtype}"

        if self.device:
            additional += t" {self.device}"

        additional = additional.strip();
        return t"{result} ({additional})" if additional else result

    def save(self, *args, **kwargs):
        return super().save(self.EventType.LOAD_MODEL, *args, **kwargs)

class SemanticSearchEvent(EventMixin, Event):
    """Event: Semantic Search"""
    model                = models.ForeignKey(LoadModelEvent, on_delete=models.SET_NULL, blank=True, null=True)
    query                = models.CharField(_("Query"), max_length=255, blank=True)
    include_keywords     = models.BooleanField(_("Include Keywords"))
    include_sentences    = models.BooleanField(_("Include Sentences"))
    compare_embeddings   = models.BooleanField(_("Compare Embeddings"))
    compare_strings      = models.BooleanField(_("Compare Strings"))

    class Meta:
        verbose_name        = _("Semantic Search Event")
        verbose_name_plural = _("Semantic Search Events")

    def __str__(self):
        return self.query

    def save(self, *args, **kwargs):
        return super().save(self.EventType.SEMANTIC_SEARCH, *args, **kwargs)

similarity_validators = [MinValueValidator(0), MaxValueValidator(100)]

class SemanticSearchResult(models.Model):
    """Event: Semantic Search (Result Line)"""
    parent     = models.ForeignKey(SemanticSearchEvent, on_delete=models.CASCADE, related_name="results")
    seqnr      = models.IntegerField(_("Sequence Number"))
    page_url   = models.CharField("_Page URL", max_length=50)
    page_title = models.CharField(_("Page Title"), max_length=255)
    similarity = models.SmallIntegerField(_("Similarity in %"), validators=similarity_validators)

    class Meta:
        verbose_name        = _("Result Line")
        verbose_name_plural = _("Result Lines")
        ordering            = ["parent", "seqnr"]
        get_latest_by       = ["parent__timestamp", "seqnr"]

    def __str__(self):
        return t"{self.page_title}: {self.similarity}%"
    
class SemanticSearchMatch(models.Model):
    """Event: Semantic Search (Matched Text)"""
    class TextType(models.TextChoices):
        KEYWORD  = "KEYWORD",  _("Keyword")
        SENTENCE = "SENTENCE", _("Sentence")

    parent     = models.ForeignKey(SemanticSearchResult, on_delete=models.CASCADE, related_name="matches")
    seqnr      = models.IntegerField(_("Sequence Number"))
    text       = models.CharField(_("Matched Text"), max_length=255)
    text_type  = models.CharField(_("Text Type"), max_length=15, choices=TextType)
    similarity = models.SmallIntegerField(_("Similarity in %"), validators=similarity_validators)

    class Meta:
        verbose_name        = _("Matched Text")
        verbose_name_plural = _("Matched Texts")
        ordering            = ["parent", "seqnr"]
        get_latest_by       = ["parent__parent__timestamp", "seqnr"]

    def __str__(self):
        return t"{self.text}: {self.similarity}%"

class RunPipelineEvent(EventMixin, Event):
    """Event: Run pipeline (not chat) event"""
    model           = models.ForeignKey(LoadModelEvent, on_delete=models.SET_NULL, blank=True, null=True)
    page_url        = models.CharField(_("Page URL"), max_length=50)
    context         = models.TextField(_("Context"), blank=True)
    query           = models.CharField(_("Query"), max_length=255, blank=True)
    max_tokens      = models.IntegerField(_("Max Tokens"), blank=True)
    source_language = models.CharField(_("Source Language"), max_length=10, blank=True)
    target_language = models.CharField(_("Target Language"), max_length=10, blank=True)
    result          = models.TextField(_("Result"), blank=True)
    runtime         = models.DurationField(_("Run Time"), blank=True)

    class Meta:
        verbose_name        = _("Run Pipeline Event")
        verbose_name_plural = _("Run Pipeline Events")

    def __str__(self):
        return t"{self.page_url}: {self.model.pipeline if self.model else ''}"

    def save(self, *args, **kwargs):
        return super().save(self.EventType.RUN_PIPELINE, *args, **kwargs)

class StartChatEvent(EventMixin, Event):
    """Event: Start Chat"""
    class Meta:
        verbose_name        = _("Start Chat Event")
        verbose_name_plural = _("Start Chat Events")

    def save(self, *args, **kwargs):
        return super().save(self.EventType.START_CHAT, *args, **kwargs)

class ChatMessageEvent(EventMixin, Event):
    """Event: Chat Message"""
    model             = models.ForeignKey(LoadModelEvent, on_delete=models.SET_NULL, blank=True, null=True)
    chat              = models.ForeignKey(StartChatEvent, on_delete=models.CASCADE)
    context           = models.TextField(_("Context"), blank=True, null=True)
    max_tokens        = models.IntegerField(_("Max Tokens"), blank=True)
    sampling          = models.BooleanField(_("Sampling"), blank=True)
    user_message      = models.TextField(_("User Message"), blank=True, null=True)
    assistant_message = models.TextField(_("Assistant Message"), blank=True, null=True)
    first_token       = models.DurationField(_("First Token"), blank=True)
    runtime           = models.DurationField(_("Run Time"), blank=True)
    tokens            = models.IntegerField(_("Number of Tokens"), blank=True)
    tokens_per_second = models.FloatField(_("Tokens / Second"), blank=True)

    class Meta:
        verbose_name        = _("Chat Message Event")
        verbose_name_plural = _("Chat Message Events")

    def __str__(self):
        return self.user_message

    def save(self, *args, **kwargs):
        return super().save(self.EventType.CHAT_MESSAGE, *args, **kwargs)

class QualityAssessment(models.Model):
    """Quality evaluation of a generated chat message"""
    class JudgeType(models.TextChoices):
        HUMAN = "HUMAN", _("Human")
        LLM   = "LLM",   _("LLM")

    class Correctness(models.IntegerChoices):
        COMPLETELY_WRONG = 0, _("Completely Wrong")
        MINOR_FLAWS      = 1, _("Minor Flaws")
        NO_ERRORS_FOUND  = 2, _("No Errors Found")

    class ThematicRelevance(models.IntegerChoices):
        UNRELATED_ANSWER = 0, _("Response shows no relation to the user input")
        LOOSELY_RELATED  = 1, _("Only very little relation to the user input")
        BEYOND_SCOPE     = 2, _("Response but goes beyond user input")
        PERFECT_FIT      = 3, _("Response exactly addresses the user input")

    class MessageLength(models.IntegerChoices):
        NO_RESPONSE  = 0, _("No response")
        TOO_SHORT    = 1, _("Too short, missing information")
        TOO_LONG     = 2, _("Too long, more than what was asked")
        PERFECT_SIZE = 3, _("Perfect size to answer the question")
    
    message                  = models.ForeignKey(ChatMessageEvent, on_delete=models.CASCADE)
    timestamp                = models.DateTimeField(_("Timestamp"), default=timezone.now)
    judge_type               = models.CharField(_("Judge Type"), max_length=15, choices=JudgeType)
    judge_name               = models.CharField(_("Judge Name"), max_length=50, blank=True)
    correct_syntax_grade     = models.SmallIntegerField(_("Correct Syntax"), blank=True, choices=Correctness)
    correct_syntax_note      = models.TextField(_("Explanation"), max_length=100, blank=True)
    correct_lingua_grade     = models.SmallIntegerField(_("Correct Lingua"), blank=True, choices=Correctness)
    correct_lingua_note      = models.TextField(_("Explanation"), max_length=100, blank=True)
    correct_content_grade    = models.SmallIntegerField(_("Correct Content"), blank=True, choices=Correctness)
    correct_content_note     = models.TextField(_("Explanation"), max_length=100, blank=True)
    thematic_relevance_grade = models.SmallIntegerField(_("Thematic Relevance"), blank=True, choices=ThematicRelevance)
    thematic_relevance_note  = models.TextField(_("Explanation"), max_length=100, blank=True)
    message_length_grade     = models.SmallIntegerField(_("Message Length"), blank=True, choices=MessageLength)
    message_length_note      = models.TextField(_("Explanation"), max_length=100, blank=True)

    class Meta:
        verbose_name        = _("Quality Assessment")
        verbose_name_plural = _("Quality Assessments")
        ordering            = ["message__chat__testrun", "timestamp"]
        get_latest_by       = "timestamp"

    def __str__(self):
        return t"{self.timestamp}: {self.judge_name}"
