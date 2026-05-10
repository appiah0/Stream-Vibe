import { getTVDetails, getImageUrl } from "@/lib/tmdb";
import { TVDetails } from "@/types";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Play, Star, Calendar } from "lucide-react";
import Link from "next/link";
import { MovieCard } from "@/components/MovieCard";
import { notFound } from "next/navigation";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const show = await getTVDetails(params.id).catch(() => null);
  if (!show) return { title: "TV Show Not Found" };
  return {
    title: `${show.name} - StreamVibe`,
    description: show.overview,
  };
}

export default async function TVPage({ params }: Props) {
  let show: TVDetails;
  try {
    show = await getTVDetails(params.id);
  } catch {
    notFound();
  }

  const trailer = show.videos?.results?.find((v) => v.site === "YouTube" && v.type === "Trailer");
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0">
          <img src={getImageUrl(show.poster_path)} alt={show.name} className="w-full rounded-lg shadow-lg" />
        </div>
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-4xl font-bold">{show.name}</h1>
            {show.tagline && <p className="text-muted-foreground italic mt-1">{show.tagline}</p>}
            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-400" /> {show.vote_average.toFixed(1)}</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {show.first_air_date?.split("-")[0]}</span>
              <span>{show.number_of_seasons} Season{show.number_of_seasons !== 1 && "s"}</span>
              <span>{show.genres?.map((g: any) => g.name).join(", ")}</span>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">{show.overview}</p>
          <div className="flex gap-3">
            <Link href={`/watch/tv/${show.id}`}>
              <Button size="lg" className="gap-2"><Play className="h-5 w-5" /> Watch Now</Button>
            </Link>
            {trailer && (
              <a href={`https://www.youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noreferrer">
                <Button variant="outline" size="lg">▶️ Trailer</Button>
              </a>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Top Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {show.credits?.cast?.slice(0, 10).map((actor: any) => (
                <div key={actor.id} className="flex-shrink-0 w-24 text-center">
                  <img src={getImageUrl(actor.profile_path, "w500")} alt={actor.name} className="w-24 h-24 rounded-full object-cover mx-auto" />
                  <p className="text-xs mt-1 font-medium">{actor.name}</p>
                  <p className="text-xs text-muted-foreground">{actor.character}</p>
                </div>
              ))}
            </div>
          </div>
          {show.similar?.results?.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Similar TV Shows</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {show.similar.results.slice(0, 5).map((item: any) => (
                  <MovieCard key={item.id} item={{ ...item, media_type: "tv" }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
