# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .                        import models
from ..drf                    import ValidatingModelSerializer
from django.utils.translation import gettext_lazy as _
from rest_framework           import serializers

class TestRunSerializer(ValidatingModelSerializer):
    class Meta:
        model  = models.TestRun
        fields = "__all__"

    def validate(self, attrs):
        """Prevent submitting test runs with not validated access code.

        This simply checks that if an access code is sent by the client in
        the payload it must match that access code from the authorization
        header, because the latter has been validated during permission checks.

        Clients can also leave the access code blank to create test runs with
        the access from from the HTTP header.
        """
        request     = self.context.get("request")
        access_code = getattr(request, "access_code", None)

        if access_code is not None:
            if "access_code" in attrs and attrs["access_code"] != access_code:
                raise serializers.ValidationError({
                    "access_code": _("The access code in the request body must match the access code from the authorization header."),
                })

            attrs["access_code"] = access_code

        return super.validate(attrs)
