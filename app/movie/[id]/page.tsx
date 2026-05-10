import { getMovieDetails, getImageUrl } from "@/lib/tmdb";
import { MovieDetails } from "@/types";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Play, Star, Clock } from "lucide-react";
import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import { notFound } from "next/navigation";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await getMovieDetails(params.id).catch(() => null);
  if (!movie) return { title: "Movie Not Found" };
  return {
    title: `${movie.title} - StreamVibe`,
    description: movie.overview,
  };
}

export default async function MoviePage({ params }: Props) {
  let movie: MovieDetails;
  try {
    movie = await getMovieDetails(params.id);
  } catch {
    notFound();
  }

  const trailer = movie.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer");

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0">
          <img
            src={getImageUrl(movie.poster_path)}
            alt={movie.title}
            className="w-full rounded-lg shadow-lg"
          />
        </div>
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-4xl font-bold">{movie.title}</h1>
            {movie.tagline && <p className="text-muted-foreground italic mt-1">{movie.tagline}</p>}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400" /> {movie.vote_average.toFixed(1)}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {movie.runtime} min</span>
              <span>{movie.release_date?.split("-")[0]}</span>
              <span>{movie.genres?.map((g) => g.name).join(", ")}</span>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
          <div className="flex gap-3">
            <Link href={`/watch/movie/${movie.id}`}>
              <Button size="lg" className="gap-2"><Play className="h-5 w-5" /> Watch Now</Button>
            </Link>
            {trailer && (
              <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="lg">▶️ Trailer</Button>
              </a>
            )}
          </div>
          {/* Cast */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Top Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {movie.credits?.cast?.slice(0, 10).map((actor) => (
                <div key={actor.id} className="flex-shrink-0 w-24 text-center">
                  <img
                    src={getImageUrl(actor.profile_path, "w500")}
                    alt={actor.name}
                    className="w-24 h-24 rounded-full object-cover mx-auto"
                  />
                  <p className="text-xs mt-1 font-medium">{actor.name}</p>
                  <p className="text-xs text-muted-foreground">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Similar */}
          {movie.similar?.results?.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Similar Movies</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {movie.similar.results.slice(0, 5).map((item) => (
                  <MovieCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
              }
