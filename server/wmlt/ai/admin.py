# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .  import models
from .. import admin

from django.contrib.admin     import display
from django.contrib.admin     import StackedInline
from django.contrib.admin     import TabularInline
from django.urls              import reverse
from django.utils.html        import format_html
from django.utils.formats     import date_format
from django.utils.translation import gettext_lazy as _
