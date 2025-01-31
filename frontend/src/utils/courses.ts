import { getApiUrl } from "./utils";

export type TeeBox = {
  tee: string;
  slope: number;
  handicap: number;
  total_yards: number;
};

export type Hole = {
  Hole: number;
  Par: number;
  tees: Record<string, Record<string, string | number>>;
  Handicap: number;
};

export type Course = {
  _id: string;
  address: string;
  city: string;
  coordinates: string;
  country: string;
  created_at: string;
  fairway_grass: string;
  green_grass: string;
  num_holes: number;
  length_format: string;
  likes: any[];
  name: string;
  phone: string;
  scorecard: Array<Hole>;
  state: string;
  tee_boxes: Array<TeeBox>;
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

export function constructLocation(course: Course): string {
  let location: string = "";

  if (course.city !== "" && course.city != null) {
    location += course.city;
  }
  if (course.state !== "" && course.state != null) {
    location += ", " + course.state;
  }
  if (course.country !== "" && course.country != null) {
    location += ", " + course.country;
  }
  location = location.replace(/^,/, "").trim();

  return location;
}
