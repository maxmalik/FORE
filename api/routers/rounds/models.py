from datetime import datetime
from enum import Enum
from typing import Annotated, Optional

from pydantic import BaseModel, Field, model_validator

from ...utils import PyObjectId
from ..courses.models import Course

ScoreRange = Annotated[int, Field(gt=0)]
RoundScorecard = dict[str, ScoreRange]


class ScorecardModeEnum(str, Enum):
    all_holes = "all-holes"
    front_and_back = "front-and-back"
    total_score = "total-score"


class RoundPost(BaseModel):
    user_id: str
    course_id: str
    tee_box_index: Optional[int]
    caption: Optional[str] = None
    scorecard_mode: ScorecardModeEnum
    scorecard: RoundScorecard


class Round(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    course_id: str
    tee_box_index: Optional[
        int
    ]  # Index of the selected tee box in the course's tee_boxes array
    caption: Optional[str]
    scorecard_mode: ScorecardModeEnum
    scorecard: RoundScorecard
    score_differential: float
    date_posted: datetime


class RoundGet(Round):
    course_data: Optional[Course]
