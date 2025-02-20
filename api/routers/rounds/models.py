from datetime import datetime
from enum import Enum
from typing import Annotated, Optional

from pydantic import BaseModel, Field

from ...utils import PyObjectId

RoundScorecard = dict[str, dict[str, int]]
ScoreRange = Annotated[int, Field(gt=0)]


class ScorecardModeEnum(str, Enum):
    all_holes = "all-holes"
    front_and_back = "front-and-back"
    total_score = "total-score"


class RoundPost(BaseModel):
    user_id: str
    course_id: str
    tee_box_index: Optional[int]
    caption: Optional[str]
    scorecard_mode: ScorecardModeEnum
    scorecard: dict[str, ScoreRange]


class Round(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    course_id: str
    tee_box_index: Optional[
        int
    ]  # Index of the selected tee box in the course's tee_boxes array
    caption: Optional[str]
    scorecard: RoundScorecard
    date_posted: datetime
