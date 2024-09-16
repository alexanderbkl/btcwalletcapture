const bitcoin = require('bitcoinjs-lib');
const ECPairFactory = require('ecpair').ECPairFactory;
const tinysecp = require('tiny-secp256k1');
const axios = require('axios');

const ECPair = ECPairFactory(tinysecp);

// Function to generate a Bitcoin address from a given private key
function generateBitcoinAddressFromPrivateKey(privateKeyInput) {
    try {
        let keyPair;

        if (/^[5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/.test(privateKeyInput)) {
            // Private key is in WIF format
            keyPair = ECPair.fromWIF(privateKeyInput);
        } else if (/^[A-Fa-f0-9]{64}$/.test(privateKeyInput)) {
            // Private key is in hexadecimal format
            const privateKeyBuffer = Buffer.from(privateKeyInput, 'hex');
            keyPair = ECPair.fromPrivateKey(privateKeyBuffer);
        } else {
            console.error('Invalid private key format. Please provide a WIF or hexadecimal private key.');
            return null;
        }

        // Get the private key in WIF (Wallet Import Format)
        const privateKeyWIF = keyPair.toWIF();

        // Get the public key
        const publicKey = keyPair.publicKey.toString('hex');

        // Get the Bitcoin address (using the P2PKH format)
        const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

        return {
            privateKeyWIF,
            publicKey,
            address,
        };
    } catch (error) {
        console.error('Error generating address from private key:', error.message);
        return null;
    }
}

// Function to check transactions for a given Bitcoin address
async function checkTransactions(address) {
    try {
        const response = await axios.get(`https://blockstream.info/api/address/${address}`);
        return response.data;
    } catch (error) {
        console.error(`Error checking transactions for address ${address}:`, error.message);
        return null;
    }
}

// Helper function to introduce a delay
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to process the private key and check transactions
async function main() {
    // Manually input your private key here (WIF or hexadecimal format)
    //1357
    for (let i = 1657; i < 1957; i++) {
        let privateKeyInput = '0000000000000000000000000000000000000000000000000000000000000001'; // Replace with your actual private key

        const privateKeyInputInt = parseInt(privateKeyInput, 16);
        const privateKeyInputIntPlus = privateKeyInputInt + i;
        // zero padding
        privateKeyInput = privateKeyInputIntPlus.toString(16).padStart(64, '0');

        console.log(`\nPrivate Key (hex): ${privateKeyInput}`);




        const result = generateBitcoinAddressFromPrivateKey(privateKeyInput);
        if (result) {
            const { privateKeyWIF, publicKey, address } = result;


            // Check the transaction history for the generated address
            const transactions = await checkTransactions(address);
            if (transactions && transactions.chain_stats && transactions.chain_stats.tx_count > 0) {

                console.log(`\nPrivate Key (WIF): ${privateKeyWIF}`);
                console.log(`Public Key: ${publicKey}`);
                console.log(`Bitcoin Address: ${address}`);
                console.log(`Number of transactions: ${transactions.chain_stats.tx_count}`);
                console.log(`Total received (in satoshis): ${transactions.chain_stats.funded_txo_sum}`);
                console.log(`Total sent (in satoshis): ${transactions.chain_stats.spent_txo_sum}`);
                console.log(`Final balance (in satoshis): ${transactions.chain_stats.funded_txo_sum - transactions.chain_stats.spent_txo_sum}`);
            } else {
                console.log(`Bitcoin Address: ${address}, ${i}`);
            }
        } else {
            console.log('Failed to generate address from the provided private key.');
        }

        // Wait for 1 second before ending the script
        await delay(1000); // 1000 milliseconds = 1 second
    }
}

main();
