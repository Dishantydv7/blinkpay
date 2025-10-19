
// src/app/api/create-link/route.ts
import { kv } from '@vercel/kv'; // ** REVERTING TO THIS SIMPLE IMPORT **
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipient, token, amount, memo } = body;

    if (!recipient || !token || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const uniqueId = Math.random().toString(36).substring(2, 10);

    await kv.set(`link:${uniqueId}`, {
      recipient,
      token,
      amount: parseFloat(amount),
      memo,
    });
    
    const url = new URL(req.url);
    const link = `${url.origin}/p/${uniqueId}`;

    return NextResponse.json({ link });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
// src/app/api/create-link/route.ts
// import { createClient } from '@vercel/kv';
// import { NextRequest, NextResponse } from 'next/server';

// // ** THE CHANGE IS HERE **
// // Initialize the KV client with the new Upstash environment variables
// const kv = createClient({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { recipient, token, amount, memo } = body;

//     if (!recipient || !token || !amount) {
//       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
//     }

//     const uniqueId = Math.random().toString(36).substring(2, 10);

//     await kv.set(`link:${uniqueId}`, {
//       recipient,
//       token,
//       amount: parseFloat(amount),
//       memo,
//     });
    
//     const url = new URL(req.url);
//     const link = `${url.origin}/p/${uniqueId}`;

//     return NextResponse.json({ link });

//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }
// src/app/api/create-link/route.ts
// import { kv } from '@vercel/kv';
// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { recipient, token, amount, memo } = body;

//     // Basic validation
//     if (!recipient || !token || !amount) {
//       return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
//     }

//     // Generate a unique ID for the link
//     const uniqueId = Math.random().toString(36).substring(2, 10);

//     // Store the payment details in Vercel KV
//     await kv.set(`link:${uniqueId}`, {
//       recipient,
//       token,
//       amount: parseFloat(amount),
//       memo,
//     });
    
//     // Construct the full link URL
//     const url = new URL(req.url);
//     const link = `${url.origin}/p/${uniqueId}`;

//     return NextResponse.json({ link });

//   } catch (error) {
//     console.error(error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }
// }