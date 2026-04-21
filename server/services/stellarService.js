const StellarSdk = require('stellar-sdk');

const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
const MOCK_MODE = process.env.MOCK_MODE === 'true';

const publicKey = process.env.STELLAR_PUBLIC_KEY;
const secretKey = process.env.STELLAR_SECRET_KEY;

// Keep a local cache of live logs so the frontend is fast
// We'll also fetch them on startup.
let liveLogsArray = [];

async function logTransactionToStellar(transactionData) {
    const txHashPayload = StellarSdk.hash(Buffer.from(JSON.stringify(transactionData))).toString('hex');
    console.log(`[Stellar] Processing Hash for Ledger: ${txHashPayload}`);

    // Standard structural log entry we keep in-memory for fast API responses
    const logEntry = {
        id: txHashPayload,
        timestamp: new Date().toISOString(),
        data: transactionData,
        status: 'PENDING'
    };

    if (MOCK_MODE || !secretKey || !publicKey) {
        console.log(`[Stellar Mock] Running without live broadcast`);
        logEntry.status = 'SUCCESS (MOCK)';
        liveLogsArray.unshift(logEntry);
        return logEntry;
    }

    try {
        console.log(`[Stellar Live] Submitting Zero-Value Transaction with Hash Memo to Testnet...`);
        const sourceKeys = StellarSdk.Keypair.fromSecret(secretKey);
        
        // 1. Fetch sequence number
        const account = await server.loadAccount(publicKey);
        
        // 2. Build Transaction
        // We use a zero-amount payment to ourselves, purely as a vehicle for the Memo.hash overlay
        // Memo.hash accepts exactly 32 bytes (a hex string of 64 chars)
        
        const builder = new StellarSdk.TransactionBuilder(account, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.TESTNET
        });

        builder.addOperation(StellarSdk.Operation.payment({
            destination: publicKey,
            asset: StellarSdk.Asset.native(),
            amount: "0.0000001" // Smallest unit to validate tx format
        }));

        builder.addMemo(StellarSdk.Memo.hash(txHashPayload));
        builder.setTimeout(30);
        
        const transaction = builder.build();
        
        // 3. Sign
        transaction.sign(sourceKeys);

        // 4. Submit
        const response = await server.submitTransaction(transaction);
        console.log(`[Stellar Live] Successfully committed block: ${response.hash}`);
        
        // Finalize state
        logEntry.status = 'SUCCESS (ON-CHAIN)';
        logEntry.ledgerHash = response.hash;
        logEntry.ledgerUrl = `https://stellar.expert/explorer/testnet/tx/${response.hash}`;
        
        // Insert at top
        liveLogsArray.unshift(logEntry);
        return logEntry;
    } catch (e) {
        console.error(`[Stellar Live] Error broadcasting network tx: `, e.response ? e.response.data : e.message);
        logEntry.status = 'FAILED_NETWORK_SYNC';
        liveLogsArray.unshift(logEntry);
        return logEntry;
    }
}

async function getLedgerLogs() {
    return liveLogsArray;
}

module.exports = {
    logTransactionToStellar,
    getLedgerLogs
};
