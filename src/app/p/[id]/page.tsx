// // src/app/p/[id]/page.tsx
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
import { kv } from "@vercel/kv";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// **THE CHANGE IS HERE:** We get the base URL from our environment variables
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const linkData = await kv.get<{ recipient: string; amount: number; token: string; memo: string }>(`link:${params.id}`);

  if (!linkData) {
    return {};
  }
  
  // **THE CHANGE IS HERE:** We create a full, absolute URL
  const actionUrl = `${SITE_URL}/p/${params.id}/action.json`;

  return {
    title: `Pay ${linkData.amount} ${linkData.token}`,
    other: {
      // This now provides the full URL
      "solana-action": actionUrl,
    },
  };
}

export default async function PaymentPage({ params }: Props) {
  const linkData = await kv.get<{ recipient: string; amount: number; token: string; memo: string }>(`link:${params.id}`);

  if (!linkData) {
    notFound();
  }

  // We also create the full URL for the fallback button
  const actionUrl = `${SITE_URL}/p/${params.id}/action.json`;

  return (
    <div className="flex flex-col min-h-screen bg-gray-800 text-white items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-4xl font-bold mb-2">
          {linkData.amount.toLocaleString()} {linkData.token}
        </h1>
        {linkData.memo && <p className="text-lg text-gray-400 mb-6">&quot;{linkData.memo}&quot;</p>}
        
        <div className="text-left bg-gray-800 p-4 rounded-lg space-y-2 mb-8">
          <p className="text-sm text-gray-500">You are paying:</p>
          <p className="text-sm font-mono break-all">{linkData.recipient}</p>
        </div>

        {/* This link is now a full, absolute URL */}
        <a 
          href={`solana-action:${actionUrl}`} // Note the "solana-action:" protocol
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 block"
        >
          Pay with Wallet
        </a>
      </div>
    </div>
  );
}