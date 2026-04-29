require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { logTransactionToStellar, getLedgerLogs } = require('./services/stellarService');
const {
    verifyPhoneNumberStatus,
    triggerAdminVoiceCall,
    sendTransactionSMS,
    sendAirtime
} = require('./services/africasTalkingService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global system state — false means emergency lockdown, all transactions blocked
let SYSTEM_ARMED = true;

// In-memory store for pending transactions awaiting admin voice approval
const pendingTransactions = new Map();

const generateId = () => Math.random().toString(36).substring(2, 9);

// Auto-reject pending transactions that exceed the 60-second admin response window
setInterval(async () => {
    const now = Date.now();
    for (const [id, tx] of pendingTransactions.entries()) {
        const age = now - new Date(tx.timestamp).getTime();
        if (age > 60000) {
            console.log(`[GuardianNode] TX ${id} timed out after 60s — auto-rejecting`);
            await logTransactionToStellar({ ...tx, status: 'REJECTED_TIMEOUT' });
            sendTransactionSMS(tx.recipientPhone, 'blocked').catch(() => {});
            pendingTransactions.delete(id);
        }
    }
}, 10000);

// ─────────────────────────────────────────────
// 1. Intercept Transaction
// ─────────────────────────────────────────────
app.post('/api/transaction', async (req, res) => {
    if (!SYSTEM_ARMED) {
        return res.status(403).json({
            error: 'SYSTEM LOCKDOWN',
            message: 'GuardianNode is in emergency lockdown. All transactions are blocked.'
        });
    }

    const { recipientPhone, amount, type } = req.body;

    // Step A: SIM Swap & Insights check (before transaction enters pending state)
    const phoneStatus = await verifyPhoneNumberStatus(recipientPhone);

    // Step B: Evaluate risk rules
    const isHighValue = amount > 1000;
    const isRisky = phoneStatus.status === 'RISKY';
    const isSimSwapRecent = phoneStatus.simSwapWithin48h === true;

    const txData = {
        id: generateId(),
        recipientPhone,
        amount,
        type,
        timestamp: new Date().toISOString(),
        simSwapDetected: isSimSwapRecent
    };

    if (isRisky || isHighValue || isSimSwapRecent) {
        pendingTransactions.set(txData.id, txData);

        triggerAdminVoiceCall(txData.id).catch(e =>
            console.error(`[Voice] Dispatch failed for TX ${txData.id}: ${e.message}`)
        );

        await logTransactionToStellar({
            ...txData,
            status: 'BLOCKED_PENDING_APPROVAL',
            reason: phoneStatus.reason
        });

        return res.status(202).json({
            success: false,
            message: 'Transaction flagged. Waiting for Admin Voice Authorization.',
            txId: txData.id,
            flags: { isHighValue, isRisky, isSimSwapRecent, reason: phoneStatus.reason }
        });
    }

    // Step C: Auto-approve low-risk transactions
    await logTransactionToStellar({ ...txData, status: 'APPROVED' });
    sendTransactionSMS(recipientPhone, 'approved').catch(() => {});
    res.json({ success: true, message: 'Transaction processed securely.', txId: txData.id });
});

// ─────────────────────────────────────────────
// 2. Voice Gate Webhook (Africa's Talking calls this when admin answers)
//    Press 1 → EXECUTE (approve)
//    Press 9 → KILL (deny + lockdown)
// ─────────────────────────────────────────────
app.post('/api/voice/callback', async (req, res) => {
    const { dtmfDigits } = req.body;
    let responseXml;

    if (dtmfDigits === '1') {
        for (const [id, tx] of pendingTransactions.entries()) {
            await logTransactionToStellar({ ...tx, status: 'APPROVED_BY_ADMIN' });
            sendTransactionSMS(tx.recipientPhone, 'approved').catch(() => {});
            pendingTransactions.delete(id);
        }
        responseXml = '<Response><Say>Transaction approved and executed. Guardian Node log updated.</Say></Response>';

    } else if (dtmfDigits === '9') {
        SYSTEM_ARMED = false;
        for (const [id, tx] of pendingTransactions.entries()) {
            await logTransactionToStellar({ ...tx, status: 'REJECTED_BY_ADMIN' });
            sendTransactionSMS(tx.recipientPhone, 'blocked').catch(() => {});
            pendingTransactions.delete(id);
        }
        responseXml = '<Response><Say>Kill switch activated. Transaction denied. System is now in emergency lockdown. All further transactions are blocked.</Say></Response>';

    } else {
        const callbackUrl = process.env.AT_CALLBACK_URL
            ? `${process.env.AT_CALLBACK_URL}/api/voice/callback`
            : '';
        responseXml = `<Response>
            <GetDigits timeout="20" numDigits="1"${callbackUrl ? ` callbackUrl="${callbackUrl}"` : ''}>
                <Say>Guardian Node security alert. A high-risk transaction requires your authorisation. Press 1 to execute and approve the transaction. Press 9 to kill the transaction and lock down the system.</Say>
            </GetDigits>
            <Say>No input received. The transaction has been auto-rejected for safety.</Say>
        </Response>`;
    }

    res.set('Content-Type', 'text/plain');
    res.send(responseXml);
});

// ─────────────────────────────────────────────
// 3. USSD Kill Switch — *384*17088#
//    Allows remote ARM / DISARM and a 30-second security quiz with airtime reward.
//    AT accumulates inputs with '*' e.g. "1" → "1*1" → "1*2"
// ─────────────────────────────────────────────
app.post('/ussd', async (req, res) => {
    const { text, phoneNumber } = req.body;
    let response;

    if (text === '') {
        const status = SYSTEM_ARMED ? 'ACTIVE' : 'LOCKED DOWN';
        response = `CON GuardianNode Control\nStatus: ${status}\n\n1. ARM System (Normal)\n2. Emergency Lockdown\n3. Check Status`;

    } else if (text === '1') {
        SYSTEM_ARMED = true;
        console.log('[USSD] System ARMED via USSD');
        response = `CON GuardianNode ARMED. System is operating normally.\n\nTake a 30-second security quiz to earn 5 KES airtime?\n1. Yes\n2. Not now`;

    } else if (text === '1*1') {
        // Accepted the quiz — ask the question
        response = `CON Security Quiz:\nWhat should you do FIRST if your phone is lost or stolen?\n1. Report to your carrier to lock your SIM\n2. Wait to see if someone returns it`;

    } else if (text === '1*1*1') {
        // Correct answer
        if (phoneNumber) {
            sendAirtime(phoneNumber, '5').catch(() => {});
        }
        response = `END Correct! Locking your SIM immediately prevents fraud.\n5 KES airtime has been sent to your number.\nStay safe! #GuardianAcademy`;

    } else if (text === '1*1*2') {
        // Wrong answer — still educational
        response = `END The correct answer is: Report to your carrier immediately.\nA lost SIM is a security risk — lock it fast!\nDial *384*17088# anytime to learn more. #GuardianAcademy`;

    } else if (text === '1*2') {
        // Declined quiz
        response = `END No worries! Dial *384*17088# anytime to earn airtime through security tips. Stay safe!`;

    } else if (text === '2') {
        SYSTEM_ARMED = false;
        console.log('[USSD] Emergency LOCKDOWN activated via USSD');
        response = 'END EMERGENCY LOCKDOWN ACTIVE. All transactions are now BLOCKED.';

    } else if (text === '3') {
        const status = SYSTEM_ARMED ? 'ARMED — Normal Operation' : 'DISARMED — Lockdown Active';
        response = `END System Status: ${status}`;

    } else {
        response = 'END Invalid selection.';
    }

    res.set('Content-Type', 'text/plain');
    res.send(response);
});

// ─────────────────────────────────────────────
// 4. Mock endpoint — frontend simulates admin voice decision
// ─────────────────────────────────────────────
app.post('/api/mock-voice-approve', async (req, res) => {
    const { txId, action } = req.body;
    const tx = pendingTransactions.get(txId);
    if (!tx) return res.status(404).json({ error: 'No pending transaction found' });

    if (action === 'approve') {
        await logTransactionToStellar({ ...tx, status: 'APPROVED_BY_ADMIN' });
        sendTransactionSMS(tx.recipientPhone, 'approved').catch(() => {});
    } else {
        SYSTEM_ARMED = false;
        await logTransactionToStellar({ ...tx, status: 'REJECTED_BY_ADMIN' });
        sendTransactionSMS(tx.recipientPhone, 'blocked').catch(() => {});
    }
    pendingTransactions.delete(txId);
    res.json({ success: true, systemArmed: SYSTEM_ARMED });
});

// ─────────────────────────────────────────────
// 5. System status & arm toggle (for the frontend KillSwitch panel)
// ─────────────────────────────────────────────
app.get('/api/system-status', (req, res) => {
    res.json({ armed: SYSTEM_ARMED, pendingCount: pendingTransactions.size });
});

app.post('/api/system-arm', (req, res) => {
    const { arm } = req.body;
    SYSTEM_ARMED = Boolean(arm);
    console.log(`[GuardianNode] System ${SYSTEM_ARMED ? 'ARMED' : 'DISARMED'} via dashboard`);
    res.json({ success: true, armed: SYSTEM_ARMED });
});

// ─────────────────────────────────────────────
// 6. Secure logging retrieval
// ─────────────────────────────────────────────
app.get('/api/logs', async (req, res) => {
    const logs = await getLedgerLogs();
    const failedAttempts = logs.filter(l =>
        l.data.status.includes('REJECTED') || l.data.status.includes('BLOCKED')
    ).length;
    const healthScore = Math.max(100 - (failedAttempts * 10), 0);
    res.json({ logs: [...logs].reverse(), healthScore });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`GuardianNode Proxy running on port ${PORT}`));
