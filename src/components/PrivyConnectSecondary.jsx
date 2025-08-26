import React, { useState, useEffect } from 'react';
import { useLogin, usePrivy, useWallets } from '@privy-io/react-auth';
import { isAddress } from 'viem';
import WalletPanel from './WalletPanel';
import { monadTestnet, contractAddress, contractABI, publicClient, DEV_ADDRESS, BACKEND_URL } from '../config';

const PrivyConnectSecondary = () => {
  const { login } = useLogin({
    onComplete: (user, isNewUser, wasAlreadyAuthenticated, loginMethod) => {
      console.log('✅ Secondary User logged in:', user, 'Method:', loginMethod);
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
  const [monadWalletAddress, setMonadWalletAddress] = useState('');
  const [username, setUsername] = useState('');
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [usernamesMap, setUsernamesMap] = useState(new Map());

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
  }, [ready, authenticated, user]);

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
              transform: translate(calc(-50% - 30px), calc(-50% - 285px));
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
              balance={'0.000'} // Balance fetching not implemented for secondary panel
              username={loadingUsername ? 'Loading...' : username}
              checkOwner={() => alert('Check Owner not available in secondary panel')}
              fundWallet={() => alert('Fund Wallet not available in secondary panel')}
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