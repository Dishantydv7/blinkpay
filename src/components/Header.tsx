// src/components/Header.tsx
"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const Header = () => {
  return (
    <header className="p-4 flex justify-between items-center bg-gray-900 text-white shadow-md">
      <h1 className="text-2xl font-bold">BlinkPay ⚡️</h1>
      <WalletMultiButton />
    </header>
  );
};

export default Header;