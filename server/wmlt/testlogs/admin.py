# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .  import models
from .. import admin

from django.contrib.admin     import ModelAdmin
from django.utils.translation import gettext_lazy as _

class TestRunAdmin(ModelAdmin):
    model           = models.TestRun
    readonly_fields = ["id"]

    fieldsets = [
        (None, {
            "fields": (
                "id",
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

admin.admin_site.register(models.TestRun, TestRunAdmin)
