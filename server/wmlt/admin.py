# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from django.apps              import apps
from django.conf              import settings
from django.contrib.admin     import AdminSite
from django.utils.translation import gettext_lazy as _

from admin_interface.admin    import ThemeAdmin
from admin_interface.models   import Theme

class CustomAdminSite(AdminSite):
    """
    Override dashboard ordering of apps and models.

    Apps are sorted in the order listed in settings.INSTALLED_APPS. Models are
    sorted in the order in which they are registered with the admin site.
    """

    def __init__(self):
        """
        Initialize the site and track model registration order.
        """
        super().__init__()
        self._models_ = []

    def register(self, model_or_iterable, admin_class = None, **options):
        """
        Remember the order in which models are registered.
        """
        super().register(model_or_iterable, admin_class, **options)

        try:
            for model in iter(model_or_iterable): # type: ignore
                if model in self._models_:
                    self._models_.remove(model)

                self._models_.append(model)
        except TypeError:
            self._models_.append(model_or_iterable)

    def unregister(self, model_or_iterable):
        """
        Remove unregistered models from the internal order list.
        """
        super().unregister(model_or_iterable)

        try:
            for model in iter(model_or_iterable): # type: ignore
                if model in self._models_:
                    self._models_.remove(model)
        except TypeError:
            if model_or_iterable in self._models_:
                self._models_.remove(model_or_iterable)

    def get_app_list(self, request, *args):
        """
        Return the app list with custom app and model ordering.
        """
        # Sort apps in the order they appear in the settings
        app_list = super().get_app_list(request, *args)

        for admin_app in app_list:
            app_config = apps.get_app_config(admin_app["app_label"])
            admin_app["_index_"] = settings.INSTALLED_APPS.index(app_config.name)

        app_list.sort(key = lambda admin_app: admin_app["_index_"])

        for admin_app in app_list:
            del admin_app["_index_"]

        # Sort models in the order they were registered
        for admin_app in app_list:
            for model in admin_app["models"]:
                model["_index_"] = self._models_.index(model["model"])

            admin_app["models"].sort(key = lambda model: model["_index_"])

            for model in admin_app["models"]:
                del model["_index_"]

        return app_list

admin_site = CustomAdminSite()
admin_site.register(Theme, ThemeAdmin)
