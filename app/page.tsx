import { Button } from "@/components/ui/button";


export default function MainPage() {
  return (
    <main className="h-screen w-screen flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Bienvenue sur la page d'accueil !</h1>
      <div className="w-full flex items-center justify-center">
        <Button
          variant="default"
          size="default"

        >
          Je suis un paragraphe
        </Button>
      </div>
    </main>
  )
}