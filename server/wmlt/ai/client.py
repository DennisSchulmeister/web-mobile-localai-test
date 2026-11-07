# Web/Mobile Test for Local AI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import instructor, json

from .                import models
from instructor.cache import AutoCache

class AIClient:
    """Simple wrapper around the Instructor AI client object to read the connection
    data from and save message traces to database."""

    def __init__(self, ai_model):
        """Constructor:
        
        Parameters:
            ai_model: ``AIModel`` instance
        """
        self._ai_model = ai_model
        self._client   = None
        self._trace    = None
        self._flownr   = 0
        self._traces   = []
        self._messages = []

    def _get_client(self):
        """Get Instructor client singleton."""
        if not self._client:
            auto_cache = None
            kwargs     = {**(self._ai_model.kwargs or {})}

            if self._ai_model.cache_size:
                auto_cache = AutoCache(maxsize=self._ai_model.cache_size)

            if self._ai_model.model_id.startswith("openai") and not "reasoning_effort" in kwargs:
                kwargs["reasoning_effort"] = "none"

            self._client = instructor.from_provider(
                model            = self._ai_model.model_id,
                api_key          = self._ai_model.api_key or None,
                async_client     = False,
                cache            = auto_cache,
                mode             = self._ai_model.mode_inspector,
                **kwargs
            )

        return self._client

    @property
    def model_id(self):
        """Model ID"""
        return self._ai_model.model_id

    def start_trace(self, description):
        """Start a new message trace. Returns the yet unsaved ``Trace`` instance."""
        self._trace = models.Trace(
            model             = self._ai_model,
            description       = description or None,
            prompt_tokens     = 0,
            reasoning_tokens  = 0,
            completion_tokens = 0,
        )

        self._traces.append(self._trace)
        self._flownr = 0

        return self._trace

    def save_trace(self):
        """Save message trace and its logged messages"""
        for trace in self._traces:
            trace.save()

        for message in self._messages:
            message.save()

        # Remember last trace in case new messages shall be appended
        self._traces   = [self._trace] if self._trace else None
        self._messages = []

    def create(self, messages, response_model=None):
        """Call AI model to create a response message and trace message flow."""
        client = self._get_client()
        msgnr  = 0

        # Trace request
        if self._trace:
            self._flownr += 1

            for message in messages:
                msgnr += 1

                self._messages.append(models.Message(
                    trace   = self._trace,
                    flownr  = self._flownr,
                    msgnr   = msgnr,
                    role    = message["role"],
                    content = message["content"],
                ))

            if response_model:
                msgnr += 1

                self._messages.append(models.Message(
                    trace   = self._trace,
                    flownr  = self._flownr,
                    msgnr   = msgnr,
                    role    = "schema",
                    content = json.dumps(response_model.model_json_schema(), indent=4),
                ))

        # Call AI model
        result, completion = client.create_with_completion(
            messages       = messages,
            response_model = response_model,
            max_retries    = self._ai_model.max_retries or 0,
        )

        # Trace response and token usage
        if self._trace:
            msgnr += 1

            self._messages.append(models.Message(
                trace   = self._trace,
                flownr  = self._flownr,
                msgnr   = msgnr,
                role    = "assistant",
                content = result.model_dump_json(indent=4),
            ))

            try:
                self._trace.prompt_tokens += completion.usage.prompt_tokens
            except AttributeError:
                # Completion response not in OpenAI format
                pass

            try:
                self._trace.reasoning_tokens += completion.usage.completion_tokens_details.reasoning_tokens
            except AttributeError:
                # Completion response not in OpenAI format
                pass

            try:
                self._trace.completion_tokens += completion.usage.completion_tokens
            except AttributeError:
                # Completion response not in OpenAI format
                pass

        return result

def get_ai_client(model_id):
    """Get the AI client for the given model ID. May throw ``AIModel.DoesNotExist``."""
    ai_model = models.AIModel.objects.get(model_id=model_id)
    return AIClient(ai_model)

def get_all_ai_clients():
    """Get a list with all available AI clients. May return an empty list."""
    return [AIClient(ai_model) for ai_model in models.AIModel.objects.all()]
