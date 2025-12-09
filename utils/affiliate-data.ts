
export interface AffiliateProduct {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: string;
    image: string;
    buyUrl: string;
    pros: string[];
    cons: string[];
    blushScore: {
        overall: number;
        value: number;
        features?: number;
        support?: number;
        scent?: number;
        texture?: number;
    };
}

export const SAAS_PRODUCTS: Record<string, AffiliateProduct> = {
    "socialbee": {
        id: "socialbee",
        name: "SocialBee",
        slug: "socialbee",
        description: "AI-driven social media management for agencies and solopreneurs.",
        price: "$29/mo",
        image: "https://pbs.twimg.com/profile_images/1612741750697201666/Jt7oXv_r_400x400.jpg",
        buyUrl: "https://partnerstack.com/example/socialbee",
        pros: ["Category-based scheduling", "AI Content Generation", "Canva Integration"],
        cons: ["Slight learning curve", "Mobile app is basic"],
        blushScore: { overall: 96, value: 98, features: 95, support: 99 }
    },
    "synthflow": {
        id: "synthflow",
        name: "Synthflow AI",
        slug: "synthflow",
        description: "No-code Voice AI Assistants to automate inbound calls.",
        price: "$99/mo",
        image: "https://media.licdn.com/dms/image/D4E0BAQGv-X0X8Zg8wA/company-logo_200_200/0/1701968888888?e=2147483647&v=beta&t=example",
        buyUrl: "https://partnerstack.com/example/synthflow",
        pros: ["Real-time latency", "No coding required", "Zapier Integration"],
        cons: ["Newer platform", "Higher starting price"],
        blushScore: { overall: 94, value: 90, features: 98, support: 92 }
    },
    "hootsuite": {
        id: "hootsuite",
        name: "Hootsuite",
        slug: "hootsuite",
        description: "Enterprise social media management platform.",
        price: "$99/mo",
        image: "https://yt3.googleusercontent.com/ytc/AIdro_kKkC_s5j9M5j9M5j9M5j9M5j9M5j9M5j9M=s900-c-k-c0x00ffffff-no-rj",
        buyUrl: "#",
        pros: ["Enterprise features", "Huge integration library"],
        cons: ["Extremely expensive", "Outdated UI", "Poor support"],
        blushScore: { overall: 72, value: 60, features: 85, support: 65 }
    }
};

export const BEAUTY_PRODUCTS: Record<string, AffiliateProduct> = {
    "dyson-airwrap": {
        id: "dyson-airwrap",
        name: "Dyson Airwrap",
        slug: "dyson-airwrap",
        description: "The viral multi-styler using Coanda airflow.",
        price: "$599",
        image: "https://www.sephora.com/productimages/sku/s2593093-main-zoom.jpg",
        buyUrl: "https://rakuten.com/example/dyson",
        pros: ["No heat damage", "Incredible curls", "Luxury build"],
        cons: ["Very expensive", "Learning curve"],
        blushScore: { overall: 98, value: 85, scent: 100, texture: 100 } // Scent/Texture n/a but using for score
    },
    "shark-flexstyle": {
        id: "shark-flexstyle",
        name: "Shark FlexStyle",
        slug: "shark-flexstyle",
        description: "The affordable dupe for the Airwrap.",
        price: "$299",
        image: "https://m.media-amazon.com/images/I/71R1R2R1R2L._AC_SL1500_.jpg",
        buyUrl: "https://rakuten.com/example/shark",
        pros: ["Great price", "Powerful airflow", "Rotatable head"],
        cons: ["Louder", "Gets hotter"],
        blushScore: { overall: 91, value: 99, scent: 90, texture: 90 }
    }
};
