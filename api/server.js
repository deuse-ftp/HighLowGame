require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { encodeFunctionData, parseEther, isAddress, createPublicClient, http, formatEther } = require('viem');
const { createWalletClient } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { monadTestnet } = require('../lib/monadTestnet'); // Usa lib/monadTestnet.js

// Contract address
const contractAddress = '0x36Afe0073E8efaEd19445AcE532CA3fcB51279db';

// ABI for HiLoGameMonadID contract (completo, igual ao localhost)
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "string", "name": "message", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
    ],
    "name": "DebugLog",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "username", "type": "string" },
      { "indexed": false, "internalType": "uint256", "name": "score", "type": "uint256" }
    ],
    "name": "LeaderboardUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "LeaderboardReset",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "prize", "type": "uint256" }
    ],
    "name": "PrizeRecorded",
    "type": "event"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "gameAction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllPlayersCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getLeaderboard",
    "outputs": [
      {
        "components": [
          { "internalType": "address", "name": "player", "type": "address" },
          { "internalType": "string", "name": "username", "type": "string" },
          { "internalType": "uint256", "name": "score", "type": "uint256" }
        ],
        "internalType": "struct HiLoGameMonadID.LeaderboardEntry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPlayerRank",
    "outputs": [
      { "internalType": "uint256", "name": "rank", "type": "uint256" },
      { "internalType": "uint256", "name": "score", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPlayerUsername",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "leaderboardAddress",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "playerCount",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "playerIndex",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "playerScore",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "name": "playerUsername",
    "outputs": [
      { "internalType": "string", "name": "", "type": "string" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" },
      { "internalType": "uint256", "name": "prize", "type": "uint256" },
      { "internalType": "string", "name": "username", "type": "string" }
    ],
    "name": "recordPrize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resetLeaderboard",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ABI for ILeaderboard contract
const leaderboardABI = [
  {
    inputs: [
      { internalType: 'address', name: 'player', type: 'address' },
      { internalType: 'uint256', name: 'scoreAmount', type: 'uint256' },
      { internalType: 'uint256', name: 'transactionAmount', type: 'uint256' },
    ],
    name: 'updatePlayerData',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// Private key for DEV_ADDRESS
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Validate private key
let walletClient;
if (!PRIVATE_KEY || !PRIVATE_KEY.startsWith('0x') || PRIVATE_KEY.length !== 66) {
  console.error('❌ Error: Private key inválida ou ausente. Transações falharão.');
} else {
  try {
    walletClient = createWalletClient({
      account: privateKeyToAccount(PRIVATE_KEY),
      chain: monadTestnet,
      transport: http(),
    });
    console.log('✅ WalletClient criado com sucesso para:', walletClient.account.address);
  } catch (error) {
    console.error('❌ Error creating walletClient:', error.message);
  }
}

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

const app = express();

// Configure CORS
app.use(cors({
  origin: '*', // Permitir todos os domínios no Vercel
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json());

// Transaction queue
let transactionQueue = [];
let isProcessing = false;
let lastUsedNonce = null;

// Function to process the transaction queue
const processQueue = async () => {
  if (isProcessing || transactionQueue.length === 0) {
    console.log(`ℹ️ Queue processing stopped: isProcessing=${isProcessing}, queueLength=${transactionQueue.length}`);
    return;
  }
  isProcessing = true;
  const { endpoint, data, resolve, reject } = transactionQueue.shift();
  try {
    console.log(`ℹ️ Processing transaction for endpoint: ${endpoint}`);
    // Get the latest nonce from the network
    const networkNonce = await publicClient.getTransactionCount({
      address: walletClient.account.address,
      blockTag: 'pending',
    });
    const nonce = lastUsedNonce !== null ? Math.max(networkNonce, lastUsedNonce + 1) : networkNonce;
    console.log(`ℹ️ Using nonce: ${nonce}`);
    // Get gas price and increase for priority
    let gasPrice = await publicClient.getGasPrice();
    gasPrice = BigInt(Math.floor(Number(gasPrice) * 1.2));
    console.log(`ℹ️ Adjusted gas price: ${formatEther(gasPrice)} MON`);
    // Estimate gas
    const gasLimit = await publicClient.estimateGas({
      account: walletClient.account.address,
      to: contractAddress,
      data,
      nonce,
      gasPrice,
    });
    console.log(`ℹ️ Estimated gas: ${gasLimit}`);
    // Send the transaction
    const hash = await walletClient.sendTransaction({
      to: contractAddress,
      data,
      gas: gasLimit,
      gasPrice,
      nonce,
    });
    console.log(`✅ Transaction sent successfully: ${hash}`);
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ Transaction confirmed, status: ${receipt.status}`);
    // Update last used nonce
    lastUsedNonce = nonce;
    resolve({ success: true, hash });
  } catch (error) {
    console.error(`❌ Failed to process transaction for ${endpoint}:`, error.message);
    if (error.message.includes('nonce too low') || error.message.includes('Another transaction has higher priority')) {
      console.log('ℹ️ Nonce issue detected, resetting nonce cache and requeuing...');
      lastUsedNonce = null;
      setTimeout(() => {
        transactionQueue.unshift({ endpoint, data, resolve, reject });
        processQueue();
      }, 2000);
    } else {
      reject({ error: `Failed to send transaction: ${error.message}` });
    }
  } finally {
    isProcessing = false;
    console.log(`ℹ️ Queue processing finished, isProcessing: ${isProcessing}`);
    if (transactionQueue.length > 0) {
      console.log('ℹ️ Processing next transaction in queue...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      processQueue();
    }
  }
};

// Endpoint to check if DEV_ADDRESS is the contract owner
app.get('/api/check-owner', async (req, res) => {
  try {
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'owner',
    });
    const isOwner = owner.toLowerCase() === walletClient.account.address.toLowerCase();
    console.log(`✅ Owner check: ${walletClient.account.address}, is owner? ${isOwner}`);
    res.json({ isOwner, owner });
  } catch (error) {
    console.error('❌ Failed to check owner:', error.message);
    res.status(500).json({ error: 'Failed to check owner: ' + error.message });
  }
});

// Endpoint for gameAction
app.post('/api/game-action', async (req, res) => {
  const { player } = req.body;
  if (!player || !isAddress(player)) {
    console.error('❌ Invalid player address:', player);
    return res.status(400).json({ error: 'Invalid player address' });
  }
  if (!walletClient) {
    console.error('❌ WalletClient não inicializado');
    return res.status(500).json({ error: 'WalletClient não inicializado' });
  }
  try {
    console.log('ℹ️ Received gameAction request, player:', player);
    // Check DEV_ADDRESS balance
    const balanceWei = await publicClient.getBalance({ address: walletClient.account.address });
    const balance = parseFloat(formatEther(balanceWei));
    console.log(`ℹ️ DEV_ADDRESS balance (${walletClient.account.address}): ${balance} MON`);
    if (balance < 0.01) {
      throw new Error('Insufficient balance in DEV_ADDRESS to pay gas');
    }
    // Check if DEV_ADDRESS is owner
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'owner',
    });
    if (owner.toLowerCase() !== walletClient.account.address.toLowerCase()) {
      console.error('❌ DEV_ADDRESS is not contract owner');
      return res.status(403).json({ error: 'DEV_ADDRESS is not contract owner' });
    }
    // Check if ILeaderboard contract exists
    const leaderboardCode = await publicClient.getBytecode({ address: '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4' });
    if (!leaderboardCode || leaderboardCode === '0x') {
      throw new Error('ILeaderboard contract not found at address 0xceCBFF203C8B6044F52CE23D914A1bfD997541A4');
    }
    const data = encodeFunctionData({
      abi: contractABI,
      functionName: 'gameAction',
      args: [player],
    });
    // Add to transaction queue
    return new Promise((resolve, reject) => {
      transactionQueue.push({
        endpoint: '/api/game-action',
        data,
        resolve: (result) => res.json(result),
        reject: (error) => res.status(500).json(error),
      });
      processQueue();
    });
  } catch (error) {
    console.error('❌ Failed to process gameAction:', error.message);
    res.status(500).json({ error: 'Failed to process gameAction: ' + error.message });
  }
});

// Endpoint for recordPrize
app.post('/api/record-prize', async (req, res) => {
  const { player, prize, username } = req.body;
  if (!player || !isAddress(player) || !prize || typeof username !== 'string') {
    console.error('❌ Invalid parameters:', { player, prize, username });
    return res.status(400).json({ error: 'Player, prize, and username are required' });
  }
  if (!walletClient) {
    console.error('❌ WalletClient não inicializado');
    return res.status(500).json({ error: 'WalletClient não inicializado' });
  }
  try {
    console.log('ℹ️ Received recordPrize request, player:', player, 'prize:', prize, 'username:', username);
    // Check DEV_ADDRESS balance
    const balanceWei = await publicClient.getBalance({ address: walletClient.account.address });
    const balance = parseFloat(formatEther(balanceWei));
    console.log(`ℹ️ DEV_ADDRESS balance (${walletClient.account.address}): ${balance} MON`);
    if (balance < 0.01) {
      throw new Error('Insufficient balance in DEV_ADDRESS to pay gas');
    }
    // Check if DEV_ADDRESS is owner
    const owner = await publicClient.readContract({
      address: contractAddress,
      abi: contractABI,
      functionName: 'owner',
    });
    if (owner.toLowerCase() !== walletClient.account.address.toLowerCase()) {
      console.error('❌ DEV_ADDRESS is not contract owner');
      return res.status(403).json({ error: 'DEV_ADDRESS is not contract owner' });
    }
    // Check if ILeaderboard contract exists
    const leaderboardCode = await publicClient.getBytecode({ address: '0xceCBFF203C8B6044F52CE23D914A1bfD997541A4' });
    if (!leaderboardCode || leaderboardCode === '0x') {
      throw new Error('ILeaderboard contract not found at address 0xceCBFF203C8B6044F52CE23D914A1bfD997541A4');
    }
    const data = encodeFunctionData({
      abi: contractABI,
      functionName: 'recordPrize',
      args: [player, prize, username],
    });
    // Add to transaction queue
    return new Promise((resolve, reject) => {
      transactionQueue.push({
        endpoint: '/api/record-prize',
        data,
        resolve: (result) => res.json(result),
        reject: (error) => res.status(500).json(error),
      });
      processQueue();
    });
  } catch (error) {
    console.error('❌ Failed to process recordPrize:', error.message);
    res.status(500).json({ error: 'Failed to process recordPrize: ' + error.message });
  }
});

// Endpoint for fundWallet
app.post('/api/fund-wallet', async (req, res) => {
  const { to, amount } = req.body;
  if (!to || !isAddress(to) || !amount) {
    console.error('❌ Invalid parameters:', { to, amount });
    return res.status(400).json({ error: 'Destination address and amount are required' });
  }
  if (!walletClient) {
    console.error('❌ WalletClient não inicializado');
    return res.status(500).json({ error: 'WalletClient não inicializado' });
  }
  try {
    console.log('ℹ️ Received fundWallet request, to:', to, 'amount:', amount);
    // Check DEV_ADDRESS balance
    const balanceWei = await publicClient.getBalance({ address: walletClient.account.address });
    const balance = parseFloat(formatEther(balanceWei));
    console.log(`ℹ️ DEV_ADDRESS balance (${walletClient.account.address}): ${balance} MON`);
    if (balance < parseFloat(amount)) {
      throw new Error('Insufficient balance in DEV_ADDRESS to send amount');
    }
    // Get the latest nonce from the network
    const networkNonce = await publicClient.getTransactionCount({
      address: walletClient.account.address,
      blockTag: 'pending',
    });
    const nonce = lastUsedNonce !== null ? Math.max(networkNonce, lastUsedNonce + 1) : networkNonce;
    console.log(`ℹ️ Using nonce: ${nonce}`);
    // Get gas price and increase for priority
    let gasPrice = await publicClient.getGasPrice();
    gasPrice = BigInt(Math.floor(Number(gasPrice) * 1.2));
    console.log(`ℹ️ Adjusted gas price: ${formatEther(gasPrice)} MON`);
    const hash = await walletClient.sendTransaction({
      to,
      value: parseEther(amount),
      gasPrice,
      nonce,
    });
    console.log(`✅ Transaction sent successfully: ${hash}`);
    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ Transaction confirmed, status: ${receipt.status}`);
    // Update last used nonce
    lastUsedNonce = nonce;
    res.json({ success: true, hash });
  } catch (error) {
    console.error('❌ Failed to send fundWallet transaction:', error.message);
    res.status(500).json({ error: 'Failed to send transaction: ' + error.message });
  }
});

// Test endpoint to confirm backend is running
app.get('/api/test', (req, res) => {
  res.json({ status: 'Backend is running!' });
});

// Custom 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;