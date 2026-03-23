// ─── Types ──────────────────────────────────────────────

export interface CreateIssueInput {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels: string[];
}

export interface CreatedIssue {
  number: number;
  url: string;
  title: string;
}

interface GitHubLabel {
  name: string;
  color: string;
  description: string | null;
}

// ─── Constants ──────────────────────────────────────────

const GITHUB_API = "https://api.github.com";
const USER_AGENT = "Glitchgrab/1.0";

// ─── Helpers ────────────────────────────────────────────

function headers(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// ─── Create Issue ───────────────────────────────────────

export async function createGitHubIssue(
  accessToken: string,
  input: CreateIssueInput
): Promise<CreatedIssue> {
  const url = `${GITHUB_API}/repos/${input.owner}/${input.repo}/issues`;

  const response = await fetch(url, {
    method: "POST",
    headers: headers(accessToken),
    body: JSON.stringify({
      title: input.title,
      body: input.body,
      labels: input.labels,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `GitHub API error (${response.status}): ${errorBody}`
    );
  }

  const data = (await response.json()) as {
    number: number;
    html_url: string;
    title: string;
  };

  return {
    number: data.number,
    url: data.html_url,
    title: data.title,
  };
}

// ─── Fetch Repo Labels ─────────────────────────────────

export async function fetchRepoLabels(
  accessToken: string,
  owner: string,
  repo: string
): Promise<string[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/labels?per_page=100`;

  const response = await fetch(url, {
    method: "GET",
    headers: headers(accessToken),
  });

  if (!response.ok) {
    // Non-fatal — return empty if we can't fetch labels
    console.error(
      `Failed to fetch labels (${response.status}):`,
      await response.text()
    );
    return [];
  }

  const data = (await response.json()) as GitHubLabel[];
  return data.map((label) => label.name);
}
