"use client";

import { useTutorial } from "@/components/tutorial/tutorial-provider";
import Image from "next/image";

export function TutorialTrigger({ className }: { className?: string }) {
  const { startTutorial } = useTutorial();

  return (
    <button
      className={`fixed bottom-8 right-8 z-[100] group transition-all duration-300 hover:scale-110 active:scale-95 ${className}`}
      onClick={startTutorial}
      title="Lancer le tutoriel"
      style={{ 
        background: "none", 
        border: "none", 
        padding: 0, 
        cursor: "pointer",
        animation: "float 3s ease-in-out infinite"
      }}
    >
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
      <div className="relative w-24 h-24 drop-shadow-lg group-hover:drop-shadow-2xl transition-all">
        <Image 
          src="/images/TT2.png" 
          alt="Totoro Guide" 
          fill 
          style={{ objectFit: "contain" }}
        />
        <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          HELP
        </div>
      </div>
      <span className="sr-only">Lancer le tutoriel</span>
    </button>
  );
}
