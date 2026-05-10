"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { searchMulti } from "@/lib/tmdb";
import { MovieCard } from "@/components/MovieCard";
import { MovieResult } from "@/types";
import { SearchBar } from "@/components/SearchBar";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<MovieResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    searchMulti(query)
      .then((res) => {
        setResults(res.results?.filter((r: any) => r.media_type !== "person") || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Search</h1>
      <SearchBar />
      {loading && <p className="text-center text-muted-foreground">Searching...</p>}
      {!loading && query && results.length === 0 && (
        <p className="text-center text-muted-foreground">No results found for &quot;{query}&quot;</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {results.map((item) => (
          <MovieCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
          }
