import { getPopularMovies, getPopularTV } from "@/lib/tmdb";
import { Hero } from "@/components/Hero";
import { MovieCard } from "@/components/MovieCard";
import { MovieResult } from "@/types";

export default async function HomePage() {
  const [moviesRes, tvRes] = await Promise.all([getPopularMovies(), getPopularTV()]);

  return (
    <>
      <Hero />
      <div className="container py-8 space-y-12">
        <section>
          <h2 className="text-2xl font-bold mb-4">🔥 Popular Movies</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {moviesRes.results?.map((movie: MovieResult) => (
              <MovieCard key={movie.id} item={{ ...movie, media_type: "movie" }} />
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-2xl font-bold mb-4">📺 Popular TV Shows</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {tvRes.results?.map((show: MovieResult) => (
              <MovieCard key={show.id} item={{ ...show, media_type: "tv" }} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
              }
