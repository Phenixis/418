import { ActionResult } from "./types";


export async function creerCours(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const label = formData.get("label");
    const startDate = formData.get("start-date");
    const startTime = formData.get("start-time");
    const duration = formData.get("duration");
    const groups = formData.getAll("groups");
    
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
        success: true,
        course: {
            id: Math.floor(Math.random() * 1000)
        },
    };
}