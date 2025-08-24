import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;
import React, { useState, useEffect } from 'react';
import { isAddress, formatEther } from 'viem';
import ReactDOM from 'react-dom/client';
import { PrivyProvider, useLogin, usePrivy, useWallets, useCrossAppAccounts } from '@privy-io/react-auth';
import { defineChain, createPublicClient, http } from 'viem';
import Draggable from 'react-draggable';

// Define the Monad Testnet chain
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
    public: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
});

// Contract address
const contractAddress = '0x04860C366B7DB25C087eE170b75d38CC4d50200D';

// ABI for HiLoGameMonadID contract
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

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

const DEV_ADDRESS = '0x8a6BFa87D9e7053728076B2C84cC0acd829A2958';
const BACKEND_URL = '/api';

// WalletPanel component
const WalletPanel = ({ walletAddress, balance, username, checkOwner, fundWallet }) => {
  const [showBalance, setShowBalance] = useState(false);
  const buttonStyle = {
    width: '120px',
    padding: '10px',
    marginBottom: '10px',
    background: 'linear-gradient(to bottom, #836EF9, #5B4FC0)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
    textAlign: 'center',
    overflow: 'hidden',
  };
  const darkButtonStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    background: '#2a2a2a',
    border: '1px solid #5B4FC0',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  const buttonHover = (e) => {
    e.target.style.background = 'linear-gradient(to bottom, #5B4FC0, #836EF9)';
  };
  const buttonHoverOut = (e) => {
    e.target.style.background = 'linear-gradient(to bottom, #836EF9, #5B4FC0)';
  };
  const darkButtonHover = (e) => {
    e.target.style.background = '#3a3a3a';
  };
  const darkButtonHoverOut = (e) => {
    e.target.style.background = '#2a2a2a';
  };
  return (
    <div style={{ marginTop: '10px' }}>
      <div className="username-section">
        <strong>
          Username:{' '}
          {username === 'Unknown' || !username ? (
            <a
              href="https://monad-games-id-site.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              Register Username
            </a>
          ) : (
            username
          )}
        </strong>
      </div>
      <button
        style={darkButtonStyle}
        onMouseOver={darkButtonHover}
        onMouseOut={darkButtonHoverOut}
        onClick={() => setShowBalance(!showBalance)}
      >
        {showBalance ? (
          <>MON: {balance}</>
        ) : (
          <>Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</>
        )}
        <svg width="12" height="12" viewBox="0.0 0.0 12.0 12.0" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9L11 4H1L6 9Z" fill="#836EF9" />
        </svg>
      </button>
      {walletAddress === DEV_ADDRESS && (
        <>
          <button
            style={darkButtonStyle}
            onMouseOver={darkButtonHover}
            onMouseOut={darkButtonHoverOut}
            onClick={checkOwner}
          >
            Check Owner
          </button>
          <button
            style={darkButtonStyle}
            onMouseOver={darkButtonHover}
            onMouseOut={darkButtonHoverOut}
            onClick={fundWallet}
          >
            Fund Wallet (1 MON)
          </button>
        </>
      )}
    </div>
  );
};

