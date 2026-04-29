const StellarSdk = require('stellar-sdk');
const https = require('node:https');

async function fundTestnet() {
    const pair = StellarSdk.Keypair.random();
    console.log(`STELLAR_PUBLIC_KEY=${pair.publicKey()}`);
    console.log(`STELLAR_SECRET_KEY=${pair.secret()}`);
    console.log('Funding via friendbot...');

    return new Promise((resolve) => {
        https.get(`https://friendbot.stellar.org/?addr=${pair.publicKey()}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log('Friendbot response:', data);
                resolve();
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
            resolve();
        });
    });
}

fundTestnet();
