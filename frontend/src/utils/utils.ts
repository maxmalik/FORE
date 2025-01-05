export function getApiUrl(): string {
  let api_url: string;

  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    api_url = "http://127.0.0.1:8000";
  } else {
    api_url = import.meta.env.VITE_API_URL;
  }
  return api_url;
}
