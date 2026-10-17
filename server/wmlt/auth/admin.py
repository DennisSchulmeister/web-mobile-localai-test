# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .  import models
from .. import admin

from django.contrib.auth.admin  import UserAdmin as DjangoUserAdmin
from django.contrib.auth.admin  import GroupAdmin as DjangoGroupAdmin
from django.utils.translation   import gettext_lazy as _

from unfold.forms               import AdminPasswordChangeForm
from unfold.forms               import UserChangeForm
from unfold.forms               import UserCreationForm
from unfold.decorators          import display

class UserAdmin(admin.CustomModelAdmin, DjangoUserAdmin):
    form                 = UserChangeForm
    add_form             = UserCreationForm
    change_password_form = AdminPasswordChangeForm

class GroupAdmin(admin.CustomModelAdmin, DjangoGroupAdmin):
    list_display = (*DjangoGroupAdmin.list_display, "user_count")

    @display(label=True, description=_("User Count"))
    def user_count(self, obj):
        return obj.user_count()

class AccessCodeAdmin(admin.CustomModelAdmin):
    model = models.AccessCode

admin.admin_site.register(models.User,       UserAdmin)
admin.admin_site.register(models.Group,      GroupAdmin)
admin.admin_site.register(models.AccessCode, AccessCodeAdmin)
