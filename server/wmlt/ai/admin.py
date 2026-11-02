# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .  import models
from .. import admin

from django.contrib.admin     import StackedInline
from django.utils.translation import gettext_lazy as _

class AIModelAdmin(admin.CustomModelAdmin):
    model = models.AIModel

class MessageInline(StackedInline):
    model = models.Message
    extra = 0

class TraceAdmin(admin.CustomModelAdmin):
    model   = models.Trace
    inlines = [MessageInline]

admin.admin_site.register(models.AIModel, AIModelAdmin)
admin.admin_site.register(models.Trace,   TraceAdmin)
