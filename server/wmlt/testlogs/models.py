# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.fields import GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db                          import models
from django.utils.translation           import gettext_lazy as _
from django.utils                       import timezone

class TestRun(models.Model):
    """A single test run: Root for all other information"""
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
        START_TESTRUN    = "START_TESTRUN",    _("Start Test Run")
        NAVIGATION       = "NAVIGATION",       _("Navigation")
        GET_INFORMATION  = "GET_INFORMATION",  _("Get Information")
        LOAD_MODEL       = "LOAD_MODEL",       _("Load Model")
        SEMANTIC_SEARCH  = "SEMANTIC_SEARCH",  _("Semantic Search")
        START_CHAT       = "START_CHAT",       _("Start Chat")
        EXECUTE_MODEL    = "EXECUTE_MODEL",    _("Execute Model")

    test_run       = models.ForeignKey(TestRun, on_delete=models.CASCADE)
    timestamp      = models.DateTimeField(_("Timestamp"), default=timezone.now)
    event_type     = models.CharField(_("Event Type"), max_length=30, choices=EventType)
    content_type   = models.ForeignKey(ContentType, on_delete=models.CASCADE, blank=True)
    object_id      = models.PositiveBigIntegerField(blank=True)
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        verbose_name        = _("Test Event")
        verbose_name_plural = _("Test Events")
        ordering            = ["test_run", "timestamp"]

    def __str__(self):
        return self.event_type.label

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
        ordering            = ["-event__timestamp", "-number"]

    def __str__(self):
        return self.name

class NavigationEvent(models.Model):
    event = GenericRelation(Event)
    url   = models.CharField(_("URL"), max_length=50)

    class Meta:
        verbose_name        = _("Event: Navigation")
        verbose_name_plural = _("Events: Navigation")
        ordering            = ["-event__timestamp"]

    def __str__(self):
        return self.url

class GetInformationEvent(models.Model):
    """Event: Get engine information (head)"""
    event       = GenericRelation(Event)
    engine_id   = models.CharField(_("Technical Id"), max_length=25)
    engine_name = models.CharField(_("Name"), max_length=25)

    class Meta:
        verbose_name        = _("Event: Get Information")
        verbose_name_plural = _("Events: Get Information")
        ordering            = ["-event__timestamp", "engine_id"]

    def __str__(self):
        return self.backend_name

class GetInformationEventLine(models.Model):
    """Event: Get engine information (lines)"""
    parent = models.ForeignKey(GetInformationEvent, on_delete=models.CASCADE)
    number = models.IntegerField(_("Number"))
    field  = models.CharField(_("Field"), max_length=50)
    icon   = models.CharField(_("Icon"), max_length=20)
    label  = models.CharField(_("Label"), max_length=100)
    value  = models.CharField(_("Value"), max_length=100)

    class Meta:
        verbose_name        = _("Information Line")
        verbose_name_plural = _("Information Lines")
        ordering            = ["engine", "number"]

    def __str__(self):
        return t"{self.label}: {self.value}"

class LoadModelEvent(models.Model):
    """Event: Load Model"""
    event     = GenericRelation(Event)
    pipeline  = models.CharField(_("Pipeline"), max_length=50)
    engine_id = models.CharField(_("Engine ID"), max_length=25)
    model_id  = models.CharField(_("Model ID"), max_length=100)
    dtype     = models.CharField(_("Quantization"), max_length=10, blank=True)
    device    = models.CharField(_("Device"), max_length=20, blank=True)
    loadtime  = models.DurationField(_("Loading Duration"), blank=True)

    class Meta:
        verbose_name        = _("Event: Load Model")
        verbose_name_plural = _("Events: Load Model")
        ordering            = ["-event__timestamp"]

    def __str__(self):
        result     = t"{self.pipeline}: {self.model}"
        additional = ""

        if self.dtype:
            additional += t" {self.dtype}"

        if self.device:
            additional += t" {self.device}"

        additional = additional.strip();
        return t"{result} ({additional})" if additional else result


class SemanticSearchEvent(models.Model):
    """Event: Semantic Search"""

class ExecuteModel(models.Model):
    """Event: Execute Model"""

class StartChat(models.Model):
    """Event: Start or reset chat"""


## TODO: Admin for each model (Event = read-only)
## TODO: REST API: serializer / viewset / route for each model
##        - Create Event object automatically
##        - Restrict by access code
