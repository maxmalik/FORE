from typing import Any, Optional

from pydantic import BaseModel, Field, model_validator

from ...utils import PyObjectId


class UserPreview(BaseModel):

    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    username: str


# Contains simple information about a course for quick display on the frontend UI
class CoursePreview(BaseModel):

    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str
    num_holes: int
    city: str
    state: str
    country: str
    length_format: str


class Hole(BaseModel):
    score: Optional[int] = Field(ge=1)  # Manually entered by user
    par: Optional[int]
    yards: Optional[int]


class Round(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    user: UserPreview
    course: CoursePreview
    tees: Optional[str]
    scorecard: dict[str, Hole]

    # Take only the scorecard keys in the range of the number of holes
    @model_validator(mode="before")
    @classmethod
    def sanitize_scorecard(cls, data: dict[str, Any]) -> dict[str, Any]:

        sanitized_scorecard = {}

        num_holes = data["course"]["num_holes"]

        for hole_number in range(1, num_holes + 1):

            if str(hole_number) in data["scorecard"]:
                hole = data["scorecard"][str(hole_number)]
                sanitized_scorecard[str(hole_number)] = hole

        data["scorecard"] = sanitized_scorecard

        return data
