"use client";

import React, { createContext, useContext, useState, ReactNode, useSyncExternalStore } from "react";
import { Joyride, EventData, STATUS, Step, TooltipRenderProps, EVENTS } from "react-joyride";
import Image from "next/image";
import { Zap, BookOpen, type LucideIcon } from "lucide-react";

// ─── Helpers : Navigation et Attente ──────────────────────────────────────────

function waitForElement(selector: string, timeout = 6000): Promise<boolean> {
  if (document.querySelector(selector)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) { observer.disconnect(); resolve(true); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(false); }, timeout);
  });
}

function closeDialog(openFieldSelector: string): Promise<void> {
  if (!document.querySelector(openFieldSelector)) return Promise.resolve();
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  return new Promise(r => setTimeout(r, 400));
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

async function navigateToFirstResource(): Promise<boolean> {
  await closeDialog("#resource-input-label");
  if (document.querySelector("#btn-creer-seance")) return true;
  const firstRow = document.querySelector("#dashboard-resource-table tbody tr.cursor-pointer") as HTMLElement | null;
  if (!firstRow) return false;
  firstRow.click();
  return waitForElement("#btn-creer-seance", 7000);
}

async function openResourceDialog(): Promise<boolean> {
  if (document.querySelector("#resource-input-label")) return true;
  const createResourceButton = document.querySelector("#btn-creer-ressource") as HTMLElement | null;
  if (!createResourceButton) return false;
  createResourceButton.click();
  return waitForElement("#resource-input-label", 7000);
}

async function openSessionDialog(): Promise<boolean> {
  if (document.querySelector("#session-input-label")) return true;
  const createSessionButton = document.querySelector("#btn-creer-seance") as HTMLElement | null;
  if (!createSessionButton) return false;
  createSessionButton.click();
  return waitForElement("#session-input-label", 7000);
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
  {
    target: "#dashboard-resource-table",
    title: "Vos Ressources",
    content: "C'est ici que sont listés tous vos cours. Chaque ligne correspond à une ressource pédagogique.",
    data: { image: "/images/TT5.png" },
    placement: "top",
  },
];

// 1. PARCOURS COURT : Survol rapide
const SHORT_TOUR_STEPS: Step[] = [
  ...COMMON_STEPS,
  {
    target: "#btn-creer-ressource",
    title: "Actions rapides",
    content: "Utilisez ce bouton pour ajouter un nouveau cours. La création est simple et rapide !",
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
    target: "#btn-creer-ressource",
    title: "À vous de jouer ! 🎯",
    content: "Commençons par créer un cours. Je vais ouvrir le formulaire pour vous.",
    data: { image: "/images/TT3.png" },
    placement: "bottom",
  },
  {
    target: "#resource-input-label",
    title: "Nommez votre cours",
    content: "Le formulaire est ouvert : remplissez librement les champs, je vous laisse faire à votre rythme.",
    data: { image: "/images/TT3.png" },
    placement: "bottom",
    targetWaitTimeout: 20000,
    before: async () => {
      await openResourceDialog();
    },
  },
  {
    target: "#resource-submit-btn",
    title: "Validation",
    content: "Quand vous avez terminé, validez pour créer votre cours.",
    data: { image: "/images/TT3.png" },
    placement: "top",
  },
  {
    target: "#dashboard-resource-table",
    title: "Navigation",
    content: "Pour gérer les séances d'un cours, cliquez sur sa ligne dans le tableau. Je vais le faire pour vous pour gagner du temps !",
    data: { image: "/images/TT6.png" },
    placement: "top",
    before: async () => {
      await closeDialog("#resource-input-label");
    },
  },
  {
    target: "#btn-creer-seance",
    title: "Créer une séance",
    content: "Sur cette page, je vais ouvrir le formulaire de séance pour vous.",
    data: { image: "/images/TT4.png" },
    placement: "bottom",
    before: async () => {
      await navigateToFirstResource();
    },
  },
  {
    target: "#session-input-label",
    title: "Fenêtre de séance ouverte",
    content: "La fenêtre est maintenant ouverte au complet. Vérifiez vos informations, puis on valide.",
    data: { image: "/images/TT4.png" },
    placement: "bottom",
    targetWaitTimeout: 15000,
    before: async () => {
      await openSessionDialog();
    },
  },
  {
    target: "#session-submit-btn",
    title: "C'est fini !",
    content: "Quand tout est prêt, validez pour créer la séance.",
    data: { image: "/images/TT4.png" },
    placement: "top",
    before: async () => {
      await openSessionDialog();
    },
  },
  {
    target: "body",
    title: "🎉 Félicitations !",
    content: "Vous avez terminé l'apprentissage complet. Vous êtes maintenant un expert de Soko !",
    data: { image: "/images/TT1.png" },
    placement: "center",
  },
];

// ─── Contexte ─────────────────────────────────────────────────────────────────

interface TutorialContextType {
  startTutorial: () => void;
  nextStep: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) throw new Error("useTutorial must be used within a TutorialProvider");
  return context;
}

// ─── Tooltip personnalisé ─────────────────────────────────────────────────────

function CustomTooltip({
  step,
  closeProps,
  tooltipProps,
  isLastStep,
  index,
  size,
}: TooltipRenderProps) {
  const { nextStep } = useTutorial();
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
        <button {...closeProps} onClick={(e) => { e.stopPropagation(); closeProps.onClick(e); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#999", padding: "4px 6px" }}>Passer</button>
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

  const startTutorial = () => {
    setStepIndex(0);
    setShowWelcome(true);
  };

  const nextStep = () => {
    setStepIndex((prev) => prev + 1);
  };

  const handleJoyrideCallback = (data: EventData) => {
    const { status, type } = data;
    if (type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex((prev) => prev + 1);
    }
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      setStepIndex(0);
    }
  };

  const handleSelectTour = (type: 'short' | 'long') => {
    setCurrentSteps(type === 'short' ? SHORT_TOUR_STEPS : LONG_TOUR_STEPS);
    setShowWelcome(false);
    setRun(true);
  };

  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <TutorialContext.Provider value={{ startTutorial, nextStep }}>
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

              <button onClick={() => setShowWelcome(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#999" }}>Plus tard</button>
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
          styles={{
            overlay: { backgroundColor: "rgba(23, 23, 23, 0.82)" }
          }}
          options={{
            zIndex: 10000,
            overlayClickAction: "close",
            dismissKeyAction: "next",
            blockTargetInteraction: false
          }}
        />
      )}
    </TutorialContext.Provider>
  );
}
