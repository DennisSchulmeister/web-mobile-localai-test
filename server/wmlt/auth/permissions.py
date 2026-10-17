# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import datetime

from django.utils                  import timezone
from django.utils.translation      import gettext_lazy as _

from rest_framework.authentication import get_authorization_header
from rest_framework.exceptions     import PermissionDenied
from rest_framework.permissions    import BasePermission
from rest_framework.permissions    import DjangoModelPermissions

class DjangoModelPermissionsWithRead(DjangoModelPermissions):
    """Require authenticated user and check Django model permissions.
    But unlike DRF's ``DjangoModelPermissions`` also check model permissions
    for ``GET`` and ``HEAD`` requests.
    """
    perms_map = {
        **DjangoModelPermissions.perms_map,
        "GET":  ["%(app_label)s.view_%(model_name)s"],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
    }

class IsValidAccessCode(BasePermission):
    """Grant access with valid access code sent in the HTTP header:

    ::

        Authorization access-code A1B2C3
    
    Otherwise require and authenticated user and check Django model permissions.
    """
    keyword = "access-code"

    def has_permission(self, request, view):
        authorization_header = get_authorization_header(request).split()

        if authorization_header and authorization_header[0].lower() == self.keyword.lower().encode():
            if len(authorization_header) != 2:
                raise PermissionDenied(_("Invalid access code received."))
            
            try:
                access_code = authorization_header[1].decode()
            except UnicodeError:
                raise PermissionDenied(_("No access code received."))

            from .models import AccessCode

            now   = timezone.now()
            count = AccessCode.objects.filter(access_code=access_code, valid_from__lte=now, valid_until__gte=now).count()

            if count > 0:
                request.access_code = access_code
                return True
            else:
                return False
        else:
            return DjangoModelPermissionsWithRead().has_permission(request, view)
