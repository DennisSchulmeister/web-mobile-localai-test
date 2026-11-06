# Web/Mobile-Test für lokale KI
# © 2026 Dennis Schulmeister-Zimolong <dennis@wpvs.de>
#
# This source code is licensed under the BSD 3-Clause License found in the
# LICENSE file in the root directory of this source tree.

import enum, logging

from .                        import client, models
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
            "Choose on rating: "
            "0 = Completely Wrong; "
            "1 = Minor Flaws; "
            "2 = No Errors Found."
        )
    )

    note: str = Field(description="Short explanation with findings and reason for the judgement")

class RelevanceJudgement(BaseModel):
    grade: ThematicRelevance = Field(
        description = (
            "Choose on rating: "
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
            "Choose on rating: "
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

def run_ai_quality_assessment(queryset):
    """Add missing AI quality assessments for the given chat messages.
    
    Parameters:
        queryset: ``ChatMessage`` query set

    Returns:
        - Number of created quality assessments
        - Number of errors
    """
    ai_clients    = client.get_all_ai_clients()
    count_created = 0
    count_errors  = 0

    for chat_message in queryset.all():
        for ai_client in ai_clients:
            try:
                if models.QualityAssessment.objects.filter(
                    message_pk = chat_message.pk,
                    judge_type = models.QualityAssessment.JudgeType.LLM,
                    judge_name = ai_client.model_id,
                ).count():
                    continue

                ai_trace = ai_client.start_trace(description=_("Quality Assessment for Chat Message %s") % chat_message)

                response = ai_client.create(
                    messages = [
                        {
                            "role":    "system",
                            "content": "",
                        },
                        {
                            "role":    "user",
                            "content": "",
                        }
                        # TODO
                    ],
                    response_model = QualityAssessment,
                )

                ai_client.save_trace()      # Only now we have the Trace ID

                models.QualityAssessment(
                    message_pk               = chat_message.pk,
                    judge_type               = models.QualityAssessment.JudgeType.LLM,
                    judge_name               = ai_client.model_id,
                    ai_trace                 = ai_trace.pk,
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

                count_created += 1
            except:
                logger.exception("Error during AI Quality Assessment")
                count_errors += 1

    return count_created, count_errors