// PrivyConnect component
const PrivyConnect = () => {
  const { login } = useLogin({
    onComplete: (user, isNewUser, wasAlreadyAuthenticated, loginMethod) => {
      console.log('✅ User logged in:', user, 'Method:', loginMethod);
      window.dispatchEvent(new Event('walletConnected'));
      window.privyUser = user;
    },
    onError: (error) => {
      if (error !== 'exited_auth_flow') {
        console.error('❌ Login failed:', error);
        alert('Failed to log in. Check Privy Dashboard configuration or try again.');
      } else {
        console.log('ℹ️ User exited login flow, ignoring...');
      }
    },
  });
  const { authenticated, ready, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction: sendCrossAppTransaction } = useCrossAppAccounts();
  const [leaderboard, setLeaderboard] = useState(JSON.parse(localStorage.getItem('cachedLeaderboard') || '[]'));
  const [playerRank, setPlayerRank] = useState(JSON.parse(localStorage.getItem('cachedPlayerRank') || '{"rank": 0, "score": 0}'));
  const [balance, setBalance] = useState('0.000');
  const [monadWalletAddress, setMonadWalletAddress] = useState('');
  const [username, setUsername] = useState('');
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [usernamesMap, setUsernamesMap] = useState(new Map());
  const [lastLeaderboardUpdate, setLastLeaderboardUpdate] = useState(0);
  const [lastLeaderboardReset, setLastLeaderboardReset] = useState(0);

  // Debounce function to limit event handling
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  useEffect(() => {
    console.log('ℹ️ Privy ready status:', ready);
    if (!ready) {
      console.log('ℹ️ Privy not ready yet, waiting for initialization...');
      return;
    }
    if (authenticated && user && user.linkedAccounts.length > 0) {
      console.log('ℹ️ Checking linked accounts:', user.linkedAccounts);
      const crossAppAccount = user.linkedAccounts.find(
        (account) => account.type === 'cross_app' && account.providerApp.id === 'cmd8euall0037le0my79qpz42'
      );
      if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
        const address = crossAppAccount.embeddedWallets[0].address;
        console.log('✅ Embedded wallet address found:', address);
        setMonadWalletAddress(address);
        fetchUsername(address).then((newUsername) => {
          console.log('✅ Username fetched:', newUsername);
          setUsername(newUsername);
        });
      } else {
        console.error('❌ Monad Games ID account not found');
      }
    }
    // Fetch leaderboard even if not authenticated
    fetchLeaderboardAndRank();
    // Set up event listeners for LeaderboardUpdated and LeaderboardReset
    const handleLeaderboardUpdated = debounce((logs) => {
      const now = Date.now();
      if (now - lastLeaderboardUpdate < 1000) {
        console.log('ℹ️ Skipping duplicate LeaderboardUpdated event');
        return;
      }
      setLastLeaderboardUpdate(now);
      console.log('✅ LeaderboardUpdated event received:', logs);
      fetchLeaderboardAndRank(true);
    }, 1000);
    const handleLeaderboardReset = debounce((logs) => {
      const now = Date.now();
      if (now - lastLeaderboardReset < 1000) {
        console.log('ℹ️ Skipping duplicate LeaderboardReset event');
        return;
      }
      setLastLeaderboardReset(now);
      console.log('✅ LeaderboardReset event received:', logs);
      localStorage.removeItem('cachedLeaderboard');
      localStorage.removeItem('cachedPlayerRank');
      setLeaderboard([]);
      setPlayerRank({ rank: 0, score: 0 });
      fetchLeaderboardAndRank(true);
    }, 1000);
    const unsubscribeUpdated = publicClient.watchEvent({
      address: contractAddress,
      abi: contractABI,
      eventName: 'LeaderboardUpdated',
      pollingInterval: 15000,
      onLogs: handleLeaderboardUpdated,
      onError: (error) => {
        console.error('❌ Failed to listen for LeaderboardUpdated:', error);
      },
    });
    const unsubscribeReset = publicClient.watchEvent({
      address: contractAddress,
      abi: contractABI,
      eventName: 'LeaderboardReset',
      pollingInterval: 15000,
      onLogs: handleLeaderboardReset,
      onError: (error) => {
        console.error('❌ Failed to listen for LeaderboardReset:', error);
      },
    });
    // Cleanup event listeners on unmount
    return () => {
      unsubscribeUpdated();
      unsubscribeReset();
    };
  }, [ready, authenticated, user]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (monadWalletAddress) {
        try {
          const balanceWei = await publicClient.getBalance({ address: monadWalletAddress });
          const balance = parseFloat(formatEther(balanceWei)).toFixed(3);
          setBalance(balance);
        } catch (error) {
          console.error('❌ Failed to fetch balance:', error);
        }
      }
    };
    fetchBalance();
    const balanceInterval = setInterval(fetchBalance, 10000);
    return () => clearInterval(balanceInterval);
  }, [monadWalletAddress]);

  const checkOwner = async () => {
    try {
      const owner = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'owner',
      });
      const isOwner = owner.toLowerCase() === DEV_ADDRESS.toLowerCase();
      console.log('✅ Owner check completed, is owner?', isOwner, 'Owner address:', owner);
      alert(`Owner: ${isOwner ? 'Yes' : 'No'}, Address: ${owner}`);
    } catch (error) {
      console.error('❌ Failed to check owner:', error);
    }
  };

  const fundWallet = async () => {
    if (!monadWalletAddress || !isAddress(monadWalletAddress)) {
      console.error('❌ Invalid wallet address:', monadWalletAddress);
      return;
    }
    try {
      console.log('ℹ️ Sending fund wallet request, to:', monadWalletAddress);
      const response = await fetch(`${BACKEND_URL}/fund-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: monadWalletAddress, amount: '1' }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Wallet funded successfully:', data.hash);
        alert('Wallet funded successfully!');
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to call backend, status:', response.status, 'message:', errorData.error);
      }
    } catch (error) {
      console.error('❌ Failed to fund wallet:', error);
    }
  };

  const fetchUsername = async (walletAddress) => {
    if (!walletAddress) {
      console.warn('❌ No wallet address provided for fetchUsername');
      return 'Unknown';
    }
    if (usernamesMap.has(walletAddress)) {
      const cachedUsername = usernamesMap.get(walletAddress);
      console.log('✅ Using cached username:', cachedUsername);
      return cachedUsername;
    }
    setLoadingUsername(true);
    try {
      const url = 'https://monad-games-id-site.vercel.app/api/check-wallet?wallet=' + walletAddress;
      console.log('ℹ️ Fetching username for:', walletAddress);
      const response = await fetch(url);
      const data = await response.json();
      console.log('ℹ️ API response:', data);
      if (response.ok && data.hasUsername && data.user?.username) {
        const newUsername = data.user.username;
        setUsernamesMap(prev => new Map(prev).set(walletAddress, newUsername));
        setUsername(newUsername);
        console.log('✅ Username fetched successfully:', newUsername);
        return newUsername;
      } else {
        console.warn('❌ Username not found for:', walletAddress);
        setUsernamesMap(prev => new Map(prev).set(walletAddress, 'Unknown'));
        setUsername('Unknown');
        return 'Unknown';
      }
    } catch (error) {
      console.error('❌ Failed to fetch username:', error);
      setUsername('Unknown');
      return 'Unknown';
    } finally {
      setLoadingUsername(false);
    }
  };

  const fetchLeaderboardAndRank = async (forceUpdate = false) => {
    let leaderboardData = [];
    try {
      if (!forceUpdate && leaderboard.length > 0) {
        console.log('ℹ️ Usando leaderboard em cache:', leaderboard);
        window.dispatchEvent(
          new CustomEvent('leaderboardUpdated', {
            detail: { leaderboard, playerRank },
          })
        );
        if (monadWalletAddress && isAddress(monadWalletAddress)) {
          console.log('ℹ️ Atualizando rank do jogador:', monadWalletAddress);
          const [rank, score] = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: 'getPlayerRank',
            args: [monadWalletAddress],
          });
          const updatedPlayerRank = { rank: Number(rank), score: Number(score) };
          console.log('✅ Rank do jogador obtido com sucesso:', updatedPlayerRank);
          setPlayerRank(updatedPlayerRank);
          localStorage.setItem('cachedPlayerRank', JSON.stringify(updatedPlayerRank));
          window.dispatchEvent(
            new CustomEvent('leaderboardUpdated', {
              detail: { leaderboard, playerRank: updatedPlayerRank },
            })
          );
        }
        return;
      }
      const rawLeaderboard = await publicClient.readContract({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getLeaderboard',
      });
      leaderboardData = await Promise.all(rawLeaderboard.map(async (entry) => {
        let userName = entry.username;
        if (!userName || userName === '') {
          userName = await fetchUsername(entry.player);
        }
        return {
          player: entry.player,
          username: userName || 'Unknown',
          score: Number(entry.score),
        };
      }));
      leaderboardData.sort((a, b) => b.score - a.score);
      let updatedPlayerRank = { rank: 0, score: 0 };
      if (monadWalletAddress && isAddress(monadWalletAddress)) {
        try {
          const [rank, score] = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: 'getPlayerRank',
            args: [monadWalletAddress],
          });
          updatedPlayerRank = { rank: Number(rank), score: Number(score) };
          console.log('✅ Rank do jogador obtido com sucesso:', updatedPlayerRank);
          setPlayerRank(updatedPlayerRank);
          localStorage.setItem('cachedPlayerRank', JSON.stringify(updatedPlayerRank));
        } catch (error) {
          console.error('❌ Falha ao obter rank do jogador para', monadWalletAddress, ':', error);
          const playerEntry = leaderboardData.find(entry => entry.player.toLowerCase() === monadWalletAddress.toLowerCase());
          if (playerEntry) {
            updatedPlayerRank = { rank: leaderboardData.indexOf(playerEntry) + 1, score: Number(entry.score) };
            console.log('ℹ️ Usando dados do leaderboard para rank do jogador:', updatedPlayerRank);
            setPlayerRank(updatedPlayerRank);
            localStorage.setItem('cachedPlayerRank', JSON.stringify(updatedPlayerRank));
          } else {
            console.warn('⚠️ Jogador não encontrado no leaderboard, usando rank padrão:', updatedPlayerRank);
          }
        }
      }
      window.dispatchEvent(
        new CustomEvent('leaderboardUpdated', {
          detail: { leaderboard: leaderboardData, playerRank: updatedPlayerRank },
        })
      );
      console.log('✅ Leaderboard obtido com sucesso:', leaderboardData);
      localStorage.setItem('cachedLeaderboard', JSON.stringify(leaderboardData));
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('❌ Falha ao obter leaderboard:', error);
      if (error.message.includes('429')) {
        console.log('ℹ️ Erro de limite de taxa (429), tentando novamente em 5 segundos...');
        setTimeout(() => fetchLeaderboardAndRank(true), 5000);
      }
    }
  };

  useEffect(() => {
    if (ready) {
      console.log('ℹ️ Inicializando obtenção do leaderboard');
      fetchLeaderboardAndRank();
    }
  }, [ready]);

  useEffect(() => {
    let transactionQueue = [];
    let isProcessing = false;
    const isUserCancellationError = (error) => {
      const lowerMessage = error.message ? error.message.toLowerCase() : '';
      return (
        error.code === 4001 ||
        lowerMessage.includes('reject') ||
        lowerMessage.includes('cancel') ||
        lowerMessage.includes('exited_auth_flow') ||
        lowerMessage.includes('user rejected')
      );
    };
    const sendPrizeTransaction = async (prize, username) => {
      console.log('ℹ️ Iniciando sendPrizeTransaction, prêmio:', prize, 'username:', username);
      if (!monadWalletAddress || !isAddress(monadWalletAddress)) {
        console.error('❌ Endereço de carteira inválido:', monadWalletAddress);
        return;
      }
      const adjustedPrize = prize;
      console.log('ℹ️ Prêmio ajustado:', adjustedPrize);
      transactionQueue.push({ prize: adjustedPrize, username, player: monadWalletAddress });
      if (!isProcessing) {
        console.log('ℹ️ Iniciando processamento da fila de transações...');
        processQueue();
      }
    };
    const processQueue = async () => {
      if (isProcessing || transactionQueue.length === 0) {
        console.log('ℹ️ Processamento da fila parado: isProcessing=', isProcessing, 'queueLength=', transactionQueue.length);
        return;
      }
      isProcessing = true;
      const { prize, username, player } = transactionQueue.shift();
      console.log('ℹ️ Processando transação para prêmio:', prize, 'username:', username, 'player:', player);
      try {
        console.log('ℹ️ Enviando requisição para o endpoint record-prize');
        const recordPrizeResponse = await fetch(`${BACKEND_URL}/record-prize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ player, prize, username }),
        });
        if (!recordPrizeResponse.ok) {
          const errorData = await recordPrizeResponse.json();
          console.error('❌ Falha ao chamar record-prize, status:', recordPrizeResponse.status, 'mensagem:', errorData.error);
          throw new Error(`Failed to call record-prize: ${errorData.error}`);
        }
        const recordPrizeData = await recordPrizeResponse.json();
        console.log('✅ Transação record-prize enviada com sucesso:', recordPrizeData.hash);

        // Envia prize / 2 para o endpoint update-leaderboard
        console.log('ℹ️ Enviando requisição para o endpoint update-leaderboard com score:', Math.floor(prize / 2));
        const updateLeaderboardResponse = await fetch(`${BACKEND_URL}/update-leaderboard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ player, score: Math.floor(prize / 2) }),
        });
        if (!updateLeaderboardResponse.ok) {
          const errorData = await updateLeaderboardResponse.json();
          console.error('❌ Falha ao chamar update-leaderboard, status:', updateLeaderboardResponse.status, 'mensagem:', errorData.error);
          throw new Error(`Failed to call update-leaderboard: ${errorData.error}`);
        }
        const updateLeaderboardData = await updateLeaderboardResponse.json();
        console.log('✅ Transação update-leaderboard enviada com sucesso:', updateLeaderboardData.hash);

        window.dispatchEvent(new CustomEvent('prizeConfirmed', { detail: { prize } }));
        await fetchLeaderboardAndRank(true);
      } catch (error) {
        console.error('❌ Falha ao chamar backend:', error);
        if (!isUserCancellationError(error)) {
          console.log('ℹ️ Reenfileirando transação (não foi cancelamento do usuário)');
          transactionQueue.unshift({ prize, username, player });
        } else {
          console.log('ℹ️ Transação cancelada pelo usuário, não reenfileirando');
        }
      } finally {
        isProcessing = false;
        console.log('ℹ️ Processamento da fila finalizado, isProcessing:', isProcessing);
        if (transactionQueue.length > 0) {
          console.log('ℹ️ Processando próxima transação na fila...');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          processQueue();
        }
      }
    };
    const sendGameAction = async () => {
      console.log('ℹ️ Iniciando sendGameAction, endereço da carteira:', monadWalletAddress);
      if (!monadWalletAddress || !isAddress(monadWalletAddress)) {
        console.error('❌ Endereço de carteira inválido:', monadWalletAddress);
        return;
      }
      try {
        console.log('ℹ️ Enviando requisição para o endpoint game-action:', `${BACKEND_URL}/game-action`);
        const response = await fetch(`${BACKEND_URL}/game-action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ player: monadWalletAddress }),
        });
        const contentType = response.headers.get('content-type');
        console.log('ℹ️ Status da resposta:', response.status, 'Content-Type:', contentType);
        const text = await response.text();
        console.log('ℹ️ Resposta bruta:', text);
        if (!response.ok) {
          console.error('❌ Falha ao chamar backend, status:', response.status, 'resposta:', text);
          return;
        }
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ Resposta não é JSON:', contentType, 'resposta:', text);
          return;
        }
        const data = JSON.parse(text);
        console.log('✅ Transação de ação do jogo enviada com sucesso:', data.hash);
        return data;
      } catch (error) {
        console.error('❌ Falha ao processar ação do jogo:', error);
      }
    };
    window.sendPrizeTransaction = (prize, username) => {
      sendPrizeTransaction(prize, username);
    };
    window.sendGameAction = () => {
      sendGameAction();
    };
    const handlePrizeAwarded = (event) => {
      const prize = event.detail.prize;
      const eventUsername = event.detail.username || '';
      const currentUsername = username && username !== 'Unknown' ? username : eventUsername;
      console.log('ℹ️ Evento de prêmio recebido, prêmio:', prize, 'username do evento:', eventUsername, 'username atual:', currentUsername);
      if (typeof prize !== 'number' || prize <= 0) {
        console.warn('❌ Prêmio inválido, ignorando transação:', prize);
        return;
      }
      if (!currentUsername || currentUsername === 'Unknown' || currentUsername === '') {
        console.warn('❌ Username inválido, ignorando transação:', currentUsername);
        return;
      }
      console.log('✅ Prêmio e username válidos, prosseguindo com transação');
      window.sendPrizeTransaction(prize, currentUsername);
    };
    window.addEventListener('prizeAwarded', handlePrizeAwarded);
    return () => {
      window.removeEventListener('prizeAwarded', handlePrizeAwarded);
    };
  }, [authenticated, monadWalletAddress, username]);

  const buttonStyle = {
    width: '120px',
    padding: '10px 10px',
    marginBottom: '10px',
    background: 'linear-gradient(to bottom, #836EF9, #5B4FC0)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
    textAlign: 'center',
    overflow: 'hidden',
  };
  const monadButtonStyle = {
    width: '220px',
    padding: '10px 10px',
    marginBottom: '10px',
    background: 'linear-gradient(to bottom, #836EF9, #5B4FC0)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
    textAlign: 'center',
    overflow: 'hidden',
    position: 'absolute',
    top: '10px',
    left: '15px',
    zIndex: 2100,
  };
  const darkButtonStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    background: '#2a2a2a',
    border: '1px solid #5B4FC0',
    borderRadius: '8px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };
  const buttonHover = (e) => {
    e.target.style.background = 'linear-gradient(to bottom, #5B4FC0, #836EF9)';
  };
  const buttonHoverOut = (e) => {
    e.target.style.background = 'linear-gradient(to bottom, #836EF9, #5B4FC0)';
  };
  const darkButtonHover = (e) => {
    e.target.style.background = '#3a3a3a';
  };
  const darkButtonHoverOut = (e) => {
    e.target.style.background = '#2a2a2a';
  };
  const panelStyle = {
    background: '#1e1a2a',
    border: '1px solid #836EF9',
    borderRadius: '12px',
    padding: '15px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: !ready || !authenticated ? '220px' : '250px',
    height: !ready || !authenticated ? '100px' : '230px',
    zIndex: 2000,
    position: 'relative',
  };
  const dragHandleStyle = {
    cursor: 'grab',
    userSelect: 'none',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '0 0 10px 0',
    textAlign: 'center',
  };

  return (
    <Draggable handle=".drag-handle">
      <div style={panelStyle}>
        <div className="drag-handle" style={dragHandleStyle}>
          {authenticated ? 'Wallet Panel' : 'Connect Wallet'}
        </div>
        {!ready ? (
          <p>Loading...</p>
        ) : !authenticated ? (
          <button
            onClick={login}
            style={monadButtonStyle}
            onMouseOver={buttonHover}
            onMouseOut={buttonHoverOut}
          >
            Login with Monad Games ID
          </button>
        ) : (
          <>
            <WalletPanel
              walletAddress={monadWalletAddress}
              balance={balance}
              username={loadingUsername ? 'Loading...' : username}
              checkOwner={checkOwner}
              fundWallet={fundWallet}
            />
            <button
              onClick={logout}
              style={{ ...buttonStyle, marginTop: '15px' }}
              onMouseOver={buttonHover}
              onMouseOut={buttonHoverOut}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </Draggable>
  );
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  try {
    const rootElement = document.createElement('div');
    rootElement.id = 'privy-root';
    rootElement.style.position = 'absolute';
    rootElement.style.top = '20px';
    rootElement.style.right = '110px';
    rootElement.style.zIndex = '2000';
    document.body.appendChild(rootElement);
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <PrivyProvider
        appId="cmdzr65wr00aml40ccn0i4s3e"
        config={{
          loginMethodsAndOrder: {
            primary: ['privy:cmd8euall0037le0my79qpz42'],
            secondary: ['metamask', 'wallet_connect'],
          },
          appearance: {
            theme: 'dark',
            accentColor: '#836EF9',
          },
          embeddedWallets: {
            createOnLogin: 'off',
          },
          defaultChain: monadTestnet,
          supportedChains: [monadTestnet],
        }}
      >
        <PrivyConnect />
      </PrivyProvider>
    );
    console.log('✅ PrivyProvider rendered successfully');
  } catch (error) {
    console.error('❌ Failed to render PrivyProvider:', error);
  }
});