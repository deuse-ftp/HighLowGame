import React from 'react';
import ReactDOM from 'react-dom/client';
import { PrivyProvider } from '@privy-io/react-auth';
import Draggable from 'react-draggable';
import PrivyConnect from './components/PrivyConnect';
import PrivyConnectSecondary from './components/PrivyConnectSecondary';
import { monadTestnet } from './config';
import './styles/game.css';

document.addEventListener('DOMContentLoaded', () => {
  try {
    // Primary PrivyConnect panel (desabilitado)
    /*
    const rootElement = document.createElement('div');
    rootElement.id = 'privy-root';
    rootElement.style.position = 'absolute';
    rootElement.style.zIndex = '2100';
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
    */

    // Secondary PrivyConnect panel
    const secondaryRootElement = document.createElement('div');
    secondaryRootElement.id = 'privy-root-secondary';
    secondaryRootElement.style.position = 'absolute';
    secondaryRootElement.style.zIndex = '2100';
    document.body.appendChild(secondaryRootElement);
    const secondaryRoot = ReactDOM.createRoot(secondaryRootElement);

    secondaryRoot.render(
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
        <PrivyConnectSecondary />
      </PrivyProvider>
    );

    console.log('✅ Secondary PrivyProvider rendered successfully');
  } catch (error) {
    console.error('❌ Failed to render PrivyProvider:', error);
  }
});