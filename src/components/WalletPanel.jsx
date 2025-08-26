import React, { useState } from 'react';
import { DEV_ADDRESS } from '../config';

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
    <div style={{ marginTop: '5px' }}>
      <style>
        {`
          @media (max-width: 600px) {
            .username-section {
              margin-top: -5px !important; /* Subir Username 5px no mobile */
            }
            .wallet-panel-connected {
              margin-top: 8px !important; /* Subir Connected 10px no mobile */
            }
          }
          @media (min-width: 601px) {
            .username-section {
              margin-top: 0px !important; /* Subir Username 10px no PC */
            }
            .wallet-panel-connected {
              margin-top: 15px !important; /* Subir Connected 15px no PC */
            }
          }
        `}
      </style>
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
        className="wallet-panel-connected"
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

export default WalletPanel;