export interface MovieResult {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: string;
  adult: boolean;
  original_language: string;
  genre_ids: number[];
  popularity: number;
  release_date?: string;
  first_air_date?: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface MovieDetails extends MovieResult {
  budget: number;
  genres: { id: number; name: string }[];
  homepage: string;
  imdb_id: string;
  production_companies: { id: number; logo_path: string; name: string; origin_country: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  revenue: number;
  runtime: number;
  spoken_languages: { english_name: string; iso_639_1: string; name: string }[];
  status: string;
  tagline: string;
  videos: {
    results: { key: string; site: string; type: string }[];
  };
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  similar: {
    results: MovieResult[];
  };
}

export interface TVDetails extends MovieResult {
  created_by: { id: number; name: string; profile_path: string | null }[];
  episode_run_time: number[];
  genres: { id: number; name: string }[];
  homepage: string;
  in_production: boolean;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: { air_date: string; episode_number: number; name: string; overview: string; still_path: string | null; vote_average: number; vote_count: number };
  next_episode_to_air: { air_date: string; episode_number: number; name: string; overview: string; still_path: string | null; vote_average: number; vote_count: number } | null;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: { air_date: string; episode_count: number; id: number; name: string; overview: string; poster_path: string | null; season_number: number }[];
  videos: {
    results: { key: string; site: string; type: string }[];
  };
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[];
  };
  similar: {
    results: MovieResult[];
  };
}
