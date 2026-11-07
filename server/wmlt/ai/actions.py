# Web/Mobile Test for Local AI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

from .                        import client

from django.utils.translation import gettext_lazy as _
from pydantic                 import BaseModel

class TestResponse(BaseModel):
    """Response to a test message"""
    text: str

def test_ai_models(queryset):
    """Test the connection to the given AI models by sending and tracing
    a test message.
    
    Parameters:
        queryset: ``AIModel`` query set

    Returns:
        List of dictionaries keys ``model`` and ``response``. ``model`` is
        the ``AIModel`` instance and ``response`` the generated test response.
        If the model fails to produce a response, it will not be included.
    """
    result = []

    for model in queryset.all():
        if not model.model_id:
            continue

        ai_client = client.get_ai_client(model.model_id)
        ai_client.start_trace(description=_("Test AI Model"))

        response = ai_client.create(
            messages = [{
                "role":    "user",
                "content": _("This is a test. Please acknowledge.")
            }],
            response_model = TestResponse,
        )

        if response and response.text:
            result.append({
                "model":    model,
                "response": response,
            })

        ai_client.save_trace()

    return result
