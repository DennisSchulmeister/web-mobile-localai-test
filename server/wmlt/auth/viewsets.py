# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .              import models, serializers
from rest_framework import viewsets

class AccessCodeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset         = models.AccessCode.objects.all()
    serializer_class = serializers.AccessCodeSerializer
