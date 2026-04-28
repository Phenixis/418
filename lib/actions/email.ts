import axios from 'axios';

/**
 * Sends a transactional email via the configured Resend API endpoint.
 *
 * Wraps the HTML content in `<html><body>…</body></html>` when no `<html>` tag
 * is detected. Reads `RESEND_API_ENDPOINT` and `RESEND_API_KEY` from the
 * environment; throws when either is missing or when the HTTP call fails.
 *
 * @param to - Recipient email address.
 * @param subject - Email subject line.
 * @param htmlContent - HTML body of the message.
 * @returns The response data from the Resend API.
 * @throws {Error} If the API credentials are missing or the request fails.
 */
export async function sendEmail(to: string, subject: string, htmlContent: string) {
    const apiUrl = process.env.RESEND_API_ENDPOINT;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiUrl) {
        throw new Error('API endpoint is missing');
    }
    if (!apiKey) {
        throw new Error('API key is missing');
    }

    const html = htmlContent.includes("<html>") ? htmlContent : `<html><body>${htmlContent}</body></html>`;

    try {
        const response = await axios.post(apiUrl, {
            to,
            subject,
            html
        }, {
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });

        if (response.status < 200 || response.status >= 300) {
            throw new Error(`Failed to send email: ${response.statusText}`);
        }

        return response.data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}