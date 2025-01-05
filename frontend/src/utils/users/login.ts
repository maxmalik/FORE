import * as yup from 'yup';

import { getApiUrl } from '../utils';

const API_URL = getApiUrl();

export const loginSchema = yup.object().shape({
  usernameOrEmail: yup
    .string()
    .trim()
    .required("Please enter your username or email."),
  password: yup.string().trim().required("Please enter your password."),
});

export type LoginUser = yup.InferType<typeof loginSchema>;

// Returns either the response from the Login API
//  or a string describing an exception that occurred in the process
export async function callLoginApi(values: LoginUser): Promise<Response> {
  const endpoint: string = "users/login";

  const url: string = `${API_URL}/${endpoint}`;

  const request = {
    username_or_email: values.usernameOrEmail,
    password: values.password,
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
