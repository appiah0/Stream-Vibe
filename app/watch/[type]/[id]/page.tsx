import { getMovieDetails, getTVDetails, getImageUrl } from "@/lib/tmdb";
import { VideoPlayer } from "@/components/VideoPlayer";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type Props = { params: { type: string; id: string } };

export default async function WatchPage({ params }: Props) {
  const { type, id } = params;
  let title = "";
  let poster = "";

  try {
    if (type === "movie") {
      const movie = await getMovieDetails(id);
      title = movie.title;
      poster = getImageUrl(movie.backdrop_path, "original");
    } else if (type === "tv") {
      const tv = await getTVDetails(id);
      title = tv.name;
      poster = getImageUrl(tv.backdrop_path, "original");
    } else {
      notFound();
    }
  } catch {
    notFound();
  }

  return (
    <div className="container py-8 space-y-6">
      <Link href={`/${type}/${id}`}>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to details
        </Button>
      </Link>
      <h1 className="text-3xl font-bold">Now Playing: {title}</h1>
      <VideoPlayer poster={poster} />
      <p className="text-sm text-muted-foreground">
        * This is a demo player. In a production app, replace the default HLS stream with licensed content.
      </p>
    </div>
  );
  }
