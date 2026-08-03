# BTC Wallet Capture

![](https://komarev.com/ghpvc/?username=fkreddmods&color=lightgrey&style=for-the-badge)

> **⚠️ Educational purposes only.** This project is a research tool for exploring how Bitcoin private keys, public keys, and addresses relate to one another. It is **not** intended to be used to access funds that do not belong to you. See [Disclaimer](#disclaimer) for details.

## Overview

BTC Wallet Capture is a small Node.js utility that demonstrates the mechanics of Bitcoin key derivation and on-chain lookups end-to-end:

1. **Generate** a deterministic sequence of private keys within a chosen numeric range.
2. **Derive** the corresponding public key and P2PKH address for each private key using [`bitcoinjs-lib`](https://github.com/bitcoinjs/bitcoinjs-lib) and [`tiny-secp256k1`](https://github.com/bitcoinjs/tiny-secp256k1).
3. **Query** the [Blockstream Esplora API](https://github.com/Blockstream/esplora/blob/master/API.md) to check whether that address has any on-chain transaction history.
4. **Report** any address with a non-zero transaction count, including balance and transaction totals.

It was originally built out of curiosity about "brain wallets" and low-entropy private keys — many early Bitcoin addresses were generated from small, guessable numbers (e.g. `1`, `2`, `1234`, `666666`), and some of them received real transactions in the early days of the network.

## Why this project is interesting

- **Cryptography in practice**: hands-on use of elliptic curve key pairs (secp256k1), WIF encoding, and address derivation — the same primitives used by real Bitcoin wallets.
- **API integration**: async/await HTTP calls to a public blockchain explorer, with basic error handling and rate-limiting via delays.
- **Data pipeline mindset**: a simple but complete loop of *generate → derive → verify → report*, which is a pattern applicable well beyond cryptocurrency (e.g. bulk validation, enrichment pipelines, scanning workflows).

## How it works

```
┌──────────────────┐     ┌────────────────────┐     ┌───────────────────────┐     ┌───────────────────┐
│  Private key (i)  │ ──▶ │  Key pair (ECPair)  │ ──▶ │  P2PKH BTC address    │ ──▶ │  Blockstream API   │
│  hex, zero-padded │     │  bitcoinjs-lib +    │     │  bitcoin.payments     │     │  tx history lookup │
│                   │     │  tiny-secp256k1     │     │  .p2pkh()             │     │                    │
└──────────────────┘     └────────────────────┘     └───────────────────────┘     └───────────────────┘
                                                                                             │
                                                                                             ▼
                                                                            Log address, balance & tx count
                                                                            if the address has been used
```

Each private key accepts either format:

- **WIF** (`Wallet Import Format`, e.g. `KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFUW5RtS2JN1`)
- **Hex** (64 hexadecimal characters, e.g. `0000...0001`)

## Requirements

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [Yarn](https://yarnpkg.com/) package manager

## Getting started

```bash
# Clone the repository
git clone https://github.com/alexanderbkl/btcwalletcapture.git
cd btcwalletcapture

# Install dependencies
yarn install

# Run the script
node index.js
```

## Configuring the scan range

The private key range is controlled inside `main()` in `index.js`. By default, the script starts from a base hex key and increments it over a loop:

```js
async function main() {
    for (let i = 1657; i < 1957; i++) {
        let privateKeyInput = '0000000000000000000000000000000000000000000000000000000000000001';

        const privateKeyInputInt = parseInt(privateKeyInput, 16);
        const privateKeyInputIntPlus = privateKeyInputInt + i;
        privateKeyInput = privateKeyInputIntPlus.toString(16).padStart(64, '0');

        // ... derive address and check transactions
    }
}
```

To scan a different range, adjust the loop bounds (`i = start` and `i < end`). For example, to scan private keys `1` through `1000`:

```js
for (let i = 0; i < 1000; i++) {
    // ...
}
```

You can also change the base `privateKeyInput` to start from a different offset entirely, or feed it a specific WIF/hex key directly using `generateBitcoinAddressFromPrivateKey()`.

## Sample output

When a generated address has transaction history, the script logs a detailed summary:

```text
Private Key (hex): 000000000000000000000000000000000000000000000000000000000006b9

Private Key (WIF): KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFUW5RtS2JN1
Public Key: 038b00fcbfc1a203f44bf123fc7f4c91c10a85c8eae9187f9d22242b4600ce781c
Bitcoin Address: 1DBaumZxUkM4qMQRt2LVWyFJq5kDtSZQot
Number of transactions: 4
Total received (in satoshis): 1200961
Total sent (in satoshis): 1200961
Final balance (in satoshis): 0
```

If the address has never been used, a shorter line is printed instead so you can track progress through the range:

```text
Bitcoin Address: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 42
```

## What I found

Running this against low-entropy ranges (small integers, repeated digits, dates, etc.) turned up hundreds of addresses with real transaction history dating back to Bitcoin's early years — balances ranging from `0.0001 BTC` to `0.4 BTC` at the time they were active. Notable finds included:

- Private keys built from repeating digits (e.g. `666666...`) with transfers of exactly `666` satoshi.
- Keys containing sequences like `1234` paired with a `1234` satoshi transfer.

All of the addresses found so far have a **final balance of zero** — the funds were already moved out (frequently in the same block or shortly after), which matches public reports of "bot sweepers" that monitor and drain these known weak keys almost instantly. The value of this project is therefore historical/educational: reconstructing on-chain forensic timelines of some of Bitcoin's earliest and most naive key usage, not fund recovery.

## Tech stack

| Purpose                  | Library                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| Bitcoin primitives         | [`bitcoinjs-lib`](https://www.npmjs.com/package/bitcoinjs-lib)      |
| Elliptic curve operations  | [`tiny-secp256k1`](https://www.npmjs.com/package/tiny-secp256k1)    |
| Key pair management        | [`ecpair`](https://www.npmjs.com/package/ecpair)                   |
| HTTP requests              | [`axios`](https://www.npmjs.com/package/axios)                     |
| Blockchain data source     | [Blockstream Esplora API](https://blockstream.info/api)             |

## Disclaimer

This project is shared **strictly for educational and research purposes** — to illustrate Bitcoin key derivation, address formats, and how public blockchain APIs work. It is **not** a wallet-cracking tool: the private key space (2²⁵⁶) is astronomically large, and brute-forcing it is computationally infeasible. Any addresses discovered here were the result of scanning trivially small, previously known-weak key ranges that have already been identified and swept by others long before this script existed.

Do not use this code, or any derivative of it, to attempt to access funds or accounts that are not your own. The author assumes no responsibility for misuse.

## License

[MIT](./package.json)
