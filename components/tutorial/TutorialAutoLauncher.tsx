"use client";

import { useEffect, useRef } from "react";
import { useTeacher } from "@/lib/hooks/useTeacher";
import { useTutorial } from "@/components/tutorial/tutorial-provider";
import { TutorialTrigger } from "@/components/tutorial/tutorial-trigger";

export function TutorialAutoLauncher({ className }: { className?: string }) {
  const { teacher } = useTeacher();
  const { startTutorial, hasCompletedTutorial } = useTutorial();
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (hasAutoStarted.current) return;
    if (teacher.isFirstConnection === false) {
      hasAutoStarted.current = true;
      startTutorial();
    }
  }, [teacher.isFirstConnection, startTutorial]);

  return (
    <TutorialTrigger
      className={className}
      isCompleted={teacher.isFirstConnection === true || hasCompletedTutorial}
    />
  );
}