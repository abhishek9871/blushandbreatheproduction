
import { Env } from '../index';

export interface UnifiedProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    formattedPrice: string;
    images: string[];
    buyUrl: string;
    network: 'Rakuten' | 'PartnerStack' | 'Mock';
    merchant: string;
    rating?: number;
    reviewCount?: number;
}

interface ProxyRequest {
    network?: string;
    query?: string;
    category?: string;
    limit?: number;
}

/**
 * MOCK DATA - To be replaced with real API calls once keys are live.
 */
const MOCK_SAAS_PRODUCTS: UnifiedProduct[] = [
    {
        id: "ps_socialbee_01",
        name: "SocialBee - AI Social Media Management",
        description: "The top-rated AI-driven social media management tool for agencies. Schedule posts, curate content, and analyze performance.",
        price: 29.00,
        currency: "USD",
        formattedPrice: "$29.00/mo",
        images: ["https://pbs.twimg.com/profile_images/1612741750697201666/Jt7oXv_r_400x400.jpg"],
        buyUrl: "https://partnerstack.com/example/socialbee",
        network: "PartnerStack",
        merchant: "SocialBee",
        rating: 4.8,
        reviewCount: 1250
    },
    {
        id: "ps_synthflow_01",
        name: "Synthflow AI - Voice Assistants",
        description: "No-code AI voice assistants for dental clinics, salons, and real estate. Automate inbound calls instantly.",
        price: 99.00,
        currency: "USD",
        formattedPrice: "$99.00/mo",
        images: ["https://media.licdn.com/dms/image/D4E0BAQGv-X0X8Zg8wA/company-logo_200_200/0/1701968888888?e=2147483647&v=beta&t=example"],
        buyUrl: "https://partnerstack.com/example/synthflow",
        network: "PartnerStack",
        merchant: "Synthflow AI",
        rating: 4.9,
        reviewCount: 340
    }
];

const MOCK_BEAUTY_PRODUCTS: UnifiedProduct[] = [
    {
        id: "rak_sephora_01",
        name: "Dyson Airwrap Multi-Styler Complete Long",
        description: "The ultimate hair styling tool. Curl, shape, smooth, and hide flyaways with no extreme heat.",
        price: 599.00,
        currency: "USD",
        formattedPrice: "$599.00",
        images: ["https://www.sephora.com/productimages/sku/s2593093-main-zoom.jpg"],
        buyUrl: "https://click.linksynergy.com/mock/sephora/dyson",
        network: "Rakuten",
        merchant: "Sephora",
        rating: 4.7,
        reviewCount: 5800
    },
    {
        id: "rak_kiehls_01",
        name: "Kiehl's Ultra Facial Cream",
        description: "The #1 best-selling face cream. 24-hour hydration for softer, smoother skin.",
        price: 38.00,
        currency: "USD",
        formattedPrice: "$38.00",
        images: ["https://www.kiehls.com/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-kiehls-master-catalog/default/dw123456/face.jpg"],
        buyUrl: "https://click.linksynergy.com/mock/kiehls/cream",
        network: "Rakuten",
        merchant: "Kiehl's",
        rating: 4.6,
        reviewCount: 12000
    }
];

export async function handleProductRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const network = url.searchParams.get('network');
    const query = url.searchParams.get('query') || '';

    // CORS Headers
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    };

    try {
        // 1. If keys are present, attempt real API calls (Implementation logic to be added later)
        // Check env.PARTNERSTACK_API_KEY / env.RAKUTEN_TOKEN here.

        let results: UnifiedProduct[] = [];

        // 2. Filter Mock Data based on request
        if (network === 'PartnerStack' || query.toLowerCase().includes('ai')) {
            results = [...results, ...MOCK_SAAS_PRODUCTS];
        }

        if (network === 'Rakuten' || !network) {
            results = [...results, ...MOCK_BEAUTY_PRODUCTS];
        }

        // Simple mock search
        if (query) {
            const q = query.toLowerCase();
            results = results.filter(p =>
                p.name.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.merchant.toLowerCase().includes(q)
            );
        }

        return new Response(JSON.stringify({
            source: 'api-proxy',
            count: results.length,
            products: results
        }), { status: 200, headers });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
}
