import axios from 'axios';

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

        if (response.status !== 200) {
            throw new Error(`Failed to send email: ${response.statusText}`);
        }

        return response.data;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
}