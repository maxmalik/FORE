from typing import Optional

from pydantic import BaseModel, Field


class AutofillHole(BaseModel):
    score: Optional[int] = Field(gt=0)
    par: int | None = Field(gt=0)
    fixed: Optional[bool]  # True if the score was provided by the user


Scorecard = dict[int, AutofillHole]


class AutofillScores(BaseModel):
    scorecard: dict[int, AutofillHole]
    target_total: int


FilledScorecard = dict[str, int]
