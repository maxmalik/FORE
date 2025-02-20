import { getApiUrl } from "./utils";

const API_URL = getApiUrl();

export type ScorecardMode = "all-holes" | "front-and-back" | "total-score";

export async function postRound(
  userId: string,
  courseId: string,
  teeBoxIndex: number | null,
  caption: string,
  scorecardMode: ScorecardMode,
  scorecard: Record<string, number | null>
): Promise<Response> {
  const endpoint: string = "rounds/";

  const url: string = `${API_URL}/${endpoint}`;

  let request = {
    user_id: userId,
    course_id: courseId,
    tee_box_index: teeBoxIndex,
    scorecard_mode: scorecardMode,
    scorecard: scorecard,
    ...(caption !== "" && { caption }),
  };

  try {
    const response: Response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    return response;
  } catch (error) {
    //alert("Error occured while calling register API: " + error);
    throw error;
  }
}
