import { kv } from "@vercel/kv";
import { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const linkData = await kv.get<{
    recipient: string;
    amount: number;
    token: string;
    memo: string;
  }>(`link:${params.id}`);

  if (!linkData) {
    return {
      title: "Payment Link - BlinkPay",
    };
  }

  const actionUrl = `${SITE_URL}/p/${params.id}/action.json`;

  return {
    title: `Pay ${linkData.amount} ${linkData.token} - BlinkPay`,
    description: `Pay ${linkData.amount} ${linkData.token}${
      linkData.memo ? ` - ${linkData.memo}` : ""
    }`,
    openGraph: {
      title: `Pay ${linkData.amount} ${linkData.token}`,
      description:
        linkData.memo ||
        `Payment request for ${linkData.amount} ${linkData.token}`,
      images: ["https://i.ibb.co/LrwBvL2/blinkpay-logo.png"],
    },
    other: {
      "solana:action": actionUrl,
      "og:type": "website",
    },
  };
}

export default function PaymentLayout({ children }: Props) {
  return <>{children}</>;
}
