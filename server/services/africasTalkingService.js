const credentials = {
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
};

const AfricasTalking = require('africastalking')(credentials);
const MOCK_MODE = process.env.MOCK_MODE === 'true';

const SMS_TEMPLATES = {
    approved: `Transaction Verified & Logged to Stellar! 🛡️ Quick Tip: Did you know that using a unique PIN for your bank and your phone makes you 80% harder to hack? Stay safe with #GuardianAcademy.`,
    blocked:  `Security Alert: Transaction Blocked by GuardianNode. 🛡️ Education: Someone may be trying to access your account. Dial *384*17088# and select 'Security School' to learn how to lock your SIM.`
};

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
        const adminPhone = process.env.AT_ADMIN_PHONE || process.env.AT_VIRTUAL_NUMBER;
        console.log(`[AT Live] Calling admin at ${adminPhone} for TX: ${transactionId}`);

        const response = await AfricasTalking.VOICE.call({
            callFrom: process.env.AT_VIRTUAL_NUMBER,
            callTo: [adminPhone]
        });
        console.log('[AT Live] Voice SDK Response:', response);
        return { message: 'Live call dispatched' };

    } catch (e) {
        if (e.message && (e.message.toLowerCase().includes('credit') || e.message.toLowerCase().includes('balance'))) {
            console.error(`[AT Live] Insufficient credits — TX ${transactionId} flagged for manual review`);
            return { message: 'Call failed: insufficient AT credits', error: e.message };
        }
        console.error('[AT Live] Voice Call Error:', e.message || e);
        return { message: 'Call dispatch error', error: e.message };
    }
}

// Sends a post-transaction educational SMS to the recipient.
// status: 'approved' | 'blocked'
async function sendTransactionSMS(phoneNumber, status) {
    const message = SMS_TEMPLATES[status] || SMS_TEMPLATES.blocked;

    if (MOCK_MODE || !process.env.AT_API_KEY) {
        console.log(`[AT Mock] SMS → ${phoneNumber}: ${message}`);
        return { message: 'SMS queued (mock)' };
    }

    try {
        const options = { to: [phoneNumber], message };
        if (process.env.AT_SENDER_ID) options.from = process.env.AT_SENDER_ID;

        const result = await AfricasTalking.SMS.send(options);
        console.log('[AT Live] SMS sent:', JSON.stringify(result));
        return result;

    } catch (e) {
        if (e.message && (e.message.toLowerCase().includes('credit') || e.message.toLowerCase().includes('balance'))) {
            console.error(`[AT Live] Insufficient credits for SMS to ${phoneNumber}`);
            return { message: 'SMS failed: insufficient AT credits', error: e.message };
        }
        console.error('[AT Live] SMS Error:', e.message || e);
        return { message: 'SMS dispatch error', error: e.message };
    }
}

// Disburses a small airtime reward (e.g. KES 5) as a quiz incentive.
async function sendAirtime(phoneNumber, amount = '5') {
    if (MOCK_MODE || !process.env.AT_API_KEY) {
        console.log(`[AT Mock] Airtime KES ${amount} → ${phoneNumber}`);
        return { message: 'Airtime queued (mock)' };
    }

    try {
        const result = await AfricasTalking.AIRTIME.send({
            recipients: [{ phoneNumber, amount, currencyCode: 'KES' }]
        });
        console.log('[AT Live] Airtime sent:', JSON.stringify(result));
        return result;
    } catch (e) {
        if (e.message && (e.message.toLowerCase().includes('credit') || e.message.toLowerCase().includes('balance'))) {
            console.error(`[AT Live] Insufficient credits for airtime to ${phoneNumber}`);
            return { message: 'Airtime failed: insufficient AT credits', error: e.message };
        }
        console.error('[AT Live] Airtime Error:', e.message || e);
        return { message: 'Airtime dispatch error', error: e.message };
    }
}

module.exports = {
    verifyPhoneNumberStatus,
    triggerAdminVoiceCall,
    sendTransactionSMS,
    sendAirtime
};
