from datetime import datetime
from typing import Annotated, Optional

from pydantic import BaseModel, Field

from ...utils import PyObjectId


class RoundHole(BaseModel):
    score: int | None
    par: int | None
    yards: int | None
    handicap: int | None


ScoreRange = Annotated[int, Field(gt=0, lt=100)]


class RoundPost(BaseModel):
    user_id: str
    course_id: str
    tee_box_index: Optional[int]
    caption: Optional[str]
    scorecard: dict[str, Optional[ScoreRange]]


class Round(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user_id: str
    course_id: str
    tee_box_index: Optional[
        int
    ]  # Index of the selected tee box in the course's tee_boxes array
    caption: Optional[str]
    scorecard: dict[str, RoundHole]
    date_posted: datetime
