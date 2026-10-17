# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.apps              import AppConfig
from django.utils.translation import gettext_lazy as _

class AuthApp(AppConfig):
    name         = "wmlt.auth"
    label        = "wmlt_auth"
    verbose_name = _("User Management")
