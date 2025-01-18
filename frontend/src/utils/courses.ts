import { getApiUrl } from "./utils";

export type Course = {
  _id: string;
  address: string;
  city: string;
  coordinates: string;
  country: string;
  created_at: string;
  fairway_grass: string;
  green_grass: string;
  holes: number;
  length_format: string;
  likes: any[];
  name: string;
  phone: string;
  scorecard: Array<Record<string, unknown>>; // Array of objects with string keys and unknown values
  state: string;
  tee_boxes: Array<Record<string, unknown>>; // Array of objects with string keys and unknown values
  updated_at: string;
  website: string;
  zip: string;
};

const API_URL = getApiUrl();

export async function callSearchApi(courseName: string): Promise<Response> {
  const endpoint: string = "courses/search";

  const url: string = `${API_URL}/${endpoint}`;

  const request = { name: courseName };

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
