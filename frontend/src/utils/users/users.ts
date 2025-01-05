import { NavigateFunction } from 'react-router-dom';

export type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  password_hash: string;
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
