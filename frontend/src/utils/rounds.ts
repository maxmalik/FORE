import { getApiUrl } from "./utils";

const API_URL = getApiUrl();

export async function postRound(
  userId: string,
  courseId: string,
  teeBoxIndex: number | null,
  scorecard: Record<string, number | null>
): Promise<Response> {
  const endpoint: string = "rounds/";

  const url: string = `${API_URL}/${endpoint}`;

  const request = {
    user_id: userId,
    course_id: courseId,
    tee_box_index: teeBoxIndex,
    scorecard: scorecard,
  };

  console.log(request);

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
