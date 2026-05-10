import Image from "next/image";
import Link from "next/link";
import { MovieResult } from "@/types";
import { getImageUrl } from "@/lib/tmdb";
import { Star } from "lucide-react";

export function MovieCard({ item }: { item: MovieResult }) {
  const title = item.title || item.name || "Untitled";
  const link = item.media_type === "tv" || item.first_air_date ? `/tv/${item.id}` : `/movie/${item.id}`;

  return (
    <Link href={link} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted">
        <Image
          src={getImageUrl(item.poster_path)}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
          loading="lazy"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12">
          <span className="font-semibold text-white text-sm line-clamp-1">{title}</span>
          <div className="flex items-center gap-1 text-yellow-400 text-xs">
            <Star className="h-3 w-3 fill-current" />
            {item.vote_average.toFixed(1)}
          </div>
        </div>
      </div>
    </Link>
  );
        }
