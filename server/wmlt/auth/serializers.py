# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .                          import models
from ..serializers              import ValidatingModelSerializer

from django.utils.translation   import gettext_lazy as _
from rest_framework.serializers import ValidationError

class AccessCodeCheckingModelSerializer(ValidatingModelSerializer):
    """Special version of the base DRF model serializer, that restricts write access
    to model instances related to the access code used in the HTTP request header."""

    def get_access_code_from_request_body(self, attrs):
        """Read access code related to the currently used model (usually the testrun
        in database)"""
        return None

    def validate(self, attrs):
        """Prevent submitting with invalid access code, either because the code was not
        validated. This simply checks that if an access code is sent by the client in
        the payload it must match that access code stored in database for the testrun.

        To secure this approach, the DRF base permission class either requires a valid
        access code in the HTTP header or an authenticated user session, so that we can
        silently fall back to user permissions, when no access code is received."""
        request     = self.context.get("request")
        access_code = getattr(request, "access_code", None)

        if access_code is not None and access_code != self.get_access_code_from_request_body(attrs):
            raise ValidationError({
                "access_code": _("The access code in the request header must match the access code for the requested object."),
            })

        return super.validate(attrs)

class AccessCodeCheckingModelSerializer(ValidatingModelSerializer):
    class Meta:
        model  = models.AccessCode
        fields = "__all__"

    def get_testrun_access_code(self, attrs):
        """Since this is the access code entity itself, the access code is not read from
        database but the request body here.
        """
        return attrs.get("access_code", None)
