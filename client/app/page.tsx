import { GameControls } from "@/components/ui/gameControls";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";

export default function Home() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center-safe gap-6 px-4 py-8">
      <Link
        href="https://github.com/ppriyankuu/YOUR_REPO"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-6 right-6 text-base-content/60 hover:text-purple-400 transition-colors"
      >
        <FaGithub size={22} />
      </Link>

      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
          Chess with Dempho.
        </h1>
        <p className="text-base md:text-lg text-base-content/70 max-w-md mx-auto">
          Create a game, share the Game ID with a friend, and play in real time. No sign-up, no setup — just start playing.
        </p>
      </div>

      {/* Controls */}
      <GameControls />

      {/* Funny Free-Tier Note */}
      <div className="mt-4 p-3 rounded-box bg-base-200/50 border border-base-content/10 max-w-sm text-center">
        <p className="text-xs text-base-content/60">
          <span className="font-semibold text-purple-400">Heads up! </span>
          The server is on a free plan and sometimes takes a nap 😴 <br />
          If nothing happens, wait about 60~90 seconds. <br />
          It will wake up and we can play! ♟️
        </p>
      </div>

    </main>
  );
}