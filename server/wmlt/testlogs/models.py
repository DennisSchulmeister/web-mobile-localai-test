# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.db                import models
from django.utils.translation import gettext_lazy as _

class TestRun(models.Model):
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

    access_code  = models.ForeignKey("wmlt_auth.AccessCode", on_delete=models.SET_NULL, null=True)
    start_date   = models.DateTimeField(_("Started at"), auto_now_add=True)
    device_type  = models.CharField(_("Device Type"), choices=DeviceType)
    device_model = models.CharField(_("Device Model"), max_length=100)
    os_family    = models.CharField(_("Operating System Family"), choices=OperatingSystemFamily)
    os_version   = models.CharField(_("Operating System Version"), max_length=20)

    class Meta:
        verbose_name        = _("Tests Run")
        verbose_name_plural = _("Test Runs")
        ordering            = ["-start_date"]
