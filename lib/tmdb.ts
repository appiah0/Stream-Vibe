import { MovieResult } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/tmdb";

export async function fetchFromTMDB(endpoint: string) {
  const res = await fetch(`${API_BASE}?endpoint=${encodeURIComponent(endpoint)}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
}

export async function getTrending() {
  return fetchFromTMDB("/trending/all/week");
}

export async function getPopularMovies() {
  return fetchFromTMDB("/movie/popular");
}

export async function getPopularTV() {
  return fetchFromTMDB("/tv/popular");
}

export async function getMovieDetails(id: string) {
  return fetchFromTMDB(`/movie/${id}?append_to_response=videos,credits,similar`);
}

export async function getTVDetails(id: string) {
  return fetchFromTMDB(`/tv/${id}?append_to_response=videos,credits,similar`);
}

export async function searchMulti(query: string) {
  return fetchFromTMDB(`/search/multi?query=${encodeURIComponent(query)}`);
}

export function getImageUrl(path: string | null, size: "w500" | "original" = "w500") {
  if (!path) return "/placeholder.jpg";
  return `https://image.tmdb.org/t/p/${size}${path}`;
    }
