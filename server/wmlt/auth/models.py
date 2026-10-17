# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import datetime, string, random

from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import Group as DjangoGroup
from django.db                  import models
from django.utils.translation   import gettext_lazy as _

def default_valid_until():
    return datetime.datetime.now() + datetime.timedelta(days=7)

def random_access_code():
    alphabet = string.ascii_uppercase + string.digits
    return "".join(random.choice(alphabet) for _ in range(6))
    
class Group(DjangoGroup):
    """Own group model to pull it into this app"""
    pass

    class Meta:
        verbose_name        = _("User Group")
        verbose_name_plural = _("User Groups")

    def user_count(self):
        return self.user_set.count()

class User(AbstractUser):
    """Own user model to pull it into this app"""
    groups = models.ManyToManyField(
        Group,
        verbose_name       = _("Groups"),
        blank              = True,
        help_text          = _("The groups this user belongs to. A user will get all permissions granted to each of their groups."),
        related_name       = "user_set",
        related_query_name = "user",
    )

class AccessCode(models.Model):
    """API Access code"""
    access_code = models.CharField(_("Access Code"), max_length=10, default=random_access_code)
    valid_from  = models.DateTimeField(_("Valid From"), auto_now_add=True)
    valid_until = models.DateTimeField(_("Valid Until"), default=default_valid_until)
    
    class Meta:
        verbose_name        = _("Access Code")
        verbose_name_plural = _("Access Codes")
        ordering            = ["-valid_from", "valid_until", "access_code"]
