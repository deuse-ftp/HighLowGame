import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import Draggable from 'react-draggable';
import PrivyConnect from './components/PrivyConnect';
import { monadTestnet } from './config';

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