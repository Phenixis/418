"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Joyride, EventData, STATUS, Step, TooltipRenderProps, ACTIONS, EVENTS } from "react-joyride";
import Image from "next/image";
import { X } from "lucide-react";

// ─── Helpers : simulation des actions utilisateur ─────────────────────────────

function waitForElement(selector: string, timeout = 6000): Promise<boolean> {
  if (document.querySelector(selector)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(true);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { observer.disconnect(); resolve(false); }, timeout);
  });
}

async function typeInReactInput(selector: string, text: string): Promise<void> {
  const input = document.querySelector(selector) as HTMLInputElement | null;
  if (!input) return;

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;

  if (!nativeInputValueSetter) return;

  input.focus();
  let currentText = "";
  for (const char of text) {
    currentText += char;
    nativeInputValueSetter.call(input, currentText);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await new Promise(r => setTimeout(r, 50));
  }
}

function clickEl(selector: string): boolean {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (el) { el.click(); return true; }
  return false;
}

async function openDialog(triggerSelector: string, dialogFieldSelector: string): Promise<void> {
  if (document.querySelector(dialogFieldSelector)) return; 
  clickEl(triggerSelector);
  await waitForElement(dialogFieldSelector, 4000);
  await new Promise(r => setTimeout(r, 400));
}

async function closeDialog(openFieldSelector: string): Promise<void> {
  if (!document.querySelector(openFieldSelector)) return;
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }));
  await new Promise(r => setTimeout(r, 400));
}

async function navigateToFirstResource(): Promise<boolean> {
  await closeDialog("#resource-input-label");
  if (document.querySelector("#btn-creer-seance")) return true;

  const firstRow = document.querySelector(
    "#dashboard-resource-table tbody tr.cursor-pointer"
  ) as HTMLElement | null;

  if (!firstRow) return false;
  firstRow.click();
  return waitForElement("#btn-creer-seance", 7000);
}

// ─── Étapes du tutoriel ────────────────────────────────────────────────────────

