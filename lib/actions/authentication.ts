import { ActionResult } from "./types";

export async function login(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const email = formData.get("email")
    const password = formData.get("password")
    const remember = formData.get("remember")

    /* TODO: Implémenter la logique de connexion ici, par exemple en vérifiant les informations d'identification contre une base de données. */
    
    return {
        success: true,
        redirectTo: "/professeur/dashboard"
    }
}

export async function register(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const firstName = formData.get("firstName")
    const lastName = formData.get("lastName")
    const email = formData.get("email")
    const password = formData.get("password")

    /* TODO: Implémenter la logique de inscription ici, par exemple en vérifiant les informations d'identification contre une base de données. */

    return {
        success: true,
        redirectTo: "/professeur/dashboard?onboarding=true"
    }

}