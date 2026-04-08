"use client";

import { useTutorial } from "@/components/tutorial/tutorial-provider";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react"; // Utilise lucide-react pour l'icône, ou @mui/icons-material selon vos préférences

export function TutorialTrigger({ className }: { className?: string }) {
  const { startTutorial } = useTutorial();

  return (
    <Button
      variant="outline"
      size="icon"
      className={`rounded-full ${className}`}
      onClick={startTutorial}
      title="Lancer le tutoriel"
    >
      <HelpCircle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
      <span className="sr-only">Lancer le tutoriel</span>
    </Button>
  );
}
