import { Library } from "@/components/library";
import { CursorTrail } from "@/components/cursor-trail";
import { CelestialBackground } from "@/components/celestial-background";
import { getSavedLibraryData } from "@/lib/supabase/saves";

export default async function Home() {
  const libraryData = await getSavedLibraryData();

  return (
    <>
      <a className="skip-link" href="#library">Skip to library</a>
      <CelestialBackground />
      <CursorTrail />
      <div className="site-shell">
        <main id="main-content">
          <Library {...libraryData} />
        </main>
      </div>
    </>
  );
}
