# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import instructor
from . import models

class AIClient:
    """Simple wrapper around the Instructor AI client object to read the connection
    data from and save message traces to database."""

    def __init__(self, ai_model):
        """Constructor:
        
        Parameters:
            ai_model: ``AIModel`` instance
        """
        self._ai_model = ai_model

    def _get_client(self):
        """Get Instructor client singleton."""
        if not self._client:
            auto_cache = None

            if self._ai_model.cache_size:
                auto_cache = instructor.cache.AutoCache(maxsize=self._ai_model.cache_size)

            self._client = instructor.from_provider(
                model        = self._ai_model.model_id,
                api_key      = self._ai_model.api_key or None,
                async_client = False,
                cache        = auto_cache,
                mode         = self._ai_model.mode or None,
                **self._ai_model.kwargs
            )

        return self._client

    @property
    def model_id(self):
        """Model ID"""
        return self._ai_model.model_id

    # TODO: API for starting a new trace / choosing which trace to append the message flows?
    # Implicitly start a new flow when an AIClient instance is created.

    def create(self, messages, response_model=None):
        """Call AI model to create a response message and trace message flow."""
        client = self._get_client()

        result, completion = client.create_with_completion(
            messages       = messages,
            response_model = response_model,
            max_retries    = self._ai_model.max_retries or 0,
        )

        # TODO: Log raw request, raw response, usage tokens
        # TODO: Handle batch model

def get_ai_client(model_id):
    """Get the AI client for the given model ID. May throw ``AIModel.DoesNotExist``."""
    ai_model = models.AIModel.objects.get(model_id=model_id)
    return AIClient(ai_model)

def get_all_ai_clients():
    """Get a list with all available AI clients. May return an empty list."""
    return [AIClient(ai_model) for ai_model in models.AIModel.objects.all()]
