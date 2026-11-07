# Web/Mobile Test for Local AI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import enum, logging

from .                        import models
from ..ai.client              import get_all_ai_clients
from ..ai.models              import PromptTemplate
from django.utils.translation import gettext_lazy as _
from pydantic                 import BaseModel
from pydantic                 import Field

logger = logging.getLogger(__name__)

class Correctness(enum.IntEnum):
    COMPLETELY_WRONG = 0
    MINOR_FLAWS      = 1
    NO_ERRORS_FOUND  = 2

class ThematicRelevance(enum.IntEnum):
    UNRELATED_ANSWER = 0
    LOOSELY_RELATED  = 1
    BEYOND_SCOPE     = 2
    PERFECT_FIT      = 3

class MessageLength(enum.IntEnum):
    NO_RESPONSE  = 0
    TOO_SHORT    = 1
    TOO_LONG     = 2
    PERFECT_SIZE = 3

class CorrectnessJudgement(BaseModel):
    grade: Correctness = Field(
        description = (
            "Choose one rating: "
            "0 = Completely Wrong; "
            "1 = Minor Flaws; "
            "2 = No Errors Found."
        )
    )

    note: str = Field(description="Short explanation with findings and reason for the judgement")

class RelevanceJudgement(BaseModel):
    grade: ThematicRelevance = Field(
        description = (
            "Choose one rating: "
            "0 = Unrelated Answer; "
            "1 = Loosely Related Answer; "
            "2 = Answer Beyond Scope; "
            "3 = Perfect Fit."
        )
    )

    note: str = Field(description="Short explanation with findings and reason for the judgement")

class LengthJudgement(BaseModel):
    grade: MessageLength = Field(
        description = (
            "Choose one rating: "
            "0 = Empty Response; "
            "1 = Too Short; "
            "2 = Too Long; "
            "3 = Perfect Size."
        )
    )

    note: str = Field(description="Short explanation with findings and reason for the judgement")

class QualityAssessment(BaseModel):
    """Quality assessment of AI generated chat response."""
    syntax: CorrectnessJudgement = Field(
        description = "Syntactic quality: Is the markdown and HTML syntax of the response formally correct?"
    )

    lingua: CorrectnessJudgement = Field(
        description = "Linguistic quality: Are language, punctuation and grammar correct?"
    )

    content: CorrectnessJudgement = Field(
        description = "Quality of content: Is the answer factually correct, complete and easy to understand?"
    )

    relevance: RelevanceJudgement = Field(
        description = "Thematic relevance: To what extent does the answer relate to the original question?"
    )

    length: LengthJudgement = Field(
        description = (
            "Answer length: Is the length of the answer appropriate for the question? "
            "Is the answer short enough to be generated locally on mobile devices, but not too short?"
        )
    )

def iter_ai_quality_assessment(queryset):
    """Add missing AI quality assessments for the given chat messages.
    
    Parameters:
        queryset: ``ChatMessage`` query set

    Returns an iterator for status objects. A status is returned before and after each
    processed chat message. The status object has the following form:

    .. code-block::

        {
            "chat_message": ChatMessage,
            "model_id":     AIModel.model_id,
            "status":       "start" | "success" | "error",
            "error":        Exception | None,
        }
    """
    ai_clients = get_all_ai_clients()

    for chat_message in queryset.all():
        for ai_client in ai_clients:
            try:
                if models.QualityAssessment.objects.filter(
                    message__pk = chat_message.pk,
                    judge_type  = models.QualityAssessment.JudgeType.LLM,
                    judge_name  = ai_client.model_id,
                ).count():
                    continue

                yield {
                    "chat_message": chat_message,
                    "model_id":     ai_client.model_id,
                    "status":       "start",
                    "error":        None
                }

                ai_trace = ai_client.start_trace(
                    description=_("Quality Assessment for Chat Message %(chat_message)s")
                    % {"chat_message": chat_message}
                )

                placeholders = {
                    "user_message":      chat_message.user_message,
                    "assistant_message": chat_message.assistant_message,
                }

                templates = PromptTemplate.objects.for_use_case(
                    model_id = ai_client.model_id,
                    use_case = PromptTemplate.UseCase.QUALITY_ASSESSMENT
                )
                
                response = ai_client.create(
                    messages       = [template.apply_template(placeholders) for template in templates],
                    response_model = QualityAssessment,
                )

                ai_client.save_trace()      # Only now we have the Trace ID

                models.QualityAssessment(
                    message                  = chat_message,
                    judge_type               = models.QualityAssessment.JudgeType.LLM,
                    judge_name               = ai_client.model_id,
                    ai_trace                 = ai_trace,
                    correct_syntax_grade     = response.syntax.grade,
                    correct_syntax_note      = response.syntax.note,
                    correct_lingua_grade     = response.lingua.grade,
                    correct_lingua_note      = response.lingua.note,
                    correct_content_grade    = response.content.grade,
                    correct_content_note     = response.content.note,
                    thematic_relevance_grade = response.relevance.grade,
                    thematic_relevance_note  = response.relevance.note,
                    message_length_grade     = response.length.grade,
                    message_length_note      = response.length.note,
                ).save()

                yield {
                    "chat_message": chat_message,
                    "model_id":     ai_client.model_id,
                    "status":       "success",
                    "error":        None
                }
            except Exception as error:
                logger.exception(_("Error during AI quality assessment"))

                yield {
                    "chat_message": chat_message,
                    "model_id":     ai_client.model_id,
                    "status":       "error",
                    "error":        error,
                }

def run_ai_quality_assessment(queryset):
    """Add missing AI quality assessments for the given chat messages.
    
    Parameters:
        queryset: ``ChatMessage`` query set

    Returns:
        - Number of created quality assessments
        - Number of errors
    """
    count_created = 0
    count_errors  = 0

    for status in iter_ai_quality_assessment(queryset):
        if status["status"] == "success":
            count_created += 1
        elif status["status"] == "error":
            count_errors += 1

    return count_created, count_errors
