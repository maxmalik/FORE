import { getApiUrl } from "./utils";

export type HoleTeeBox = {
  color: string;
  yards: number;
};

export type TeeBox = {
  tee: string;
  slope_rating: number;
  course_rating: number;
  total_yards: number;
};

export type Hole = {
  hole_number: number;
  par: number;
  tees: Record<string, HoleTeeBox>;
  handicap: number;
};

export type Course = {
  id: string;
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
  par: number | null;
  phone: string;
  scorecard: Array<Hole>;
  state: string;
  tee_boxes: Array<TeeBox>;
  updated_at: string;
  website: string;
  zip: string;
};

const API_URL = getApiUrl();

export async function searchCourses(courseName: string): Promise<Course[]> {
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

    const results = await response.json();
    return results as Course[];
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
