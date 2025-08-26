import React, { useState, useEffect } from 'react';
import { useLogin, usePrivy, useWallets, useCrossAppAccounts } from '@privy-io/react-auth';
import { isAddress, formatEther } from 'viem';
import WalletPanel from './WalletPanel';
import { monadTestnet, contractAddress, contractABI, publicClient, DEV_ADDRESS, BACKEND_URL } from '../config';

const PrivyConnectSecondary = () => {
  const { login } = useLogin({
    onComplete: (user, isNewUser, wasAlreadyAuthenticated, loginMethod) => {
      console.log('✅ Secondary User logged in:', user, 'Method:', loginMethod);
      window.dispatchEvent(new Event('walletConnected'));
      window.dispatchEvent(new Event('walletConnectedSecondary'));
      window.privyUserSecondary = user;
    },
    onError: (error) => {
      if (error !== 'exited_auth_flow') {
        console.error('❌ Secondary Login failed:', error);
        alert('Failed to log in to the secondary panel. Check the Privy Dashboard configuration or try again.');
      } else {
        console.log('ℹ️ Secondary User exited login flow, ignoring...');
      }
    },
  });
  const { authenticated, ready, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction: sendCrossAppTransaction } = useCrossAppAccounts();
  const [monadWalletAddress, setMonadWalletAddress] = useState('');
  const [username, setUsername] = useState('');
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [usernamesMap, setUsernamesMap] = useState(new Map());
  const [leaderboard, setLeaderboard] = useState(JSON.parse(localStorage.getItem('cachedLeaderboard') || '[]'));
  const [playerRank, setPlayerRank] = useState(JSON.parse(localStorage.getItem('cachedPlayerRank') || '{"rank": 0, "score": 0}'));
  const [balance, setBalance] = useState('0.000');
  const [lastLeaderboardUpdate, setLastLeaderboardUpdate] = useState(0);
  const [lastLeaderboardReset, setLastLeaderboardReset] = useState(0);
  const [lastTransactionTime, setLastTransactionTime] = useState(0);

  // Debounce function to limit transaction calls
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      const now = Date.now();
      if (now - lastTransactionTime < wait) {
        console.log('ℹ️ Transaction throttled, waiting...');
        return;
      }
      setLastTransactionTime(now);
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  useEffect(() => {
    if (!ready) {
      console.log('ℹ️ Secondary Privy not ready yet, waiting for initialization...');
      return;
    }
    if (authenticated && user && user.linkedAccounts.length > 0) {
      console.log('ℹ️ Secondary Checking linked accounts:', user.linkedAccounts);
      const crossAppAccount = user.linkedAccounts.find(
        (account) => account.type === 'cross_app' && account.providerApp.id === 'cmd8euall0037le0my79qpz42'
      );
      if (crossAppAccount && crossAppAccount.embeddedWallets.length > 0) {
        const address = crossAppAccount.embeddedWallets[0].address;
        console.log('✅ Secondary Embedded wallet address found:', address);
        setMonadWalletAddress(address);
        fetchUsername(address).then((newUsername) => {
          console.log('✅ Secondary Username fetched:', newUsername);
          setUsername(newUsername);
        });
      } else {
        console.error('❌ Secondary Monad Games ID account not found');
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

    const sendPrizeTransaction = debounce(async (prize, username) => {
      if (!monadWalletAddress || !isAddress(monadWalletAddress)) {
        console.error('❌ Invalid wallet address:', monadWalletAddress);
        return;
      }
      const adjustedPrize = Math.floor(prize / 2); // Divide by 2 for Monad Games ID
      window.dispatchEvent(new CustomEvent('localPrizeConfirmed', { detail: { prize } }));
      transactionQueue.push({ prize: adjustedPrize, username, player: monadWalletAddress });
      if (!isProcessing) {
        console.log('ℹ️ Starting transaction queue processing...');
        processQueue();
      }
    }, 700);

    const processQueue = async () => {
      if (isProcessing || transactionQueue.length === 0) {
        console.log('ℹ️ Queue processing stopped: isProcessing=', isProcessing, 'queueLength=', transactionQueue.length);
        return;
      }
      isProcessing = true;
      const { prize, username, player } = transactionQueue.shift();
      console.log('ℹ️ Processing transaction for prize:', prize, 'username:', username, 'player:', player);
      try {
        console.log('ℹ️ Sending request to record-prize endpoint');
        const response = await fetch(`${BACKEND_URL}/record-prize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ player, prize, username }),
        });
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Transaction sent successfully:', data.hash);
          window.dispatchEvent(new CustomEvent('prizeConfirmed', { detail: { prize } }));
          await fetchLeaderboardAndRank(true);
        } else {
          const errorData = await response.json();
          console.error('❌ Failed to call backend, status:', response.status, 'message:', errorData.error);
          throw new Error(errorData.error);
        }
      } catch (error) {
        console.error('❌ Failed to call backend:', error);
        if (!isUserCancellationError(error)) {
          console.log('ℹ️ Requeuing transaction (not user cancellation)');
          transactionQueue.unshift({ prize, username, player });
        } else {
          console.log('ℹ️ Transaction cancelled by user, not requeuing');
        }
      } finally {
        isProcessing = false;
        console.log('ℹ️ Queue processing finished, isProcessing:', isProcessing);
        if (transactionQueue.length > 0) {
          console.log('ℹ️ Processing next transaction in queue...');
          await new Promise((resolve) => setTimeout(resolve, 1000));
          processQueue();
        }
      }
    };

    const sendGameAction = debounce(async () => {
      console.log('ℹ️ Starting sendGameAction, wallet address:', monadWalletAddress);
      if (!monadWalletAddress || !isAddress(monadWalletAddress)) {
        console.error('❌ Invalid wallet address:', monadWalletAddress);
        return;
      }
      try {
        console.log('ℹ️ Sending request to game-action endpoint:', `${BACKEND_URL}/game-action`);
        const response = await fetch(`${BACKEND_URL}/game-action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ player: monadWalletAddress }),
        });
        const contentType = response.headers.get('content-type');
        console.log('ℹ️ Response status:', response.status, 'Content-Type:', contentType);
        const text = await response.text();
        console.log('ℹ️ Raw response:', text);
        if (!response.ok) {
          console.error('❌ Failed to call backend, status:', response.status, 'response:', text);
          throw new Error(`Failed to call backend, status: ${response.status}, response: ${text}`);
        }
        if (!contentType || !contentType.includes('application/json')) {
          console.error('❌ Response is not JSON:', contentType, 'response:', text);
          throw new Error('Response is not JSON');
        }
        const data = JSON.parse(text);
        console.log('✅ Game action transaction sent successfully:', data.hash);
        return data;
      } catch (error) {
        console.error('❌ Failed to process game action:', error);
        throw error;
      }
    }, 700);

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
      console.log('ℹ️ Prize event received, prize:', prize, 'event username:', eventUsername, 'current username:', currentUsername);
      if (typeof prize !== 'number' || prize <= 0) {
        console.warn('❌ Invalid prize, ignoring transaction:', prize);
        return;
      }
      if (!currentUsername || currentUsername === 'Unknown' || currentUsername === '') {
        console.warn('❌ Invalid username, ignoring transaction:', currentUsername);
        return;
      }
      console.log('✅ Valid prize and username, proceeding with transaction');
      window.sendPrizeTransaction(prize, currentUsername);
    };

    window.addEventListener('prizeAwarded', handlePrizeAwarded);

    return () => {
      window.removeEventListener('prizeAwarded', handlePrizeAwarded);
    };
  }, [authenticated, monadWalletAddress, username]);

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
      console.warn('❌ Secondary No wallet address provided for fetchUsername');
      return 'Unknown';
    }
    if (usernamesMap.has(walletAddress)) {
      const cachedUsername = usernamesMap.get(walletAddress);
      console.log('✅ Secondary Using cached username:', cachedUsername);
      return cachedUsername;
    }
    setLoadingUsername(true);
    try {
      const url = 'https://monad-games-id-site.vercel.app/api/check-wallet?wallet=' + walletAddress;
      console.log('ℹ️ Secondary Fetching username for:', walletAddress);
      const response = await fetch(url);
      const data = await response.json();
      console.log('ℹ️ Secondary API response:', data);
      if (response.ok && data.hasUsername && data.user?.username) {
        const newUsername = data.user.username;
        setUsernamesMap(prev => new Map(prev).set(walletAddress, newUsername));
        setUsername(newUsername);
        console.log('✅ Secondary Username fetched successfully:', newUsername);
        return newUsername;
      } else {
        console.warn('❌ Secondary Username not found for:', walletAddress);
        setUsernamesMap(prev => new Map(prev).set(walletAddress, 'Unknown'));
        setUsername('Unknown');
        return 'Unknown';
      }
    } catch (error) {
      console.error('❌ Secondary Failed to fetch username:', error);
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
        console.log('ℹ️ Using cached leaderboard:', leaderboard);
        // Multiply scores by 2 for local leaderboard display
        const adjustedLeaderboard = leaderboard.map(entry => ({
          ...entry,
          score: Number(entry.score) * 2
        }));
        window.dispatchEvent(
          new CustomEvent('leaderboardUpdated', {
            detail: {
              leaderboard: adjustedLeaderboard,
              playerRank: {
                ...playerRank,
                score: Number(playerRank.score) * 2
              }
            },
          })
        );
        if (monadWalletAddress && isAddress(monadWalletAddress)) {
          console.log('ℹ️ Updating player rank:', monadWalletAddress);
          const [rank, score] = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: 'getPlayerRank',
            args: [monadWalletAddress],
          });
          const updatedPlayerRank = { rank: Number(rank), score: Number(score) * 2 };
          console.log('✅ Player rank fetched successfully:', updatedPlayerRank);
          setPlayerRank({ rank: Number(rank), score: Number(score) });
          localStorage.setItem('cachedPlayerRank', JSON.stringify({ rank: Number(rank), score: Number(score) }));
          window.dispatchEvent(
            new CustomEvent('leaderboardUpdated', {
              detail: {
                leaderboard: adjustedLeaderboard,
                playerRank: updatedPlayerRank
              },
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
          score: Number(entry.score) * 2, // Multiply score by 2 for local display
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
          updatedPlayerRank = { rank: Number(rank), score: Number(score) * 2 }; // Multiply score by 2
          console.log('✅ Player rank fetched successfully:', updatedPlayerRank);
          setPlayerRank({ rank: Number(rank), score: Number(score) });
          localStorage.setItem('cachedPlayerRank', JSON.stringify({ rank: Number(rank), score: Number(score) }));
        } catch (error) {
          console.error('❌ Failed to fetch player rank for', monadWalletAddress, ':', error);
          const playerEntry = leaderboardData.find(entry => entry.player.toLowerCase() === monadWalletAddress.toLowerCase());
          if (playerEntry) {
            updatedPlayerRank = { rank: leaderboardData.indexOf(playerEntry) + 1, score: Number(playerEntry.score) };
            console.log('ℹ️ Using leaderboard data for player rank:', updatedPlayerRank);
            setPlayerRank({ rank: updatedPlayerRank.rank, score: playerEntry.score / 2 }); // Store original score
            localStorage.setItem('cachedPlayerRank', JSON.stringify({ rank: updatedPlayerRank.rank, score: playerEntry.score / 2 }));
          } else {
            console.warn('⚠️ Player not found in leaderboard, using default rank:', updatedPlayerRank);
          }
        }
      }
      window.dispatchEvent(
        new CustomEvent('leaderboardUpdated', {
          detail: { leaderboard: leaderboardData, playerRank: updatedPlayerRank },
        })
      );
      console.log('✅ Leaderboard fetched successfully:', leaderboardData);
      localStorage.setItem('cachedLeaderboard', JSON.stringify(leaderboardData.map(entry => ({
        ...entry,
        score: entry.score / 2 // Store original score in cache
      }))));
      setLeaderboard(leaderboardData.map(entry => ({
        ...entry,
        score: entry.score / 2 // Store original score in state
      })));
    } catch (error) {
      console.error('❌ Failed to fetch leaderboard:', error);
      if (error.message.includes('429')) {
        console.log('ℹ️ Rate limit error (429), retrying in 5 seconds...');
        setTimeout(() => fetchLeaderboardAndRank(true), 5000);
      }
    }
  };

  const buttonStyle = {
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
  };

  const panelStyle = {
    background: '#1e1a2a',
    border: '1px solid #836EF9',
    borderRadius: '12px',
    padding: '10px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: !ready || !authenticated ? '220px' : '250px',
    height: !ready || !authenticated ? '45px' : '150px',
    zIndex: 2100,
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(calc(-50% - 360px), calc(-50% - 200px))',
    transformOrigin: 'center center',
  };

  return (
    <>
      <style>
        {`
          .privy-secondary-panel {
            background: #1e1a2a;
            border: 1px solid #836EF9;
            border-radius: 12px;
            padding: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: ${!ready || !authenticated ? '220px' : '250px'};
            height: ${!ready || !authenticated ? '45px' : '150px'};
            z-index: 2100;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(calc(-50% - 360px), calc(-50% - 200px));
            transform-origin: center center;
          }
          .privy-secondary-panel.not-authenticated {
            justify-content: center;
            align-items: center;
          }
          .privy-secondary-button {
            width: 220px;
            padding: 10px 10px;
            margin-bottom: 10px;
            background: linear-gradient(to bottom, #836EF9, #5B4FC0);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
            text-align: center;
            overflow: hidden;
          }
          .not-authenticated .privy-secondary-button {
            margin-top: 5px;
            margin-bottom: 5px;
          }
          .logout-btn {
            font-size: 14px;
            padding: 10px;
          }
          @media (max-width: 600px) {
            .privy-secondary-panel {
              width: ${!ready || !authenticated ? '180px' : '230px'};
              height: ${!ready || !authenticated ? '40px' : '130px'};
              padding: 10px;
              transform: translate(calc(-50% - 0px), calc(-50% - 280px));
              gap: 8px;
            }
            .privy-secondary-panel.not-authenticated {
              justify-content: center;
              align-items: center;
            }
            .privy-secondary-button {
              width: 180px;
              padding: 8px 8px;
              font-size: 12px;
              margin-bottom: 8px;
            }
            .not-authenticated .privy-secondary-button {
              margin-top: 5px;
              margin-bottom: 5px;
            }
            .logout-btn {
              font-size: 12px !important;
              padding: 8px !important;
            }
          }
        `}
      </style>
      <div className={`privy-secondary-panel ${!ready || !authenticated ? 'not-authenticated' : ''}`}>
        {!ready ? (
          <p>Loading...</p>
        ) : !authenticated ? (
          <button
            onClick={login}
            className="privy-secondary-button"
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
              className="logout-btn"
              onClick={logout}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </>
  );

  function buttonHover(e) {
    e.target.style.background = 'linear-gradient(to bottom, #5B4FC0, #836EF9)';
  }

  function buttonHoverOut(e) {
    e.target.style.background = 'linear-gradient(to bottom, #836EF9, #5B4FC0)';
  }
};

export default PrivyConnectSecondary;