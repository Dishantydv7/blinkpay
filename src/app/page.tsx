"use client";

import { useState } from "react";
import Header from "@/components/Header";
import { useWallet } from "@solana/wallet-adapter-react";

export default function HomePage() {
  const [token, setToken] = useState("SOL");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { connected, publicKey } = useWallet();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!connected || !publicKey) {
      setError("Please connect your wallet first!");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedLink("");

    try {
      const response = await fetch('/api/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: publicKey.toBase58(),
          token,
          amount,
          memo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedLink(data.link);
      } else {
        setError(data.error || 'Failed to create link.');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-6">
          {!generatedLink ? (
            <>
              <h2 className="text-2xl font-bold text-center mb-2">Create a Payment Link</h2>
              <p className="text-center text-gray-400 mb-6">Enter the details below to generate your shareable link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="token" className="block text-sm font-medium text-gray-300">Token</label>
                  <select 
                    id="token" 
                    name="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Amount</label>
                  <input 
                    type="number" 
                    id="amount"
                    name="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="0.5"
                    step="any"
                  />
                </div>

                <div>
                  <label htmlFor="memo" className="block text-sm font-medium text-gray-300">Memo (Optional)</label>
                  <input 
                    type="text" 
                    id="memo"
                    name="memo"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., For coffee"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-500"
                  disabled={loading || !connected}
                >
                  {loading ? "Generating..." : "Generate Link"}
                </button>

                {!connected && (
                  <p className="text-center text-yellow-500 text-sm mt-2">
                    Connect your wallet to generate a link.
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-center mb-4">Link Generated!</h2>
              <div className="p-4 bg-gray-800 rounded-md break-words mb-4">
                <code>{generatedLink}</code>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  alert("Copied to clipboard!");
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 mb-2"
              >
                Copy Link
              </button>
              <button
                onClick={() => setGeneratedLink("")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Create Another Link
              </button>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-center mt-4">{error}</p>
          )}
        </div>
      </main>
    </div>
  );
}

// src/app/page.tsx
// import Header from "@/components/Header";

// export default function HomePage() {
//   return (
//     <div className="flex flex-col min-h-screen bg-gray-800 text-white">
//       <Header />
//       <main className="flex flex-1 flex-col items-center justify-center p-4">
//         <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-6">
//           <h2 className="text-2xl font-bold text-center mb-2">Create a Payment Link</h2>
//           <p className="text-center text-gray-400 mb-6">Enter the details below to generate your shareable link.</p>

//           {/* --- PAYMENT FORM --- */}
//           <form className="space-y-4">
//             <div>
//               <label htmlFor="token" className="block text-sm font-medium text-gray-300">Token</label>
//               <select 
//                 id="token" 
//                 name="token"
//                 className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
//               >
//                 <option value="SOL">SOL</option>
//                 <option value="USDC">USDC</option>
//               </select>
//             </div>
            
//             <div>
//               <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Amount</label>
//               <input 
//                 type="number" 
//                 id="amount"
//                 name="amount"
//                 className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
//                 placeholder="0.5"
//               />
//             </div>

//             <div>
//               <label htmlFor="memo" className="block text-sm font-medium text-gray-300">Memo (Optional)</label>
//               <input 
//                 type="text" 
//                 id="memo"
//                 name="memo"
//                 className="mt-1 block w-full bg-gray-800 border-gray-700 rounded-md shadow-sm p-2 focus:ring-purple-500 focus:border-purple-500"
//                 placeholder="e.g., For coffee"
//               />
//             </div>

//             <button 
//               type="submit"
//               className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
//             >
//               Generate Link
//             </button>
//           </form>
//           {/* --- END PAYMENT FORM --- */}

//         </div>
//       </main>
//     </div>
//   );
// }
// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
//       <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
//           <li className="mb-2 tracking-[-.01em]">
//             Get started by editing{" "}
//             <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
//               src/app/page.tsx
//             </code>
//             .
//           </li>
//           <li className="tracking-[-.01em]">
//             Save and see your changes instantly.
//           </li>
//         </ol>

//         <div className="flex gap-4 items-center flex-col sm:flex-row">
//           <a
//             className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }

