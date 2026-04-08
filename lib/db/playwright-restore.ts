import { seedFromFile } from "./seed";

const PLAYWRIGHT_SAVE_FILE_NAME = "playwright-before-tests.json";

seedFromFile(PLAYWRIGHT_SAVE_FILE_NAME)
    .then(() => console.log("Playwright DB snapshot restored."))
    .catch((error) => {
        console.error("Error restoring Playwright DB snapshot:", error);
        process.exitCode = 1;
    });
