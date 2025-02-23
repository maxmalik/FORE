import { NavigateFunction } from "react-router-dom";

import { getApiUrl } from "../utils";

const API_URL = getApiUrl();

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  password_hash: string;
  rounds: string[];
};

export function updateIfNotSpace(
  event: React.ChangeEvent<HTMLInputElement>,
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void
): void {
  const input = event.target.value;
  if (!input.includes(" ")) {
    handleChange(event);
  }
}

export function getUserData(): User {
  const user: string | null = localStorage.getItem("userData");

  if (user === null) {
    return {} as User;
  }

  return JSON.parse(user) as User;
}

export function logout(navigate: NavigateFunction): void {
  localStorage.removeItem("userData");
  navigate("/");
}

export async function callGetUserApi(userId: string): Promise<User> {
  const endpoint: string = `users/${userId}`;

  const url: string = `${API_URL}/${endpoint}`;

  try {
    const response: Response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const body = await response.json();
    return body as User;
  } catch (error) {
    //alert("Error occured while calling register API: " + error);
    throw error;
  }
}
