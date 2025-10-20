// import { kv } from "@vercel/kv"; // ** REVERTING TO THIS SIMPLE IMPORT **
// import { Metadata } from "next";
// import { notFound } from "next/navigation";

// type Props = {
//   params: { id: string };
// };

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//   const linkData = await kv.get<{ recipient: string; amount: number; token: string; memo: string }>(`link:${params.id}`);

//   if (!linkData) {
//     return {};
//   }

//   const actionUrl = `/p/${params.id}/action.json`;

//   return {
//     title: `Pay ${linkData.amount} ${linkData.token}`,
//     other: {
//       "solana-action": actionUrl,
//     },
//   };
// }

// export default async function PaymentPage({ params }: Props) {
//   const linkData = await kv.get<{ recipient: string; amount: number; token: string; memo: string }>(`link:${params.id}`);

//   if (!linkData) {
//     notFound();
//   }

//   return (
//     <div className="flex flex-col min-h-screen bg-gray-800 text-white items-center justify-center p-4">
//       <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-8 text-center">
//         <h1 className="text-4xl font-bold mb-2">
//           {linkData.amount.toLocaleString()} {linkData.token}
//         </h1>
//         {linkData.memo && <p className="text-lg text-gray-400 mb-6">&quot;{linkData.memo}&quot;</p>}

//         <div className="text-left bg-gray-800 p-4 rounded-lg space-y-2 mb-8">
//           <p className="text-sm text-gray-500">You are paying:</p>
//           <p className="text-sm font-mono break-all">{linkData.recipient}</p>
//         </div>

//         <a
//           href={`solana-action:/p/${params.id}`}
//           className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 block"
//         >
//           Pay with Wallet
//         </a>
//       </div>
//     </div>
//   );
// }
// src/app/p/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Connection, Transaction, VersionedTransaction } from "@solana/web3.js";
import { useRouter } from "next/navigation";

type LinkData = {
  recipient: string;
  amount: number;
  token: string;
  memo: string;
};

type Props = {
  params: { id: string };
};

export default function PaymentPage({ params }: Props) {
  const [linkData, setLinkData] = useState<LinkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { publicKey, sendTransaction, wallet } = useWallet();
  const router = useRouter();

  useEffect(() => {
    // Fetch link data on mount
    fetch(`/p/${params.id}/action.json`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError("Payment link not found");
          setLoading(false);
          return;
        }
        // Parse the description to extract payment details
        // This is a workaround since we're using the action.json GET endpoint
        const match = data.description?.match(
          /pay ([\d.]+) (\w+) to ([A-Za-z0-9]+)/
        );
        if (match) {
          setLinkData({
            amount: parseFloat(match[1]),
            token: match[2],
            recipient: match[3],
            memo: data.description.includes("Memo:")
              ? data.description.split("Memo: ")[1]
              : "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load payment details");
        setLoading(false);
      });
  }, [params.id]);

  const handlePayment = async () => {
    if (!publicKey || !wallet) {
      setError("Please connect your wallet first");
      return;
    }

    setPaying(true);
    setError("");

    try {
      // Call the action.json POST endpoint to get the transaction
      const response = await fetch(`/p/${params.id}/action.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account: publicKey.toBase58(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create transaction");
      }

      // Deserialize the transaction
      const transactionBuffer = Buffer.from(data.transaction, "base64");
      const transaction = Transaction.from(transactionBuffer);

      // Connect to Solana
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_HOST ||
          "https://api.devnet.solana.com",
        "confirmed"
      );

      // Send the transaction
      const signature = await sendTransaction(transaction, connection);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      setSuccess(true);
      console.log("Transaction successful:", signature);
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-800 text-white items-center justify-center p-4">
        <div className="text-xl">Loading payment details...</div>
      </div>
    );
  }

  if (!linkData) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-800 text-white items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-8 text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-500">
            Payment Link Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            This payment link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-800 text-white items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold mb-4 text-green-500">
            Payment Successful!
          </h1>
          <p className="text-gray-400 mb-6">
            You paid {linkData.amount} {linkData.token}
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            Create Another Payment Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          {linkData.amount.toLocaleString()} {linkData.token}
        </h1>
        {linkData.memo && (
          <p className="text-lg text-gray-400 mb-6">
            &quot;{linkData.memo}&quot;
          </p>
        )}

        <div className="text-left bg-gray-800 p-4 rounded-lg space-y-2 mb-6">
          <p className="text-sm text-gray-500">You are paying:</p>
          <p className="text-sm font-mono break-all">{linkData.recipient}</p>
        </div>

        {!publicKey ? (
          <div>
            <p className="text-yellow-500 mb-4 text-sm">
              Connect your wallet to pay
            </p>
            <div className="flex justify-center">
              <WalletMultiButton />
            </div>
          </div>
        ) : (
          <button
            onClick={handlePayment}
            disabled={paying}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {paying ? "Processing..." : "Pay Now"}
          </button>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
