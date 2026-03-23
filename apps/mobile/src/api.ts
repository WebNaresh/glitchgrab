const BASE_URL = __DEV__
  ? "http://192.168.1.3:3000"
  : "https://glitchgrab.dev";

export { BASE_URL };

/**
 * Exchange GitHub OAuth code for a Glitchgrab session.
 * Sends the code to our backend which handles the full exchange securely.
 */
export async function exchangeCodeForSession(
  code: string
): Promise<{
  sessionToken: string;
  user: { name: string; email: string; image: string };
}> {
  const res = await fetch(`${BASE_URL}/api/auth/mobile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "Unknown error");
    throw new Error(`Auth failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.success || !data.sessionToken) {
    throw new Error(data.error || "Invalid response from server");
  }

  return {
    sessionToken: data.sessionToken,
    user: data.user,
  };
}
