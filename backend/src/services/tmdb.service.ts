export interface WatchRegion {
  iso_3166_1: string;
  english_name: string;
  native_name: string;
}

interface WatchRegionsResponse {
  results: WatchRegion[];
}

let regionsCache: WatchRegion[] | null = null;
let cacheExpiresAt = 0;
let pendingRequest: Promise<WatchRegion[]> | null = null;

export async function getWatchRegions(): Promise<WatchRegion[]> {
  if (regionsCache && Date.now() < cacheExpiresAt) {
    return regionsCache;
  }

  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = (async () => {
    const token = process.env.TMDB_ACCESS_TOKEN;

    if (!token) {
      throw new Error("Falta configurar TMDB_ACCESS_TOKEN");
    }

    const response = await fetch(
      "https://api.themoviedb.org/3/watch/providers/regions?language=en-US",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      throw new Error(`TMDB respondió con estado ${response.status}`);
    }

    const data: WatchRegionsResponse = await response.json();

    regionsCache = data.results;
    cacheExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    return regionsCache;
  })();

  try {
    return await pendingRequest;
  } finally {
    pendingRequest = null;
  }
}
