function getBrowserApiUrl() {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/trpc";
  }

  const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
  if (configuredUrl) {
    return configuredUrl;
  }

  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:4000/trpc`;
}

export function getApiUrl() {
  return getBrowserApiUrl();
}
