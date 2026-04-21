require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { logTransactionToStellar, getLedgerLogs } = require('./services/stellarService');
const { verifyPhoneNumberStatus, triggerAdminVoiceCall } = require('./services/africasTalkingService');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory store for pending transactions waiting for admin Voice approval
const pendingTransactions = new Map();

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// 1. Intercept Transaction
app.post('/api/transaction', async (req, res) => {
    const { recipientPhone, amount, type } = req.body;
    
    // Step A: Check Monitor (AT Insights)
    const phoneStatus = await verifyPhoneNumberStatus(recipientPhone);
    
    // Step B: Evaluate Rules
    const isHighValue = amount > 1000;
    const isRisky = phoneStatus.status === 'RISKY';
    
    const txData = {
        id: generateId(),
        recipientPhone,
        amount,
        type,
        timestamp: new Date().toISOString()
    };

    if (isRisky || isHighValue) {
        // Needs second signature (Voice Gate)
        pendingTransactions.set(txData.id, txData);
        await triggerAdminVoiceCall(txData.id);
        
        // Log the anomaly/attempt to Stellar
        await logTransactionToStellar({ ...txData, status: 'BLOCKED_PENDING_APPROVAL', reason: phoneStatus.reason });
        
        return res.status(202).json({ 
            success: false, 
            message: "Transaction flagged. Waiting for Admin Voice Authorization.",
            txId: txData.id,
            flags: { isHighValue, isRisky, reason: phoneStatus.reason }
        });
    }

    // Step C: Auto-Approve (Normal TX)
    await logTransactionToStellar({ ...txData, status: 'APPROVED' });
    
    res.json({ success: true, message: "Transaction processed securely.", txId: txData.id });
});

// 2. The Voice Gate Webhook (Africa's Talking calls this when Admin answers)
app.post('/api/voice/callback', async (req, res) => {
    // AT sends digits pressed by the user
    // e.g., dtmfDigits: '1'
    const { dtmfDigits, callerNumber } = req.body;
    
    let responseAction = '<Say>An error occurred.</Say>';

    if (dtmfDigits === '1') {
        responseAction = '<Say>Transaction Approved.</Say>';
        for (const [id, tx] of pendingTransactions.entries()) {
            await logTransactionToStellar({ ...tx, status: 'APPROVED_BY_ADMIN' });
            pendingTransactions.delete(id);
        }
    } else if (dtmfDigits === '2') {
        responseAction = '<Say>Transaction Denied. Locking API.</Say>';
        for (const [id, tx] of pendingTransactions.entries()) {
            await logTransactionToStellar({ ...tx, status: 'REJECTED_BY_ADMIN' });
            pendingTransactions.delete(id);
        }
    } else {
        responseAction = `
            <GetDigits timeout="10" numDigits="1">
                <Say>Guardian Node Alert. Press 1 to approve high risk transaction. Press 2 to deny and lock API.</Say>
            </GetDigits>
        `;
    }

    res.set('Content-Type', 'text/plain');
    res.send(`<Response>${responseAction}</Response>`);
});

// 3. Mock Endpoint for Frontend to simulate the Admin pressing '1' or '2'
app.post('/api/mock-voice-approve', async (req, res) => {
    const { txId, action } = req.body; 
    const tx = pendingTransactions.get(txId);
    if (!tx) return res.status(404).json({ error: "No pending tx found" });

    if (action === 'approve') {
        await logTransactionToStellar({ ...tx, status: 'APPROVED_BY_ADMIN' });
    } else {
        await logTransactionToStellar({ ...tx, status: 'REJECTED_BY_ADMIN' });
    }
    pendingTransactions.delete(txId);
    res.json({ success: true });
});

// 4. Secure logging retrieval
app.get('/api/logs', async (req, res) => {
    const logs = await getLedgerLogs();
    
    const failedAttempts = logs.filter(l => l.data.status.includes('REJECTED') || l.data.status.includes('BLOCKED')).length;
    const healthScore = Math.max(100 - (failedAttempts * 10), 0);

    // Return descending
    res.json({ logs: logs.reverse(), healthScore });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`GuardianNode Proxy running on port ${PORT}`));
