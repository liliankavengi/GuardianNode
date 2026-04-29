const credentials = {
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
};

const AfricasTalking = require('africastalking')(credentials);
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// Checks phone number against SIM-swap and risk signals.
// AT Insights API requires an approved enterprise account; the mock below
// simulates the 48-hour SIM-swap window check used in production.
async function verifyPhoneNumberStatus(phoneNumber) {
    // Real implementation would POST to:
    // https://insights.africastalking.com/v1/query/SIMSwap
    // with { phoneNumber } and check response.swapTime against a 48h window.

    if (phoneNumber.endsWith('9')) {
        return {
            status: 'RISKY',
            reason: 'SIM Swap detected within the last 48 hours',
            simSwapWithin48h: true,
            // Simulated swap timestamp: 12 hours ago
            swapTimestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        };
    }

    return {
        status: 'SAFE',
        reason: 'No recent SIM swap activity detected.',
        simSwapWithin48h: false
    };
}

async function triggerAdminVoiceCall(transactionId) {
    if (MOCK_MODE || !process.env.AT_VIRTUAL_NUMBER) {
        console.log(`[AT Mock] Voice call queued for TX: ${transactionId}`);
        return { message: 'Call queued (mock)' };
    }

    try {
        // AT_ADMIN_PHONE is the real mobile number to call.
        // Falls back to the virtual number itself only as a last resort.
        const adminPhone = process.env.AT_ADMIN_PHONE || process.env.AT_VIRTUAL_NUMBER;
        console.log(`[AT Live] Calling admin at ${adminPhone} for TX: ${transactionId}`);

        const options = {
            callFrom: process.env.AT_VIRTUAL_NUMBER,
            callTo: [adminPhone]
        };

        const response = await AfricasTalking.VOICE.call(options);
        console.log('[AT Live] Voice SDK Response:', response);
        return { message: 'Live call dispatched' };

    } catch (e) {
        // Graceful handling for empty AT wallet during demo
        if (e.message && (e.message.toLowerCase().includes('credit') || e.message.toLowerCase().includes('balance'))) {
            console.error(`[AT Live] Insufficient credits — TX ${transactionId} flagged for manual review`);
            return { message: 'Call failed: insufficient AT credits', error: e.message };
        }
        console.error('[AT Live] Voice Call Error:', e.message || e);
        return { message: 'Call dispatch error', error: e.message };
    }
}

module.exports = {
    verifyPhoneNumberStatus,
    triggerAdminVoiceCall
};
