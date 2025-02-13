from random import shuffle

from fastapi import APIRouter

from .models import AutofillScores, FilledScorecard, Scorecard

autofill_scores_router = APIRouter()


def calculate_total_score(scorecard: Scorecard) -> int:
    return sum([hole.score for hole in scorecard.values()])


def get_unfixed_hole_numbers(scorecard: Scorecard) -> Scorecard:
    hole_numbers = []
    for hole_number, hole_info in scorecard.items():
        if not hole_info.fixed:
            hole_numbers.append(hole_number)

    return hole_numbers


def autofill_scores(scorecard: Scorecard, target_total: int) -> Scorecard:
    if calculate_total_score(scorecard) == target_total:
        return scorecard

    # Get the unfixed holes and shuffle them to make score filling more natural
    unfixed_hole_numbers = get_unfixed_hole_numbers(scorecard)
    shuffle(unfixed_hole_numbers)

    # Loop thru the unfixed holes
    for unfixed_hole_number in unfixed_hole_numbers:
        current_total_score = calculate_total_score(scorecard)

        # If we are currently under the target total
        if current_total_score < target_total:
            # Need to bring the hole over par (increment by 1)
            scorecard[unfixed_hole_number].score += 1

        # If we are currently over the target total
        elif current_total_score > target_total:
            # Need to bring the hole under par (decrement by 1)
            scorecard[unfixed_hole_number].score -= 1

    return autofill_scores(scorecard, target_total)


@autofill_scores_router.post(
    "/autofill-scores",
    response_model=FilledScorecard,
    description="Given a partially complete scorecard and a target final score, fill in the empty scores",
)
def autofill_scores_api(autofill_scores: AutofillScores) -> dict[str, int]:
    # Set holes to be fixed or unfixed, and
    #   set the scores for holes that are not fixed as pars
    for hole in autofill_scores.scorecard.values():
        if not hole.score:
            hole.score = hole.par or 4  # Default to 4 if no par is provided
            hole.fixed = False
        else:
            hole.fixed = True

    filled_scorecard = autofill_scores(
        autofill_scores.scorecard, autofill_scores.target_total
    )

    return {
        str(hole_number): hole.score for hole_number, hole in filled_scorecard.items()
    }