const TUTORIAL_STEPS: Step[] = [
  {
    target: "body",
    title: "On s'occupe de tout ! 👋",
    content: "Je vais simuler les clics et la saisie pour vous montrer exactement comment utiliser l'application. Regardez bien !",
    data: { image: "/images/TT1.png" },
    placement: "center",
  },
  {
    target: "#nav-logo",
    title: "Le logo",
    content: "Pour revenir à l'accueil à tout moment.",
    data: { image: "/images/TT1.png" },
    placement: "bottom",
  },
  {
    target: "#dashboard-resource-table",
    title: "Vos Ressources",
    content: "Voici les cours dont vous êtes responsable.",
    data: { image: "/images/TT5.png" },
    placement: "top",
  },
  {
    target: "#btn-creer-ressource",
    title: "Simulation : Création",
    content: "Je vais cliquer sur Créer pour vous et remplir le formulaire !",
    data: { image: "/images/TT3.png" },
    placement: "bottom",
  },
  {
    target: "#resource-input-label",
    title: "Saisie automatique",
    content: "Regardez, je saisis le nom de la ressource...",
    data: { image: "/images/TT3.png" },
    placement: "bottom",
    before: async () => {
      await openDialog("#btn-creer-ressource", "#resource-input-label");
      await new Promise(r => setTimeout(r, 300));
      await typeInReactInput("#resource-input-label", "TEST_tutoro");
    },
  },
  {
    target: "#resource-submit-btn",
    title: "Validation",
    content: "Appuyez sur Suivant et je validerai le formulaire pour vous !",
    data: { image: "/images/TT3.png", isSubmitStep: true },
    placement: "top",
  },
  {
    target: "#dashboard-resource-table",
    title: "Navigation automatique",
    content: "Maintenant, je vais entrer dans une ressource pour gérer les séances.",
    data: { image: "/images/TT6.png" },
    placement: "top",
    before: async () => {
      await closeDialog("#resource-input-label");
    },
  },
  {
    target: "#btn-creer-seance",
    title: "Gestion des séances",
    content: "Nous sommes sur la page ressource. Je vais ouvrir la création de séance.",
    data: { image: "/images/TT4.png" },
    placement: "bottom",
    before: async () => {
      await navigateToFirstResource();
    },
  },
  {
    target: "#session-input-label",
    title: "Simulation : Séance",
    content: "Je remplis les détails de la séance...",
    data: { image: "/images/TT4.png" },
    placement: "bottom",
    before: async () => {
      await openDialog("#btn-creer-seance", "#session-input-label");
      await new Promise(r => setTimeout(r, 300));
      await typeInReactInput("#session-input-label", "Introduction aux tableaux");
    },
  },
  {
    target: "#session-submit-btn",
    title: "Dernière étape",
    content: "Il suffit de choisir les groupes et de valider. Cliquez sur Suivant pour finir la démonstration !",
    data: { image: "/images/TT4.png", isSubmitStep: true },
    placement: "top",
  },
  {
    target: "body",
    title: "🎉 Démo terminée !",
    content: "Vous savez tout ! Vous pouvez maintenant gérer vos ressources en toute autonomie.",
    data: { image: "/images/TT1.png" },
    placement: "center",
    before: async () => {
      await closeDialog("#session-input-label");
    }
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
  primaryProps,
  tooltipProps,
  isLastStep,
  index,
  size,
}: TooltipRenderProps) {
  const { nextStep } = useTutorial();
  const imageUrl = step.data?.image || "/images/TT1.png";
  const isCentered = step.placement === "center";

  const handleNext = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (step.data?.isSubmitStep) {
        const submitBtn = document.querySelector(step.target as string) as HTMLElement;
        if (submitBtn) {
            submitBtn.click();
            await new Promise(r => setTimeout(r, 200));
        }
    }
    nextStep();
  };

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
            onClick={handleNext}
        >
            {isLastStep ? "Compris ! ✨" : "Suivant →"}
        </button>
        </div>
    </div>
  );

  return (
    <div {...tooltipProps} style={{ 
        display: "flex", 
        flexDirection: isCentered ? "column" : "row",
        alignItems: isCentered ? "center" : "flex-end", 
        gap: "12px", 
        maxWidth: isCentered ? "360px" : "420px", 
        width: "90vw" 
    }}>
      <div style={{ 
          position: "relative", 
          width: isCentered ? "130px" : "110px", 
          height: isCentered ? "130px" : "110px", 
          flexShrink: 0, 
          filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.4))", 
          zIndex: 2,
          marginBottom: isCentered ? "-24px" : "0"
      }}>
        <Image src={imageUrl} alt="Totoro Guide" fill style={{ objectFit: "contain" }} />
      </div>
      <div style={{ 
          position: "relative", 
          flex: 1, 
          background: "#ffffff", 
          borderRadius: isCentered ? "20px" : "20px 20px 20px 4px", 
          padding: isCentered ? "32px 28px 24px" : "20px 22px", 
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)", 
          border: "2px solid #e8e4de",
          textAlign: isCentered ? "center" : "left"
      }}>
        <div style={{ 
            position: "absolute", 
            [isCentered ? "top" : "left"]: "-9px", 
            [isCentered ? "left" : "bottom"]: isCentered ? "50%" : "22px",
            transform: isCentered ? "translateX(-50%) rotate(45deg)" : "rotate(45deg)", 
            width: "16px", 
            height: "16px", 
            background: "#ffffff", 
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

  const startTutorial = () => {
    setStepIndex(0);
    setShowWelcome(true);
  };

  const nextStep = () => {
    setStepIndex((prev) => prev + 1);
  };

  const handleJoyrideCallback = (data: EventData) => {
    const { status, type, action } = data;
    
    // CAS CRITIQUE : Si la cible disparaît car la fenêtre s'est fermée via l'interface
    if (type === EVENTS.TARGET_NOT_FOUND) {
        setStepIndex((prev) => prev + 1);
    }

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      setStepIndex(0);
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
        if (action === ACTIONS.NEXT) {
            // Dans le mode contrôlé, react-joyride s'appuie sur stepIndex
        }
    }
  };

  const handleStart = () => { setShowWelcome(false); setRun(true); };
  const handleSkip  = () => setShowWelcome(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <TutorialContext.Provider value={{ startTutorial, nextStep }}>
      {children}
      {mounted && showWelcome && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div onClick={handleSkip} style={{ position: "absolute", inset: 0, background: "rgba(23, 23, 23, 0.82)", backdropFilter: "blur(6px)" }} />
            <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "380px", width: "90vw" }}>
                <Image src="/images/TT3.png" alt="Totoro" width={160} height={160} style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.5))", zIndex: 2, marginBottom: "-28px" }} />
                <div style={{ background: "#ffffff", borderRadius: "24px", padding: "42px 32px 30px", border: "2px solid #e8e4de", textAlign: "center", width: "100%" }}>
                    <h2 style={{ fontWeight: 800, fontSize: "22px", margin: "0 0 10px" }}>Démo Interactive ! 👋</h2>
                    <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, margin: "0 0 24px" }}>
                        Laissez-moi vous montrer le fonctionnement de **Soko** en simulant les actions réelles d&apos;un professeur.
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                        <button onClick={handleSkip} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#999" }}>Plus tard</button>
                        <button onClick={handleStart} style={{ background: "#ca9fff", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: 700, color: "#171717", padding: "11px 28px", borderRadius: "999px", boxShadow: "0 4px 16px rgba(202,159,255,0.5)" }}>Lancer la démo ✨</button>
                    </div>
                </div>
            </div>
        </div>
      )}
      {mounted && (
        <Joyride
          steps={TUTORIAL_STEPS}
          run={run}
          stepIndex={stepIndex}
          continuous={true}
          scrollToFirstStep={true}
          onEvent={handleJoyrideCallback}
          tooltipComponent={CustomTooltip}
          styles={{ overlay: { backgroundColor: "rgba(23, 23, 23, 0.82)" } }}
          options={{ zIndex: 10000 }}
        />
      )}
    </TutorialContext.Provider>
  );
}
