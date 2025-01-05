import * as yup from 'yup';

import { getApiUrl } from '../utils';

const API_URL = getApiUrl();

export const registerSchema = yup.object().shape({
  name: yup.string().trim().required("Please enter your name."),
  username: yup
    .string()
    .trim()
    .required("Please choose a username.")
    .matches(
      /^(?=[a-zA-Z0-9._]{3,20}$)(?!.*[_.]{2})[^_.].*[^_.]$/,
      "Please enter a valid username."
    )
    .test("username-taken", "Username is already taken.", async (value) => {
      const taken = await usernameIsTaken(value);
      return !taken;
      if (value == "max") {
        return false;
      }
      return true;
    }),
  email: yup
    .string()
    .trim()
    .required("Please enter your email.")
    .email("Please enter a valid email.")
    .test("email-taken", "Email is already taken.", async (value) => {
      const taken = await emailIsTaken(value);
      return !taken;
      if (value == "max@gmail.com") {
        return false;
      }
      return true;
    }),
  password: yup
    .string()
    .trim()
    .required("Please enter a password.")
    .matches(
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
      "Password must meet the requirements."
    ),
  passwordConfirmation: yup
    .string()
    .trim()
    .required("Please re-enter your password.")
    .oneOf([yup.ref("password")], "Passwords must match."),
});

export type RegisterUser = yup.InferType<typeof registerSchema>;

export async function usernameIsTaken(username: string): Promise<boolean> {
  const endpoint: string = "users/username-taken";

  const url: string = `${API_URL}/${endpoint}/${username}`;

  try {
    const response: Response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 200 OK code indicates username is not taken
    if (response.ok) {
      return false;
    }
    // Error code indicates username is taken
    else {
      return true;
    }
  } catch (error) {
    alert("Error occured while checking if username is taken: " + error);
    return false; // Say username is not taken to not confuse the user
  }
}

export async function emailIsTaken(email: string): Promise<boolean> {
  const endpoint: string = "users/email-taken";

  const url: string = `${API_URL}/${endpoint}/${email}`;

  try {
    const response: Response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 200 OK code indicates email is not taken
    if (response.ok) {
      return false;
    }
    // Error code indicates email is taken
    else {
      return true;
    }
  } catch (error) {
    alert("Error occured while checking if email is taken: " + error);
    return false; // Say email is not taken to not confuse the user
  }
}

// Returns either the response from the Register API
//  or a string describing an exception that occurred in the process
export async function callRegisterApi(values: RegisterUser): Promise<Response> {
  const endpoint: string = "users/register";

  const url: string = `${API_URL}/${endpoint}`;

  const request = {
    name: values.name,
    username: values.username,
    email: values.email,
    password: values.password,
    password_confirmation: values.passwordConfirmation,
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
