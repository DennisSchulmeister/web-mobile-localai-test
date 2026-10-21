# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.core.exceptions     import ValidationError as DjangoValidationError
from django.utils.translation   import gettext_lazy as _

from rest_framework.serializers import ModelSerializer
from rest_framework.serializers import ValidationError as DRFValidationError

class ValidatingModelSerializer(ModelSerializer):
    """Special version of the DRF ``ModelSerializer`` that calls ``full_clean()``
    on the model to run model-defined validations."""

    def validate(self, attrs):
        candidate = self.Meta.model()

        if self.instance is not None:
            # Include existing values so partial updates are checked as a whole.
            for field in candidate._meta.concrete_fields:
                setattr(candidate, field.attname, getattr(self.instance, field.attname))

        model_field_names = {field.name for field in candidate._meta.concrete_fields}

        for name, value in attrs.items():
            # Exclude nested objects/lists for expanded child models
            if name in model_field_names:
                setattr(candidate, name, value)

        try:
            candidate.full_clean()
        except DjangoValidationError as error:
            detail = error.message_dict if hasattr(error, "message_dict") else error.messages
            raise DRFValidationError(detail) from error

        return attrs
