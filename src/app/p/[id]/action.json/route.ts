// src/app/p/[id]/action.json/route.ts
import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { USDC_MINT, USDC_DECIMALS } from '@/lib/constants';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
} from '@solana/spl-token';

// GET function remains the same
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const linkData = await kv.get<{ recipient: string; amount: number; token: string; memo: string }>(`link:${params.id}`);

  if (!linkData) {
    return new NextResponse('Link not found', { status: 404 });
  }

  const payload = {
    icon: "https://i.ibb.co/LrwBvL2/blinkpay-logo.png",
    title: `BlinkPay: Pay ${linkData.amount} ${linkData.token}`,
    description: `You are about to pay ${linkData.amount} ${linkData.token} to ${linkData.recipient}. Memo: ${linkData.memo || 'No memo'}`,
    label: "Pay Now",
  };

  return NextResponse.json(payload);
}

// POST function is now upgraded
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { account } = await req.json(); // Payer's address
    const linkData = await kv.get<{ recipient: string; amount: number; token: string; memo: string }>(`link:${params.id}`);
    
    if (!linkData || !account) {
      return new NextResponse('Invalid request', { status: 400 });
    }

    const connection = new Connection(process.env.SOLANA_RPC_HOST || "https://api.devnet.solana.com", "confirmed");

    const transaction = new Transaction();
    const recipient = new PublicKey(linkData.recipient);
    const payer = new PublicKey(account);

    if (linkData.token === 'SOL') {
      // Logic for SOL transfer
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: payer,
          toPubkey: recipient,
          lamports: linkData.amount * LAMPORTS_PER_SOL,
        })
      );
    } else if (linkData.token === 'USDC') {
      // ** NEW LOGIC FOR USDC TRANSFER **

      // 1. Get the Associated Token Accounts (ATAs)
      const payerAta = await getAssociatedTokenAddress(USDC_MINT, payer);
      const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipient);

      // 2. Check if the recipient's ATA exists
      let recipientAtaInfo;
      try {
        recipientAtaInfo = await getAccount(connection, recipientAta);
      } catch (error) {
        // `getAccount` throws an error if the account doesn't exist
        recipientAtaInfo = null;
      }

      // 3. If recipient's ATA doesn't exist, add an instruction to create it
      if (recipientAtaInfo === null) {
        transaction.add(
          createAssociatedTokenAccountInstruction(
            payer,          // Payer (pays for the account creation)
            recipientAta,   // New ATA address
            recipient,      // Owner of the new ATA
            USDC_MINT       // Token mint
          )
        );
      }

      // 4. Add the token transfer instruction
      transaction.add(
        createTransferInstruction(
          payerAta,                                         // Payer's ATA
          recipientAta,                                     // Recipient's ATA
          payer,                                            // Payer (owner of the source ATA)
          linkData.amount * Math.pow(10, USDC_DECIMALS)     // Amount, adjusted for decimals
        )
      );
    } else {
      return new NextResponse('Token not supported', { status: 400 });
    }

    // Set the fee payer and get a recent blockhash
    transaction.feePayer = payer;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // Serialize the transaction
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
    const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

    return NextResponse.json({ transaction: base64Transaction });

  } catch (err) {
    console.error(err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
// import { kv } from '@vercel/kv';
// import { NextRequest, NextResponse } from 'next/server';
// import {
//   Connection,
//   SystemProgram,
//   Transaction,
//   PublicKey,
//   LAMPORTS_PER_SOL,
// } from '@solana/web3.js';

// interface LinkData {
//   recipient: string;
//   amount: number;
//   token: string;
//   memo: string;
// }

// interface ErrorResponse {
//   error: string;
//   code: string;
// }

// export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const linkData = await kv.get<LinkData>(`link:${params.id}`);

//     if (!linkData) {
//       return NextResponse.json({ 
//         error: 'Payment link not found', 
//         code: 'LINK_NOT_FOUND' 
//       }, { 
//         status: 404 
//       });
//     }

//     // Validate the link data
//     if (!linkData.recipient || !linkData.amount || !linkData.token) {
//       return NextResponse.json({ 
//         error: 'Invalid payment link data', 
//         code: 'INVALID_LINK_DATA' 
//       }, { 
//         status: 400 
//       });
//     }

//     // Validate recipient address
//     try {
//       new PublicKey(linkData.recipient);
//     } catch {
//       return NextResponse.json({ 
//         error: 'Invalid recipient address in link', 
//         code: 'INVALID_RECIPIENT' 
//       }, { 
//         status: 400 
//       });
//     }

//     const payload = {
//       icon: "https://i.ibb.co/LrwBvL2/blinkpay-logo.png",
//       title: `BlinkPay: Pay ${linkData.amount} ${linkData.token}`,
//       description: `You are about to pay ${linkData.amount} ${linkData.token} to ${linkData.recipient}. ${linkData.memo ? `Memo: ${linkData.memo}` : ''}`,
//       label: "Pay Now",
//     };

//     return NextResponse.json(payload);
//   } catch (err) {
//     console.error('Error fetching payment link:', err);
//     return NextResponse.json({ 
//       error: 'Internal server error', 
//       code: 'INTERNAL_ERROR' 
//     }, { 
//       status: 500 
//     });
//   }
// }

// export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
//   try {
//     const { account } = await req.json();
    
//     // Input validation
//     if (!account || typeof account !== 'string') {
//       return NextResponse.json({ 
//         error: 'Invalid account address', 
//         code: 'INVALID_ACCOUNT' 
//       }, { 
//         status: 400 
//       });
//     }

//     // Validate public key format
//     try {
//       new PublicKey(account);
//     } catch {
//       return NextResponse.json({ 
//         error: 'Invalid Solana address format', 
//         code: 'INVALID_ADDRESS_FORMAT' 
//       }, { 
//         status: 400 
//       });
//     }

//     const linkData = await kv.get<LinkData>(`link:${params.id}`);
    
//     if (!linkData) {
//       return NextResponse.json({ 
//         error: 'Payment link not found', 
//         code: 'LINK_NOT_FOUND' 
//       }, { 
//         status: 404 
//       });
//     }

//     // Validate amount
//     if (linkData.amount <= 0) {
//       return NextResponse.json({ 
//         error: 'Invalid payment amount', 
//         code: 'INVALID_AMOUNT' 
//       }, { 
//         status: 400 
//       });
//     }

//     const connection = new Connection(
//       process.env.SOLANA_RPC_HOST || "https://api.devnet.solana.com",
//       { commitment: 'confirmed' }
//     );

//     const payer = new PublicKey(account);
//     const recipient = new PublicKey(linkData.recipient);

//     // Check payer balance
//     const balance = await connection.getBalance(payer);
//     const requiredAmount = linkData.amount * LAMPORTS_PER_SOL;
    
//     if (balance < requiredAmount) {
//       return NextResponse.json({ 
//         error: 'Insufficient balance', 
//         code: 'INSUFFICIENT_BALANCE' 
//       }, { 
//         status: 400 
//       });
//     }

//     const transaction = new Transaction();

//     if (linkData.token === 'SOL') {
//       transaction.add(
//         SystemProgram.transfer({
//           fromPubkey: payer,
//           toPubkey: recipient,
//           lamports: requiredAmount,
//         })
//       );
//     } else {
//       return NextResponse.json({ 
//         error: 'Only SOL transfers are supported', 
//         code: 'UNSUPPORTED_TOKEN' 
//       }, { 
//         status: 501 
//       });
//     }

//     transaction.feePayer = payer;
    
//     const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
//     transaction.recentBlockhash = blockhash;
//     transaction.lastValidBlockHeight = lastValidBlockHeight;

//     const serializedTransaction = transaction.serialize({ 
//       requireAllSignatures: false,
//       verifySignatures: false 
//     });
    
//     const base64Transaction = Buffer.from(serializedTransaction).toString('base64');

//     return NextResponse.json({ 
//       transaction: base64Transaction,
//       lastValidBlockHeight
//     });

//   } catch (err) {
//     console.error('Payment processing error:', err);
//     return NextResponse.json({ 
//       error: 'Internal server error', 
//       code: 'INTERNAL_ERROR' 
//     }, { 
//       status: 500 
//     });
//   }
// }
