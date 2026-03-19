import { ActionResult } from "./types";


export async function creerCours(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const label = formData.get("label");
    const startDate = formData.get("start-date");
    const startTime = formData.get("start-time");
    const duration = formData.get("duration");
    const groups = formData.getAll("groups");

    console.log("Received form data:", { label, startDate, startTime, duration, groups });
    // Simulate an API call to create a course
    await new Promise((resolve) => setTimeout(resolve, 2000));


    // For demonstration, we return a success result with the form data
    return {
        success: true,
        course: {
            id: Math.floor(Math.random() * 1000), // Simulated course ID
            name: formData.get("courseName"),
            date: formData.get("courseDate"),
            groups: formData.getAll("courseGroups"),
        },
    };
}