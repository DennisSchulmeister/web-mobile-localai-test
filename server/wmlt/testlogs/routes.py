# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import typing

if typing.TYPE_CHECKING:
    from rest_framework.routers import DefaultRouter

def register_api_routes(router: DefaultRouter, prefix: str) -> None:
    #router.register(f"{prefix}/viewsetPath", MyViewSet, basename="my_view_set")
    pass
