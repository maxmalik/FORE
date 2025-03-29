import heapq
from math import floor
from statistics import mean

from ...routers.courses.courses import Course
from ...routers.courses.models import CourseHole
from ...routers.rounds.models import Round
from ..rounds.models import RoundScorecard, ScorecardModeEnum

# Maps the number of rounds the handicap is out of to the adjustment to be applied to the final handicap calculation
HANDICAP_ADJUSTMENTS = {3: -2, 4: -1, 5: 0, 6: -1}

NUM_ROUNDS_TO_LOWEST_K = {
    3: 1,
    4: 1,
    5: 1,
    6: 2,
    7: 2,
    8: 2,
    9: 3,
    10: 3,
    11: 3,
    12: 4,
    13: 4,
    14: 4,
    15: 5,
    16: 5,
    17: 6,
    18: 6,
    19: 7,
}


def calculate_course_handicap(
    player_handicap: float, slope_rating: float, course_rating: float, course_par: int
) -> float:
    return player_handicap * (slope_rating / 113) + (course_rating) - course_par


def calculate_adjusted_gross_score(
    scorecard: RoundScorecard,
    scorecard_mode: ScorecardModeEnum,
    player_handicap: float | None,
    course_scorecard: list[CourseHole],
    slope_rating: float,
    course_rating: float,
):

    if course_scorecard:
        course_par = sum([hole.par for hole in course_scorecard])
    else:
        course_par = 72

    if player_handicap:
        course_handicap = calculate_course_handicap(
            player_handicap, slope_rating, course_rating, course_par
        )

    adjusted_gross_score = 0

    if scorecard_mode == ScorecardModeEnum.all_holes:
        for hole_number, hole in scorecard.items():

            if player_handicap:

                hole_index = int(hole_number) - 1
                course_hole = course_scorecard[hole_index]
                hole_stroke_index = course_hole.handicap

                """
                "If you have an established Handicap Index®, the maximum score for each hole played
                is limited to a net double bogey, equal to double bogey
                plus any handicap strokes you are entitled to receive based on your Course Handicap
                """
                max_hole_score = course_hole.par + 2
                if hole_stroke_index <= course_handicap:
                    max_hole_score += 1 + floor(
                        (course_handicap - hole_stroke_index) / len(course_scorecard)
                    )
                adjusted_gross_score += min(hole["score"], max_hole_score)

            else:
                """
                For players posting initial scores to establish a Handicap Index,
                the maximum hole score is limited to par + 5
                """
                adjusted_gross_score += min(hole["score"], hole["par"] + 5)

    elif scorecard_mode == ScorecardModeEnum.front_and_back:
        adjusted_gross_score += scorecard["front"]["score"]
        adjusted_gross_score += scorecard["back"]["score"]

    else:
        adjusted_gross_score = scorecard["total"]["score"]

    return adjusted_gross_score


def get_slope_and_course_rating(tee_box_index: int | None, course: Course):

    if tee_box_index:
        slope_rating = course.tee_boxes[tee_box_index].slope
        course_rating = course.tee_boxes[tee_box_index].handicap

    else:
        # Use the average slope and course rating for all tee boxes
        if course.tee_boxes:
            slope_rating = mean([tee_box.slope for tee_box in course.tee_boxes])
            course_rating = mean([tee_box.handicap for tee_box in course.tee_boxes])

        # Default to standard values
        else:
            slope_rating = 113
            course_rating = 72

    return slope_rating, course_rating


def calculate_score_differential(
    scorecard: RoundScorecard,
    scorecard_mode: ScorecardModeEnum,
    tee_box_index: int | None,
    course: Course,
    player_handicap: float | None = None,
    pcc_adjustment: float = 0,
) -> float:
    slope_rating, course_rating = get_slope_and_course_rating(tee_box_index, course)

    adjusted_gross_score = calculate_adjusted_gross_score(
        scorecard,
        scorecard_mode,
        player_handicap,
        course.scorecard,
        slope_rating,
        course_rating,
    )

    return (113 / slope_rating) * (
        adjusted_gross_score - course_rating - pcc_adjustment
    )


def calculate_handicap(score_differentials: list[float]) -> float:

    heap = []
    for score_differential in score_differentials:
        heapq.heappush(heap, score_differential)

    num_rounds = len(heap)

    # Average the lowest k score differentials, where k is determined by the number of score differentials used in the calculation
    k = NUM_ROUNDS_TO_LOWEST_K.get(num_rounds, 0)
    return mean(heap[0:k]) + HANDICAP_ADJUSTMENTS.get(num_rounds, 0)
