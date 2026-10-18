# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .  import models
from .. import admin

from django.contrib.admin       import display
from django.contrib.admin       import ModelAdmin
from django.contrib.auth.admin  import UserAdmin as DjangoUserAdmin
from django.contrib.auth.admin  import GroupAdmin as DjangoGroupAdmin
from django.utils.translation   import gettext_lazy as _

class UserAdmin(DjangoUserAdmin):
    pass

class GroupAdmin(DjangoGroupAdmin):
    list_display = (*DjangoGroupAdmin.list_display, "user_count")

    @display(description=_("User Count"))
    def user_count(self, obj):
        return obj.user_count()

class AccessCodeAdmin(ModelAdmin):
    model               = models.AccessCode
    list_display        = ["access_code", "valid_from", "valid_until", "remarks"]
    list_display_links  = ["access_code", "valid_from", "valid_until", "remarks"]
    ordering            = ["-valid_from", "-valid_until"]
    search_fields       = ["access_code", "remarks"]

    fieldsets = [
        (None, {
            "fields": (
                "access_code",
                ("valid_from", "valid_until"),
                "remarks",
            )
        })
    ]

admin.admin_site.register(models.User,       UserAdmin)
admin.admin_site.register(models.Group,      GroupAdmin)
admin.admin_site.register(models.AccessCode, AccessCodeAdmin)
