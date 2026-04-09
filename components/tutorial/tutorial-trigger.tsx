"use client";

import { useTutorial } from "@/components/tutorial/tutorial-provider";
import Image from "next/image";

export function TutorialTrigger({
  className,
  isCompleted = false,
}: {
  className?: string;
  isCompleted?: boolean;
}) {
  const { startTutorial } = useTutorial();
  const tutorialTitle = isCompleted
    ? "Tutoriel déjà effectué (vous pouvez le relancer)"
    : "Lancer le tutoriel";

  return (
    <button
      className={`fixed bottom-8 right-8 z-100 group transition-all duration-300 hover:scale-110 active:scale-95 ${isCompleted ? "ring-4 ring-primary shadow-lg" : ""} ${className}`}
      onClick={startTutorial}
      title={tutorialTitle}
      style={{ 
      background: "white", 
      border: "1px solid #ccc", 
      borderRadius: "50%",
      padding: 0, 
      cursor: "pointer",
      width: "80px",
      height: "80px",
      animation: "float 3s ease-in-out infinite"
      }}
    >
      <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-5px); }
      }
      `}</style>
      <div className="relative w-20 h-20 drop-shadow-lg group-hover:drop-shadow-2xl transition-all">
      <Image 
        src="/images/TT2.png" 
        alt="Totoro Guide" 
        fill 
        style={{ objectFit: "contain" }}
      />
      {isCompleted && (
        <div className="absolute -top-2 -right-2 bg-primary text-black text-[10px] font-bold h-7 px-2 rounded-full border-2 border-white shadow-sm flex items-center justify-center gap-1">
          <span aria-hidden>✓</span>
          <span>FAIT</span>
        </div>
      )}
      <div className="absolute top-2 right-2 bg-primary text-black text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
        HELP
      </div>
      </div>
      <span className="sr-only">{tutorialTitle}</span>
    </button>
  );
}
