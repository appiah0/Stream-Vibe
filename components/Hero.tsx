"use client";

import { useEffect, useState } from "react";
import { MovieResult } from "@/types";
import { getTrending, getImageUrl } from "@/lib/tmdb";
import { Button } from "./ui/button";
import { Play, Info } from "lucide-react";
import Link from "next/link";

export function Hero() {
  const [trending, setTrending] = useState<MovieResult | null>(null);

  useEffect(() => {
    getTrending()
      .then((res) => {
        if (res.results?.length) {
          const random = res.results[Math.floor(Math.random() * res.results.length)];
          setTrending(random);
        }
      })
      .catch(console.error);
  }, []);

  if (!trending) return null;

  const title = trending.title || trending.name;
  const type = trending.media_type === "tv" ? "tv" : "movie";

  return (
    <div className="relative w-full h-[80vh] md:h-[90vh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${getImageUrl(trending.backdrop_path, "original")})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
      </div>
      <div className="relative container h-full flex flex-col justify-center max-w-3xl space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">{title}</h1>
        <p className="text-lg text-gray-200 line-clamp-3 max-w-2xl">{trending.overview}</p>
        <div className="flex gap-4">
          <Link href={`/watch/${type}/${trending.id}`}>
            <Button size="lg" className="gap-2">
              <Play className="h-5 w-5" /> Watch Now
            </Button>
          </Link>
          <Link href={`/${type}/${trending.id}`}>
            <Button variant="outline" size="lg" className="gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Info className="h-5 w-5" /> More Info
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
    }
