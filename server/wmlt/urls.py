# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.urls            import include
from django.urls            import path
from rest_framework.routers import DefaultRouter as DRFDefaultRouter

from .admin                 import admin_site
from .auth.routes           import register_api_routes as register_auth_api_routes
from .testlogs.routes       import register_api_routes as register_testlogs_api_routes

api_router = DRFDefaultRouter()
register_auth_api_routes(api_router, "auth")
register_testlogs_api_routes(api_router, "testlogs")

urlpatterns = [
    path("api/",   include(api_router.urls)),
    path("admin/", admin_site.urls),
]
