export function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} StreamVibe. Built for educational purposes.
        </p>
        <p className="text-sm text-muted-foreground">
          Data provided by <a href="https://www.themoviedb.org/" target="_blank" className="underline underline-offset-4">TMDB</a>.
        </p>
      </div>
    </footer>
  );
}
