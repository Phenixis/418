import { saveDataToFile } from "./save";

const PLAYWRIGHT_SAVE_FILE_NAME = "playwright-before-tests.json";

saveDataToFile(PLAYWRIGHT_SAVE_FILE_NAME)
    .then(() => console.log("Playwright DB snapshot saved."))
    .catch((error) => {
        console.error("Error saving Playwright DB snapshot:", error);
        process.exitCode = 1;
    });
