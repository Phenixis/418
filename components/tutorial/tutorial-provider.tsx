"use client";

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useSyncExternalStore } from "react";
import { Joyride, EventData, STATUS, Step, TooltipRenderProps, EVENTS, type BeaconRenderProps } from "react-joyride";
import Image from "next/image";
import { Zap, BookOpen, type LucideIcon } from "lucide-react";

// ─── Helpers : Navigation et Attente ──────────────────────────────────────────

function getVisibleElement(selector: string): HTMLElement | null {
  const elements = document.querySelectorAll(selector);
  return Array.from(elements).find((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && (el as HTMLElement).offsetWidth > 0;
  }) as HTMLElement | null;
}

function waitForElement(selector: string, timeout = 6000): Promise<boolean> {
  if (getVisibleElement(selector)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (getVisibleElement(selector)) { observer.disconnect(); resolve(true); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(false); }, timeout);
  });
}

function closeDialog(openFieldSelector: string): Promise<void> {
  if (!getVisibleElement(openFieldSelector)) return Promise.resolve();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  return new Promise(r => setTimeout(r, 400));
}

// Simule un vrai clic avec la séquence complète d'événements pointeur
// nécessaire pour déclencher les composants Radix UI (qui écoutent pointerdown)
function simulateRadixClick(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const init: PointerEventInit = { bubbles: true, cancelable: true, isPrimary: true, clientX: cx, clientY: cy };
  element.dispatchEvent(new PointerEvent('pointerover',  { ...init }));
  element.dispatchEvent(new PointerEvent('pointerenter', { ...init, bubbles: false }));
  element.dispatchEvent(new MouseEvent('mouseover',   { bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
  element.dispatchEvent(new PointerEvent('pointermove', { ...init }));
  element.dispatchEvent(new MouseEvent('mousemove',   { bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
  element.dispatchEvent(new PointerEvent('pointerdown', { ...init }));
  element.dispatchEvent(new MouseEvent('mousedown',   { bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
  element.focus?.();
  element.dispatchEvent(new PointerEvent('pointerup',   { ...init }));
  element.dispatchEvent(new MouseEvent('mouseup',     { bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
  element.dispatchEvent(new MouseEvent('click',       { bubbles: true, cancelable: true, clientX: cx, clientY: cy }));
}

interface CardChoiceProps {
  title: string;
  desc: string;
  icon: LucideIcon;
  onClick: () => void;
  color: string;
}

function CardChoice({ title, desc, icon: Icon, onClick, color }: CardChoiceProps) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "20px", borderRadius: "16px", border: "2px solid #e8e4de",
        background: "#ffffff", textAlign: "left", cursor: "pointer", transition: "all 0.2s ease",
        display: "flex", flexDirection: "column", gap: "10px", position: "relative", overflow: "hidden"
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e8e4de"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ background: color + "20", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: color }}>
        <Icon size={24} />
      </div>
      <div>
        <h3 style={{ fontWeight: 800, fontSize: "16px", margin: "0 0 4px", color: "#171717" }}>{title}</h3>
        <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.5, margin: 0 }}>{desc}</p>
      </div>
      <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.1, color: color }}>
        <Icon size={64} />
      </div>
    </button>
  );
}

async function openResourceDialog(): Promise<boolean> {
  if (getVisibleElement(".resource-input-label")) return true;
  const createResourceButton = getVisibleElement(".btn-creer-ressource");
  if (!createResourceButton) return false;
  createResourceButton.click();
  return waitForElement(".resource-input-label", 7000);
}

async function openResourceKebabMenu(): Promise<boolean> {
  await closeDialog(".resource-input-label");
  // Si le menu est déjà ouvert (menu item visible)
  if (getVisibleElement(".menu-item-creer-seance")) return true;
  const kebabBtn = getVisibleElement(".resource-kebab-btn");
  if (!kebabBtn) return false;
  // Radix UI écoute pointerdown → simuler la séquence complète
  simulateRadixClick(kebabBtn);
  // Délai pour laisser Radix UI animer l'ouverture du menu
  await new Promise(r => setTimeout(r, 400));
  return waitForElement(".menu-item-creer-seance", 4000);
}

async function openSessionDialogFromMenu(): Promise<boolean> {
  if (getVisibleElement("#session-input-label")) return true;
  // Toujours ouvrir le menu d'abord (il peut se fermer entre les étapes)
  const opened = await openResourceKebabMenu();
  if (!opened) return false;
  // Délai pour que le menu item soit interactif
  await new Promise(r => setTimeout(r, 200));
  const menuItem = getVisibleElement(".menu-item-creer-seance");
  if (!menuItem) return false;
  // Simuler le clic avec la séquence complète
  simulateRadixClick(menuItem);
  return waitForElement("#session-input-label", 7000);
}


function getDynamicSteps(steps: Step[]): Step[] {
  const visibleTrigger = getVisibleElement(".btn-creer-ressource");
  const isDesktop = visibleTrigger?.id?.includes("desktop");
  const suffix = isDesktop ? "desktop" : "mobile";

  return steps.map(step => {
    let newTarget = step.target;
    if (typeof newTarget === "string" && newTarget === ".btn-creer-ressource") {
      newTarget = `#btn-creer-ressource-${suffix}`;
    }
    return { ...step, target: newTarget };
  });
}

// ─── Étapes des parcours ──────────────────────────────────────────────────────

// BASE : Étapes communes (Navigation et Dashboard)
const COMMON_STEPS: Step[] = [
  {
    target: "#nav-logo",
    title: "Le logo Soko",
    content: "Ce bouton vous permet de revenir instantanément à votre tableau de bord, peu importe où vous êtes.",
    data: { image: "/images/TT1.png" },
    placement: "bottom",
  },
  {
    target: "#nav-links",
    title: "La navigation",
    content: "Accédez rapidement à vos cours ou au trombinoscope de vos étudiants ici.",
    data: { image: "/images/TT2.png" },
    placement: "bottom",
  },
  

];

// 1. PARCOURS COURT : Survol rapide
const SHORT_TOUR_STEPS: Step[] = [
  ...COMMON_STEPS,
  {
    target: ".btn-creer-ressource",
    title: "Actions rapides",
    content: "Utilisez ce bouton pour ajouter une nouvelle ressource. La création est simple et rapide !",
    data: { image: "/images/TT3.png" },
    placement: "bottom",
  },
  {
    target: "body",
    title: "🎉 Prêt à explorer !",
    content: "C'est tout pour le tour d'horizon rapide. Vous pouvez maintenant gérer vos cours en toute liberté.",
    data: { image: "/images/TT1.png" },
    placement: "center",
  },
];

// 2. PARCOURS LONG : Guide pratique pas-à-pas (Manuel)
const LONG_TOUR_STEPS: Step[] = [
  ...COMMON_STEPS,
  {
    target: ".btn-creer-ressource",
    title: "À vous de jouer !",
    content: "Commençons par créer une ressource. Je vais ouvrir le formulaire pour vous.",
    data: { image: "/images/TT3.png" },
    placement: "bottom",
  },
  {
    target: ".resource-input-label",
    title: "Nommez votre ressource",
    content: "Le formulaire est ouvert : remplissez librement les champs, je vous laisse faire à votre rythme.",
    data: { image: "/images/TT3.png" },
    placement: "bottom",
    targetWaitTimeout: 20000,
    before: async () => {
      await openResourceDialog();
    },
  },
  {
    target: ".resource-submit-btn",
    title: "Validation",
    content: "Quand vous avez terminé, validez pour créer votre ressource.",
    data: { image: "/images/TT3.png" },
    placement: "top",
  },
  {
    target: "#dashboard-resource-table",
    title: "Le tableau de ressources",
    content: "Vos ressources apparaissent ici. Pour créer une séance, cliquez sur les 3 petits points à droite d'une ressource.",
    data: { image: "/images/TT6.png" },
    placement: "top",
    before: async () => {
      await closeDialog(".resource-input-label");
    },
  },
  {
    target: ".resource-kebab-btn",
    title: "Le menu d'actions",
    content: "Cliquez sur les 3 petits points pour voir les actions disponibles pour cette ressource.",
    data: { image: "/images/TT4.png" },
    placement: "left",
    before: async () => {
      await closeDialog(".resource-input-label");
    },
  },
  {
    target: ".menu-item-creer-seance",
    title: "Créer une séance",
    content: "Cliquez sur \"Créer une séance\" pour ouvrir le formulaire. Je vais le faire pour vous !",
    data: { image: "/images/TT4.png" },
    placement: "left",
    targetWaitTimeout: 5000,
    before: async () => {
      await openResourceKebabMenu();
    },
  },
  {
    target: "[role='dialog']",
    title: "Fenêtre de séance ouverte",
    content: "La fenêtre est maintenant ouverte. Remplissez les informations de votre séance.",
    data: { image: "/images/TT4.png" },
    placement: "left",
    targetWaitTimeout: 15000,
    before: async () => {
      await openSessionDialogFromMenu();
    },
  },
  {
    target: "#session-submit-btn",
    title: "C'est fini !",
    content: "Quand tout est prêt, validez pour créer la séance.",
    data: { image: "/images/TT4.png" },
    placement: "top",
    before: async () => {
      await openSessionDialogFromMenu();
    },
  },
  {
    target: "body",
    title: "Félicitations !",
    content: "Vous avez terminé l'apprentissage complet. Vous êtes maintenant un expert de Soko !",
    data: { image: "/images/TT1.png" },
    placement: "center",
  },
];

// ─── Contexte ─────────────────────────────────────────────────────────────────

export interface TutorialContextType {
  startTutorial: () => void;
  nextStep: () => void;
  stopTutorial: () => void;
  hasCompletedTutorial: boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) throw new Error("useTutorial must be used within a TutorialProvider");
  return context;
}

function AnimatedTutorialBeacon({ index, size }: BeaconRenderProps) {
  return (
    <span
      aria-label={`Étape ${index + 1} sur ${size}`}
      style={{
        width: "74px",
        height: "74px",
        borderRadius: "999px",
        border: "3px solid #ffffff",
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 14px 34px rgba(0,0,0,0.36), 0 0 0 6px rgba(202,159,255,0.35)",
        padding: "4px",
        position: "relative",
        cursor: "pointer",
        display: "inline-block",
        animation: "tutorial-beacon-float 2.2s ease-in-out infinite",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: "-10px",
          borderRadius: "999px",
          border: "3px solid rgba(202,159,255,0.65)",
          animation: "tutorial-beacon-pulse 1.2s ease-out infinite",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: "-18px",
          borderRadius: "999px",
          background: "radial-gradient(circle, rgba(202,159,255,0.25) 0%, rgba(202,159,255,0) 70%)",
          animation: "tutorial-beacon-pulse 1.6s ease-out infinite",
        }}
      />
      <span style={{ position: "relative", display: "block", width: "100%", height: "100%" }}>
        <Image src="/images/TT2.png" alt="Beacon tutoriel" fill style={{ objectFit: "contain" }} />
      </span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          bottom: "-20px",
          transform: "translateX(-50%)",
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "0.08em",
          color: "#ffffff",
          background: "#171717",
          border: "1px solid rgba(255,255,255,0.5)",
          borderRadius: "999px",
          padding: "2px 8px",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
        }}
      >
        GUIDE
      </span>
    </span>
  );
}

// ─── Tooltip personnalisé ─────────────────────────────────────────────────────

function CustomTooltip({
  step,
  tooltipProps,
  isLastStep,
  index,
  size,
}: TooltipRenderProps) {
  const { nextStep, stopTutorial } = useTutorial();
  const imageUrl = step.data?.image || "/images/TT1.png";
  const isCentered = step.placement === "center";

  const contentUI = (
    <div style={{ position: "relative", zIndex: 1 }}>
      <div style={{ display: "flex", gap: "5px", marginBottom: "12px" }}>
        {Array.from({ length: size }).map((_, i) => (
          <div key={i} style={{ height: "4px", flex: 1, borderRadius: "999px", background: i <= index ? "#ca9fff" : "#e0dbd4", transition: "background 0.3s ease" }} />
        ))}
      </div>
      {step.title && <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#171717", margin: "0 0 8px" }}>{step.title}</h3>}
      <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6, margin: "0 0 16px" }}>{step.content as string}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
        <button onClick={(e) => { e.stopPropagation(); stopTutorial(); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#999", padding: "4px 6px" }}>Passer</button>
        <button
          style={{ background: "#ca9fff", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, color: "#171717", padding: "10px 24px", borderRadius: "999px", boxShadow: "0 4px 8px rgba(202,159,255,0.4)" }}
          onClick={(e) => { e.stopPropagation(); nextStep(); }}
        >
          {isLastStep ? "Compris ! ✨" : "Suivant →"}
        </button>
      </div>
    </div>
  );

  return (
    <div {...tooltipProps} style={{
      display: "flex", flexDirection: isCentered ? "column" : "row",
      alignItems: isCentered ? "center" : "flex-end", gap: "12px",
      maxWidth: isCentered ? "360px" : "420px", width: "90vw"
    }}>
      <div style={{
        position: "relative", width: isCentered ? "220px" : "180px", height: isCentered ? "220px" : "180px",
        flexShrink: 0, filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))", zIndex: 2,
        marginBottom: isCentered ? "-34px" : "0"
      }}>
        <Image src={imageUrl} alt="Totoro Guide" fill style={{ objectFit: "contain" }} />
      </div>
      <div style={{
        position: "relative", flex: 1, background: "#ffffff",
        borderRadius: isCentered ? "20px" : "20px 20px 20px 4px",
        padding: isCentered ? "32px 28px 24px" : "20px 22px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)", border: "2px solid #e8e4de",
        textAlign: isCentered ? "center" : "left"
      }}>
        <div style={{
          position: "absolute",
          [isCentered ? "top" : "left"]: "-9px",
          [isCentered ? "left" : "bottom"]: isCentered ? "50%" : "22px",
          transform: isCentered ? "translateX(-50%) rotate(45deg)" : "rotate(45deg)",
          width: "16px", height: "16px", background: "#ffffff",
          borderLeft: "2px solid #e8e4de",
          borderTop: isCentered ? "2px solid #e8e4de" : "none",
          borderBottom: isCentered ? "none" : "2px solid #e8e4de",
          borderRadius: "2px"
        }} />
        {contentUI}
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [currentSteps, setCurrentSteps] = useState<Step[]>(SHORT_TOUR_STEPS);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);
  const [shouldStartTour, setShouldStartTour] = useState(false);
  const stepAdvanceTimeoutRef = useRef<number | null>(null);

  const markTutorialAsCompleted = async () => {
    try {
      const response = await fetch('/api/teacher/tutorial/complete', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to complete tutorial status update.');
      }
    } catch (error) {
      console.error('Unable to update teacher first connection status:', error);
    }
  };

  const startTutorial = () => {
    setStepIndex(0);
    setShowWelcome(true);
  };

  const nextStep = () => {
    setStepIndex((prev) => prev + 1);
  };

  const stopTutorial = () => {
    setRun(false);
    setStepIndex(0);
    setShowWelcome(false);
  };

  const handleJoyrideCallback = (data: EventData) => {
    const { status, type } = data;
    if (type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex((prev) => prev + 1);
    }
    if (status === STATUS.FINISHED) {
      setHasCompletedTutorial(true);
      void markTutorialAsCompleted();
      stopTutorial();
      return;
    }

    if (status === STATUS.SKIPPED) {
      stopTutorial();
    }
  };

  const handleSelectTour = (type: 'short' | 'long') => {
    const baseSteps = type === 'short' ? SHORT_TOUR_STEPS : LONG_TOUR_STEPS;
    setRun(false);
    setCurrentSteps(getDynamicSteps(baseSteps));
    setStepIndex(0);
    setShowWelcome(false);
    setShouldStartTour(true);
  };

  useEffect(() => {
    if (!shouldStartTour) {
      return;
    }

    setRun(true);
    setShouldStartTour(false);
  }, [currentSteps, shouldStartTour]);

  useEffect(() => {
    if (!run) {
      return;
    }

    const scheduleStepAdvance = (delayMs: number) => {
      const expectedStepIndex = stepIndex;

      if (stepAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(stepAdvanceTimeoutRef.current);
      }

      stepAdvanceTimeoutRef.current = window.setTimeout(() => {
        setStepIndex((previousStepIndex) =>
          previousStepIndex === expectedStepIndex ? previousStepIndex + 1 : previousStepIndex,
        );
        stepAdvanceTimeoutRef.current = null;
      }, delayMs);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const clickedElement = event.target instanceof Element ? event.target : null;
      if (!clickedElement) {
        return;
      }

      const activeStep = currentSteps[stepIndex];
      const activeTarget = typeof activeStep?.target === "string" ? activeStep.target : "";

      const hasClickedCreateResourceButton =
        clickedElement.closest(".btn-creer-ressource, [id^='btn-creer-ressource-']") !== null;
      const hasClickedKebabButton = clickedElement.closest(".resource-kebab-btn") !== null;
      const hasClickedCreateSessionMenuItem = clickedElement.closest(".menu-item-creer-seance") !== null;
      const hasClickedResourceSubmitButton =
        clickedElement.closest(".resource-submit-btn, [id^='resource-submit-btn-']") !== null;
      const hasClickedSessionSubmitButton = clickedElement.closest("#session-submit-btn") !== null;

      const isCreateResourceStep =
        activeTarget === ".btn-creer-ressource" || activeTarget.startsWith("#btn-creer-ressource-");
      const isKebabStep = activeTarget === ".resource-kebab-btn";
      const isCreateSessionMenuStep = activeTarget === ".menu-item-creer-seance";
      const isResourceSubmitStep =
        activeTarget === ".resource-submit-btn" || activeTarget.startsWith("#resource-submit-btn-");
      const isSessionSubmitStep = activeTarget === "#session-submit-btn";

      if (isKebabStep && hasClickedKebabButton) {
        scheduleStepAdvance(500);
        return;
      }

      if (isCreateSessionMenuStep && hasClickedCreateSessionMenuItem) {
        scheduleStepAdvance(3000);
        return;
      }

      if (
        (isCreateResourceStep && hasClickedCreateResourceButton) ||
        (isResourceSubmitStep && hasClickedResourceSubmitButton) ||
        (isSessionSubmitStep && hasClickedSessionSubmitButton)
      ) {
        scheduleStepAdvance(3000);
      }
    };

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
      if (stepAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(stepAdvanceTimeoutRef.current);
        stepAdvanceTimeoutRef.current = null;
      }
    };
  }, [run, stepIndex, currentSteps]);

  const mounted = useSyncExternalStore(
    () => () => { },
    () => true,
    () => false,
  );

  return (
    <TutorialContext.Provider value={{ startTutorial, nextStep, stopTutorial, hasCompletedTutorial }}>
      {children}
      {mounted && showWelcome && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setShowWelcome(false)} style={{ position: "absolute", inset: 0, background: "rgba(23, 23, 23, 0.82)", backdropFilter: "blur(6px)" }} />
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "460px", width: "94vw" }}>
            <Image src="/images/TT3.png" alt="Totoro" width={280} height={280} style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))", zIndex: 2, marginBottom: "-46px" }} />
            <div style={{ background: "#ffffff", borderRadius: "24px", padding: "42px 24px 24px", border: "2px solid #e8e4de", textAlign: "center", width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
              <h2 style={{ fontWeight: 800, fontSize: "24px", margin: "0 0 8px", color: "#171717" }}>Bienvenue sur Soko !</h2>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, margin: "0 0 24px" }}>
                Quel type de visite souhaitez-vous effectuer aujourd’hui ?
              </p>

              <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
                <CardChoice
                  title="Découverte"
                  desc="Tour rapide des fonctionnalités clés (1 min)."
                  icon={Zap}
                  color="#3b82f6"
                  onClick={() => handleSelectTour('short')}
                />
                <CardChoice
                  title="Pratique"
                  desc="Créez vos premiers contenus pas-à-pas (5 min)."
                  icon={BookOpen}
                  color="#ca9fff"
                  onClick={() => handleSelectTour('long')}
                />
              </div>

            </div>
          </div>
        </div>
      )}
      {mounted && (
        <Joyride
          steps={currentSteps}
          run={run}
          stepIndex={stepIndex}
          continuous={true}
          scrollToFirstStep={true}
          onEvent={handleJoyrideCallback}
          tooltipComponent={CustomTooltip}
          beaconComponent={AnimatedTutorialBeacon}
          styles={{
            overlay: { backgroundColor: "rgba(23, 23, 23, 0.82)" },
            beacon: {
              width: "74px",
              height: "74px",
              borderRadius: "999px",
            },
            beaconInner: {
              backgroundColor: "rgba(115, 115, 115, 0.9)",
            },
            beaconOuter: {
              backgroundColor: "rgba(163, 163, 163, 0.35)",
              border: "2px solid rgba(115, 115, 115, 0.9)",
            },
          }}
          options={{
            zIndex: 10000,
            overlayClickAction: false,
            dismissKeyAction: "next",
            blockTargetInteraction: false
          }}
        />
      )}
      <style jsx global>{`
        @keyframes tutorial-beacon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes tutorial-beacon-pulse {
          0% { transform: scale(0.88); opacity: 0.95; }
          70% { transform: scale(1.45); opacity: 0; }
          100% { transform: scale(1.45); opacity: 0; }
        }
      `}</style>
    </TutorialContext.Provider>
  );
}
