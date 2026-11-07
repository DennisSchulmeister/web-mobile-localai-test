# Web/Mobile Test for Local AI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .                        import models
from django                   import forms
from django.utils.translation import gettext_lazy as _

class AIModelAdminForm(forms.ModelForm):
    """Hide API Key in the UI"""
    class Meta:
        model   = models.AIModel
        fields  = "__all__"
        widgets = {"api_key": forms.PasswordInput()}

    def __init__(self, *args, **kwargs):
        """Work around an UX problem of the password field and provide at least some visual
        feedback, when a saved model does have an API Key."""
        super().__init__(*args, **kwargs)

        if self.instance.pk and self.instance.api_key:
            self.fields["api_key"].help_text = _("Leave blank to keep the existing API Key.")

    def clean_api_key(self):
        """Restore saved API key when submitting the unchanged empty API key field."""
        api_key = self.cleaned_data["api_key"]
        return api_key or self.instance.api_key

class PromptTemplateModelForm(forms.ModelForm):
    """Prevent assigning the same use case and role twice to an AI model."""
    class Meta:
        model  = models.PromptTemplate
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        ai_models    = cleaned_data.get("ai_models")
        use_case     = cleaned_data.get("use_case")
        role         = cleaned_data.get("role")

        if ai_models is not None and use_case and role:
            duplicates = models.PromptTemplate.objects.filter(
                ai_models__in=ai_models,
                use_case=use_case,
                role=role,
            ).exclude(pk=self.instance.pk)

            if duplicates.exists():
                self.add_error(
                    "ai_models",
                    _("Each AI model can be assigned at most one prompt template for the same use case and role."),
                )

        return cleaned_data
