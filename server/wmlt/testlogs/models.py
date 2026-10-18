# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.db                import models
from django.utils.translation import gettext_lazy as _
from django.utils             import timezone

class TestRun(models.Model):
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
