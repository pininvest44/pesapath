const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FINASWIFT_API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Simple helper function to introduce delays between API calls (Rate limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/bulk-stk', async (req, res) => {
    const { numbers, amount, reference, email } = req.body;

    if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty numbers list.' });
    }
    if (!API_KEY || API_KEY === 'your_actual_api_key_here') {
        return res.status(500).json({ error: 'Server configuration error: API Key missing.' });
    }

    // Respond immediately to the client that processing has started
    res.json({ message: `Processing started for ${numbers.length} numbers.`, total: numbers.length });

    // Process the queue asynchronously in the background so the frontend doesn't timeout
    for (let i = 0; i < numbers.length; i++) {
        const msisdn = numbers[i].trim();
        if (!msisdn) continue;

        const payload = {
            api_key: API_KEY,
            email: email || 'bulk-app@example.com',
            amount: amount,
            msisdn: msisdn,
            reference: `${reference}-${i + 1}`
        };

        console.log(`[Queue ${i + 1}/${numbers.length}] Initiating STK Push to ${msisdn}...`);

        try {
            const response = await fetch('https://api.pesawise.xyz/api/payments/stk-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Even if the request didn't throw an error, checking if HTTP status is 2xx
            if (!response.ok) {
                const textError = await response.text();
                console.error(`[HTTP ERROR] ${msisdn} Status: ${response.status} - ${textError}`);
                continue; // Skip to the next number
            }

            const data = await response.json();
            console.log(`[SUCCESS] ${msisdn}:`, JSON.stringify(data));

catch (error) {

    console.error("========== FETCH ERROR ==========");
    console.error(error);
    console.error("Message:", error.message);
    console.error("Code:", error.code);
    console.error("Cause:", error.cause);
    console.error("Stack:", error.stack);
    console.error("=================================");

    res.write(`data: ${JSON.stringify({
        status: "failure",
        number: formattedNumber,
        error: error.code || error.message,
        cause: error.cause?.message || null
    })}\n\n`);
}

        // 30 requests per minute = 1 request every 2000 milliseconds
        if (i < numbers.length - 1) {
            await delay(2000); 
        }
    }
    console.log('[Queue Completed] All bulk STK requests processed.');
});

app.listen(PORT, () => {
    console.log(`Server running smoothly on port ${PORT}`);
});
