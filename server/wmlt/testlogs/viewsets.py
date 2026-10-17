# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .              import models, serializers
from rest_framework import viewsets

class TestRunViewSet(viewsets.ModelViewSet):
    queryset         = models.TestRun.objects.all()
    serializer_class = serializers.TestRunSerializer

    def get_queryset(self):
        access_code = getattr(self.request, "access_code", None)

        if access_code is not None:
            return models.TestRun.objects.filter(access_code__access_code = access_code)
        else:
            return models.TestRun.objects.all()
