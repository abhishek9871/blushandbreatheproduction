
import type { Article, Product, Tutorial, NutritionInfo, TipCard, Video } from '../types';
import { fetchPubMedArticles } from './pubmedService';

// Add contentType for better filtering
const mockArticles: (Article & { contentType: 'Article' })[] = [
    { id: 'article-1', title: 'The Benefits of a Mediterranean Diet', description: "Discover the science behind one of the world's healthiest eating patterns.", imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVSiaqsbqNrX4jiaPZ0NvqF3hy552KN1GT8cHPjdePvtzS9vlLeQEtsTf9e8kk4wRI1457r0lJQvbQ3JrfhGxQ_oAl1u8w-PqSBSQpliHPYQo9JxLtvyBodRktVNmgFQbzN2oLoNSW6eHmTZOf-vMHqfNkmR2s1nxy-NFY2znnYlEsq0dztVTnlxMrL8KGDDjZgXEIbw1KcrDPlTPii1_SAbaifUcf4mVyRLbHvHMa0L_kKnvNb2hcVHLsXCMSh3kjLXUOnXBkx-I', category: 'Nutrition', date: 'Oct 26, 2026', contentType: 'Article', content: 'The Mediterranean diet is a way of eating based on the traditional foods of countries surrounding the Mediterranean Sea. It is rich in fruits, vegetables, whole grains, legumes, nuts, seeds, and healthy fats like olive oil. Research has consistently shown that this diet is effective in reducing the risk of cardiovascular diseases, type 2 diabetes, and certain cancers. Unlike restrictive diets, it focuses on a balanced intake of delicious and wholesome foods, making it a sustainable and enjoyable lifestyle choice.' },
    { id: 'article-2', title: '10-Minute Workouts for a Busy Schedule', description: 'Stay active even on your busiest days with these quick and effective exercises.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkNWGcRpGNmlAzsiCMtbLmJKX5mw88GSwcwEuLlAqvDW5INwqoKR4Tv1Cyl_TqVpxh2MXHA7ne0YInWL8SDinHzoOaE-BjbutvHKOb81C5Erl-bJaVdLOSN-DOkeXm9JDLVGUeDgoWYRZ0x6ldBu3oabZavBeLd9lstr0HEaCsDCukgRLZCeatWaetTUXUYHdU8IGmfk9mfuHH0eivI8cSjVTcMGyoz2ETjsTVfEcAT0vEtnXqqd3lLpZBYpjV8Yxbdfl5gZaXAAo', category: 'Fitness', date: 'Oct 24, 2026', contentType: 'Article', content: 'Finding time to exercise can be challenging. However, even short 10-minute workouts can significantly benefit your health. High-Intensity Interval Training (HIIT) is particularly effective. A sample routine could include 45 seconds of jumping jacks, followed by 15 seconds of rest, then 45 seconds of push-ups, and so on, cycling through exercises like squats, lunges, and planks. These quick bursts of intense activity can boost your metabolism and improve cardiovascular health without requiring a large time commitment.'},
    { id: 'article-3', title: 'Mindfulness Techniques to Reduce Stress', description: 'Learn simple practices to calm your mind and improve your mental clarity.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRcGsc0ZS5Oj30-XLsYlWpfknq5w6fQBkePMnufBgeDH-Wa2GF5IG6Aj1Fx1f4kFIZRhDEPEEJkCX2uo-uK8uT7V47VE9KVfO3bh7yBhv0u22FOphaiSDj_KVgoQASnRJ5ZjDApS5Igcq6LwLvQVqQSzjMBq8Wv57c7ii5lDU8KG0xC_z4bm-or55m-MdHvT_TRCFH9iQDUf7P03gM9Ih364C8PxAEW0Ce5JDgoGPSxq2vt2zjltE4mk2edbPKuq2ZLISClJYyLjk', category: 'Mental Health', date: 'Oct 22, 2026', contentType: 'Article', content: 'Mindfulness is the practice of paying attention to the present moment without judgment. One simple technique is focused breathing. Sit in a comfortable position, close your eyes, and focus on your breath. Notice the sensation of the air entering and leaving your body. When your mind wanders, gently guide it back to your breath. Practicing this for just a few minutes each day can help reduce stress, improve focus, and promote a sense of calm and well-being.' },
    { id: 'article-4', title: 'Your Guide to a Healthy Skincare Routine', description: 'Build a routine that nourishes your skin and addresses your unique concerns.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5OO_wR_T0xWr1SWGR8a3BeE5i4NQ0FBYb9Xa4O2fa4pO84cFOARqxiex9DavT75iqNAKb-QTMN5ZjIIL1Xi5soF0jG3QSu-46zjmwkoBrcK4CIZwjYKTHm5SJF6VqJDUFXs10Goo42Pj_MHULFor8M4r_8BwQ98cAmeG23q417GApZWZXv_TXM4SKiB__rNMrIJYVoGPJH4qIaedg9ay2FxXhA2ewjJjNlMve34ifozlpWLgcjXUkLFfj5HvMrlTqqs_blKjki08', category: 'Skincare', date: 'Oct 20, 2026', contentType: 'Article', content: 'A great skincare routine has three main steps: cleansing, treating, and moisturizing. In the morning, use a gentle cleanser, apply a vitamin C serum for antioxidant protection, moisturize, and finish with a broad-spectrum sunscreen with at least SPF 30. In the evening, cleanse thoroughly (double cleanse if you wear makeup), apply targeted treatments like retinoids or acids, and use a richer moisturizer to repair your skin overnight. Consistency is key to seeing results.' },
    { id: 'article-5', title: 'Understanding the Importance of Hydration', description: "It's more than just quenching thirst. Learn the vital roles water plays in your body.", imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqwtxG1pU7fzqJpHpwjt0nltytChjY2iExuLnfbodxdvEkZQuCuiqiXwd24FoznUr7t1kRHm9YF5CWr8_FHvfvoRGoODdWZDqjWsUDey82D5Dufdw4lR1n_OtN9JvFTRWc5NG8Juem-TQ5uwsvr5LAfkyMRsIWZYJzHud2Iv9n1VqHMKGK2eDY9RWyH9QhBcD5HgMlQfdzG8LI-8syiAVZ58jGtRROkhpxkmQ0ZMp_PzI9lhv_JORm9A56-XfboAMLJrbpWvKpFmk', category: 'Nutrition', date: 'Oct 18, 2026', contentType: 'Article', content: 'Water is essential for nearly every bodily function. It helps regulate body temperature, lubricate joints, transport nutrients, and remove waste. Dehydration can lead to fatigue, headaches, and impaired cognitive function. While the "8 glasses a day" rule is a good guideline, individual needs vary. Listen to your body and drink when you feel thirsty. You can also get water from foods like fruits and vegetables.' },
    { id: 'article-6', title: 'How to Improve Your Sleep Quality', description: 'Tips and tricks to help you get the restorative sleep you need to thrive.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0lMnnEq45kj1Cpyv7rA2zUkEO16kA5sWX7lPdWQwaI4vQPbdoPL3QmMhtDucAC6ebthqwHalf6UYiGUAnKS8-B6jSIesnRSTIXsdi9fm2h9M1DUr47urWjYD2djRuB-gQfw6gTLMdTQX20j9x0JD2lpYMD83_XoaFjGXZlnF9yiABbszrJByKlCaB_QlobjXMY6LxnBDfKkDySjX4y1gMQxi42pc6zpxeTmSV5-F9wXezHWbRNJkGavhZzcIcu4bJVGea7M4lshw', category: 'Mental Health', date: 'Oct 16, 2026', contentType: 'Article', content: 'Quality sleep is crucial for physical and mental health. To improve your sleep, establish a consistent sleep schedule, even on weekends. Create a relaxing bedtime routine, such as reading a book or taking a warm bath. Make sure your bedroom is dark, quiet, and cool. Avoid caffeine and alcohol before bed, and limit screen time, as the blue light can interfere with your body\'s natural sleep-wake cycle.' },
    { id: 'article-7', title: '10 Foods That Boost Your Immune System', description: 'Strengthen your body\'s defenses with these nutrient-packed foods.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJp-28LBYFJ1Cj4zJHLleUXRS_g1I9R0NeS-Vko8xGDOF1tqT-7OlroH0FCqRvyApi1rqdoh3oef6NcKPsj3l7yCznI8xVFce03tFfJns67sNUaUGcF4Ae-kRQ_G2J7bg93PeJc2P2QKKzyHm1fkJP26Xt2Z3v9GZ3xUsX5RUhm9gG6WAYmg6-NSLmumr5wa6JNP1FlVGmEi0gHGeB4_DvrPc5rrJFsNHeMdA6Ur8BqAyHIcNDJMaRvuBktINraKsDKAXkwDHY23A', category: 'Nutrition', date: 'Oct 14, 2026', contentType: 'Article', content: 'A strong immune system is your first line of defense against illness. Foods rich in vitamin C, like citrus fruits and bell peppers, are powerful antioxidants. Zinc, found in nuts and beans, is essential for immune cell function. Fermented foods like yogurt and kefir provide probiotics that support gut health, a key component of your immune system. Including a variety of these foods in your diet can help keep you healthy.'},
    { id: 'article-8', title: 'Summer Beauty: How to Protect Your Skin', description: 'Keep your skin healthy and glowing all summer long with these essential tips.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBagE8cZ56M9DDneDGk8aHit6XDiw9OZf3zEMV50ib2GJ4nDIS6XId22zOFX1T5M7WIEJGZUf65QI6UUNzMDEuqE558xrGtTn9UN_-thDJzpO90uPN7fQFgQyyriiomYW2jQ_uKBYld2ZMrY4FUb4oCfgg3PNPj69ImxSQEYLHvE7AmRoCj6XSApi-gZmwKEenXBkQg9dZlioBC4XQSO9HJMw7JwEpAJt8o0pHqqlRcohi5sGouqyHEzUJX3zYp0Gffot9aRvdJ8es', category: 'Skincare', date: 'Oct 12, 2026', contentType: 'Article', content: 'Summer fun can be harsh on your skin. The most important step is to wear a broad-spectrum sunscreen with at least SPF 30 every day, and reapply every two hours. Opt for lightweight, oil-free moisturizers to avoid clogged pores. A vitamin C serum in the morning can help protect against environmental damage. After a day in the sun, soothe your skin with an aloe vera-based product to reduce inflammation.' },
];
const mockProducts: (Product & { contentType: 'Product' })[] = [
    { id: 'product-1', brand: 'GlowBrand', category: 'Serum', name: 'Radiant Glow Serum', rating: 4.5, reviews: 1289, price: 42.00, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBRBDPPSzNwx6znlaOY4mOANZ5-wbVAjT3fLlPobz56k1nIopQiL6iWB8QjeM5FtlH5YapZEDslWX0EEVGwmzLPfg33P0Q6lEB0ChslnROLrgCTOf2NIDiEc4PWKMoJCPEzK-4UBvpa3_maIrS4yfA73bQSLVMcplYPyF45lOY985jXe1EIfZSuRvSEPJ_jNpfUsEG6dhkeSvfrotlsjJrUFrzxh1VNWoHKHPj1sRq5IccfeudVwwfKTVpf7tRX7q6tNuyQfgKZfM', contentType: 'Product' },
    { id: 'product-2', brand: 'Chic Cosmetics', category: 'Lipstick', name: 'Velvet Matte Lipstick', rating: 5, reviews: 975, price: 28.50, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBFtZIJPl626hbLgOkbkeiV4CCTifxDXQ3UHPcrlcxvQM8xDzHxxLRABWFvBFw5LNKVKKvH5HE2WrF57JZXkzumpcYQfEoFXAhCh96QUGouSc4-oP10IJpMYnGzFsXZhyC9ID9mI7n-w8_wyXAXnwJR5nKPkuXBLGl9uqrzMAdVaIWONCa3iJXpOWYO3ok0huIh9KVIX1RR4YfgViYJy_WFWRL-8dW2l8f-aCZ5fVfZpaO5gcp_c5aHkabhvPxEMBbDSykWSn5orLc', contentType: 'Product' },
    { id: 'product-3', brand: 'Aura Beauty', category: 'Foundation', name: 'Flawless Finish Foundation', rating: 5, reviews: 2041, price: 55.00, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDW34SWvbtSRPOpYkwlq-Miocyd8qaKb10cANBKvkfIP5V93NnWgBWe2k5NsP2MN0hauSM28djIvlTi-Jaehn4wEZp1_nGOJdvD4d838PtvI1YFFQlu8ViJet-tlgomBc06nSvKq5R9mSoJzBroanhA4Zn8IzyJ65gTtjU6XRorxCxSQbjb2r0O52H7Kq_gfLNkIQKUj_7MQCmft-mi4H_qHcIQj8a1g0Q0_v2YtXaOYTHwAENhU3ElNsJTmDiO1RIsd2P0Rdhyn3Y', contentType: 'Product' },
    { id: 'product-4', brand: 'Vivid', category: 'Eyeshadow', name: 'Sunset Eyeshadow Palette', rating: 4.5, reviews: 892, price: 39.99, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDmxR7S5hn77FugnScpZ2cDe6evm6afeVPQ6tmEZaUJ18HNPN0NopYyNgLGCW-NmDGNYKBUSgps9stcL43WNH6qrdgCNd-8mMc0MDLHv8KMrTIKsWarl79Gh-aqs3AwWcDGZn0fvK6FfYCtWxX116UdJOimChOHEbRoMjjrDBaFTjI3fRe9SEUhNKDK492rCHFiFMxwkIuQ4GeK1xZKZOSN2IY3ngbw-_5wxKv6nO8m6IzK5MnBkby2DkDWW4Gj4K9fB-aYWmnTZ74', contentType: 'Product' },
];

const mockTutorials: (Tutorial & { contentType: 'Tutorial' })[] = [
    { id: 'tutorial-1', category: 'Tutorial', title: 'The Ultimate Guide to a Flawless Foundation Application', description: 'Learn the secrets to achieving a smooth, long-lasting base with our step-by-step tutorial.', date: 'Oct 26, 2026', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6-xEPzecn7NiNliI4HLn3dNxdZNRpvZsSVuozDRiRtrJnByQp41c5ZEHoyk7IgDUl8LWaax84Ij-7VVLl1xAWM3OtASJCh5sryTm3A49ZUQGXIVmkv27P5iA4hahGca66n-RWCwMr9SKwKsc5jlgJ4qnpTwjY_RL3ZHTm9yDBEMpGEFz8ZUHJrOhkwPf58Mky66r-cczBPm6LR0l4cuPrC9wMM_Jdlfz0TgBJlc48fEfrdzJpH9kVolTa-VJvJIeDSV1oHqpJPhI', contentType: 'Tutorial' },
    { id: 'tutorial-2', category: 'Tips', title: '5 Skincare Habits to Adopt for a Healthy Glow', description: 'Incorporate these simple yet effective habits into your daily routine for radiant skin.', date: 'Oct 22, 2026', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQWFHH7Uj3YuzhEn-6ae0Om0pEteTKpsLm_XTYpm7uRutmYK40Ww_OpL7I09nLmZZkBNsNjmPycFhyYR4xuT2ka9uxyfEgYmgKfdIZ-zfq7kYhP6yzUJPdlOKV8ClLv-_FLD5-vHc5UwVBQH8TX29Vc5igjCACUx9gG613TlcecmbvAxX3yyRc01B7ViuYeT5Z-fIOZeKW7UMNCZ7iQZg7dE0jkATs3del1-kP6l4d_FJyLfHW6wbEwe71tKEnAtHOqXjG4QaecJk', contentType: 'Tutorial' },
    { id: 'tutorial-3', category: 'Advice', title: 'How to Find Your Perfect Foundation Shade Online', description: "Shopping for foundation online can be tricky. Here's how to get it right every time.", date: 'Oct 19, 2026', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDCHrVXOfaPQY7Ha-bFDntBOWKAua5QrnOmgLikFb8ZlRNTb2aJCIdb9OAu_uZEHjUjWRyfFaIb1VAA6nRIJSdkWQ_KO_F_WcVdK1HojU52lznzfsgW8D3bstP7ko_ZdPJz6InXve_eTuTr2wR0nPglvBnaceUYHKBjzOu1okw3WcI_HrfwLiPmvt-jfZkUsiG4eYQqR5cS6fnTBPcqMkyFCWkgghMzrjIrrBjaqWkg7cM6mV1mcIcbxKVKr4Nyw9li3sTaQTaFwg4', contentType: 'Tutorial' },
];

const mockNutritionData: ((NutritionInfo | TipCard) & { contentType: 'Nutrition' })[] = [
    { id: 'nutrition-1', name: 'Avocado', description: 'A nutrient-dense fruit, rich in healthy fats, fiber, and essential vitamins.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB4eg0y_vwFIDzyQL7_Ip6-ndmNAGgAZGojP3QS_oncs6V-icTGsWPj-hJZyGEhQfByfP07uN0J-hy5orqUysBxyHiSmpEhJqlhQQimZDyROx8_Cec8EyV73cYsIqDcrXznH1psDFBFWCJds9zOhk1ZrjfgA7u4z5Punx4X9jItU-bMiBZZe0XK1nGSXe7FB5GDt-iXZvQbLVTX9XU_jX8nj19hIX3NM7OrXt9v-hh_P7e4ZKbo1apMIPBXMzdpHJQuokXVeLXT6Xw', nutrients: { protein: 2, carbs: 9, fats: 15 }, contentType: 'Nutrition' },
    { id: 'nutrition-2', type: 'tip', title: 'Stay Hydrated!', description: 'Drinking enough water daily is crucial.', icon: 'water_drop', contentType: 'Nutrition' },
    { id: 'nutrition-3', name: 'Blueberries', description: 'Packed with antioxidants and phytoflavinoids.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDaEdxTFfHMIWxbrOAHPINHcP6Zd78W15leTcEobS59GiO38qerAGBBMKA041PzmF_V_NA3r0ytpAFh8rgmmgSxfGbRcrCICvQGEs7slymFfSAFYlQtR_vbUBZ93i7MZ3xVLmDOGZad23Tyi4_WkSlwlLioNoeUQfQ1lamVcd0IWHFXAQZAtDa9h1vi8kh5GQPWcjs4c4ozSRsc7TY9kjpykOe_8e0UxsLu4KgAFd6kMdcDUSTAkGbC-nOHiUNUhOebWmqU6MnRj9w', nutrients: { protein: 0.7, carbs: 14, fats: 0.3 }, contentType: 'Nutrition' },
    { id: 'nutrition-4', name: 'Salmon', description: 'An excellent source of high-quality protein.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOFIt_z5kHzoGxewjL53LzWlN47-b2JlUbJnU4-uIW5yGT7MvzVuTCQGN0mD8SipOM9_YGAl81ODsRc_I2td7F_L7gXB738StFpNR8hVii-OG46AUBvW0SfaMMUEWmtme7_AmGFO8mZxCuWh-11ZCZ4bNqhOWTjKLOaYkn7t2eugZXhKACuQDTmTVobm2oom9weR1WyHrFjugu_95C5pWNjzS4Ls2mc0TkNiWjiIRiwiNry3k7YUCaBUi59gXqhS-nQCCEUUP7P88', nutrients: { protein: 20, carbs: 0, fats: 13 }, contentType: 'Nutrition' },
    { id: 'nutrition-5', name: 'Kale', description: 'A leafy green vegetable that is incredibly nutritious.', imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfGdNd2rhKvfGP-jhAhTuUaKvb2BshjON0zxMfqYUfdqW7ir0cagtgVRgs_yGEbjTQ2Sft1SpzPOBA7yqaqK5lNSG5hVJdP4-0MuEKE7fT9p45YO7MT4RJb5bFFVZwvAnYw2PrDp1Z2cqdBDez9MovynbvUegDrSwM5QIIvAJdQ5yAlNIJDaMey3b5harA1EALLRokUlHL9l_mN2W6t8wACJFTsDwY7UOt28d1hriU3emmOymChvpYJcmrjuNsABgxChENJwGc8Bg', nutrients: { protein: 4.3, carbs: 8.8, fats: 1.5 }, contentType: 'Nutrition' },
    { id: 'nutrition-6', type: 'tip', title: 'Mindful Eating', description: 'Pay attention to your food, from purchase to consumption.', icon: 'psychology', contentType: 'Nutrition' },
];
const mockVideos: (Video & { contentType: 'Video' })[] = Array.from({ length: 20 }).map((_, i) => ({
    id: `video-${i + 1}`,
    title: `Video Title ${i + 1}`,
    description: `This is a great video about health and beauty topic #${i + 1}.`,
    imageUrl: `https://picsum.photos/seed/${i+1}/400/225`,
    duration: `${Math.floor(Math.random() * 20 + 5)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    contentType: 'Video'
}));
// Fix: Export allMockData so it can be used in other modules like useBookmarks.
export const allMockData = [...mockArticles, ...mockProducts, ...mockTutorials, ...mockNutritionData, ...mockVideos];

// --- EXTERNAL API CONFIG ---
const NEWS_API_KEY = import.meta.env.VITE_NEWSAPI_KEY as string | undefined;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined;
const API_NINJAS_KEY = import.meta.env.VITE_API_NINJAS_KEY as string | undefined;
const IS_DEV = import.meta.env.DEV;

const NEWS_API_BASE_URL = IS_DEV ? '/newsapi/v2' : '/api/newsapi';
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';
const API_NINJAS_BASE_URL = IS_DEV ? '/ninjas' : '/api/ninjas';
const OPEN_BEAUTY_FACTS_BASE_URL = 'https://world.openbeautyfacts.org/cgi';

interface NewsApiArticle {
    url: string;
    title: string;
    description: string | null;
    urlToImage: string | null;
    publishedAt: string;
    content: string | null;
}

interface NewsApiResponse {
    status?: string;
    code?: string;
    message?: string;
    totalResults?: number;
    articles?: NewsApiArticle[];
}

interface YouTubeSearchItem {
    id: { videoId: string };
    snippet: {
        title: string;
        description: string;
        thumbnails: {
            default?: { url: string };
            medium?: { url: string };
            high?: { url: string };
        };
    };
}

interface YouTubeSearchResponse {
    items: YouTubeSearchItem[];
}

interface OpenBeautyFactsResponse {
    count?: number;
    page?: number;
    page_size?: number;
    products?: Array<{
        code?: string;
        brands?: string;
        product_name?: string;
        generic_name?: string;
        image_front_url?: string;
        image_url?: string;
        categories_tags?: string[];
    }>;
}

const cleanNewsApiText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text.replace(/\s*\[\+\d+\s*chars\]$/i, '').trim();
};

const fetchArticlesFromPubMed = async (page: number, pageSize: number): Promise<{ data: Article[]; hasMore: boolean }> => {
  try {
    const articles = await fetchPubMedArticles('health wellness beauty nutrition fitness mental', pageSize);
    return { data: articles, hasMore: false };
  } catch (error) {
    console.error('PubMed fetch failed:', error);
    return { data: [], hasMore: false };
  }
};

const fetchArticlesFromNewsAPI = async (page: number, pageSize: number): Promise<{ data: Article[]; hasMore: boolean }> => {
    const url = new URL(`${NEWS_API_BASE_URL}`, window.location.origin);

    url.searchParams.set('category', 'health');
    url.searchParams.set('language', 'en');
    url.searchParams.set('country', 'us');
    url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize));

    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status}`);
    }

    const json = await response.json() as NewsApiResponse;
    if (json.status === 'error') {
        console.error('NewsAPI responded with an error', { code: json.code, message: json.message });
        throw new Error(json.message || 'NewsAPI responded with an error');
    }
    const fallbackImage = mockArticles[0]?.imageUrl || '';

    const articles: Article[] = (json.articles || []).map((item) => ({
        id: item.url,
        title: item.title || 'Untitled article',
        description: cleanNewsApiText(item.description || item.content || ''),
        imageUrl: item.urlToImage || fallbackImage,
        category: 'Health',
        date: item.publishedAt || new Date().toISOString(),
        content: cleanNewsApiText(item.content || item.description || ''),
    }));

    const totalResults = json.totalResults ?? articles.length;
    const hasMore = page * pageSize < totalResults;
    return { data: articles, hasMore };
};

const fetchVideosFromYouTube = async (page: number, pageSize: number): Promise<{ data: Video[]; hasMore: boolean }> => {
    if (!YOUTUBE_API_KEY) {
        throw new Error('Missing YouTube API key');
    }

    const params = new URLSearchParams({
        part: 'snippet',
        type: 'video',
        q: 'health beauty skincare wellness nutrition',
        maxResults: String(pageSize),
        key: YOUTUBE_API_KEY,
    });

    const response = await fetch(`${YOUTUBE_API_BASE_URL}/search?${params.toString()}`);
    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
    }

    const json = await response.json() as { items: Array<{ id: { videoId: string }, snippet: { title: string, description: string, thumbnails: { medium?: { url: string }, high?: { url: string }, default?: { url: string } } } }> };
    const fallbackImage = mockVideos[0]?.imageUrl || '';

    const videos: Video[] = (json.items || []).map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        imageUrl:
            item.snippet.thumbnails.medium?.url ||
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.default?.url ||
            fallbackImage,
        duration: '10:00',
    }));

    const hasMore = videos.length === pageSize;
    return { data: videos, hasMore };
};

const fetchProductsFromOpenBeautyFacts = async (page: number, pageSize: number): Promise<{ data: Product[]; hasMore: boolean }> => {
    const params = new URLSearchParams({
        search_terms: 'makeup skincare beauty',
        search_simple: '1',
        action: 'process',
        page_size: String(pageSize),
        page: String(page),
        json: '1',
    });
    const url = `${OPEN_BEAUTY_FACTS_BASE_URL}/search.pl?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`OpenBeautyFacts error: ${response.status}`);
    }
    const json = await response.json() as OpenBeautyFactsResponse;
    const list = json.products || [];
    const products: Product[] = list.map((p, i) => {
        const brand = (p.brands || '').split(',')[0]?.trim() || 'Brand';
        const name = p.product_name || p.generic_name || 'Product';
        const img = p.image_front_url || p.image_url || mockProducts[0]?.imageUrl || '';
        const catTag = (p.categories_tags || []).find(t => t.startsWith('en:')) || '';
        const category = catTag ? catTag.replace('en:', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Beauty';
        const rating = 4 + ((i % 3) * 0.5);
        const reviews = 500 + (i * 7);
        const price = 12 + (i % 5) * 3;
        return { id: p.code || `${name}-${i}`, brand, category, name, rating, reviews, price, imageUrl: img } as Product;
    });
    const total = json.count ?? (page * pageSize + products.length);
    const hasMore = page * pageSize < total;
    return { data: products, hasMore };
};

const NUTRITION_FOODS = ['Avocado', 'Blueberries', 'Salmon', 'Kale', 'Almonds', 'Oats', 'Quinoa', 'Spinach'];

const fetchNutritionFromApiNinjas = async (page: number, pageSize: number): Promise<{ data: (NutritionInfo | TipCard)[]; hasMore: boolean }> => {
    const start = (page - 1) * pageSize;
    const foodsSlice = NUTRITION_FOODS.slice(start, start + pageSize);
    if (foodsSlice.length === 0) {
        return { data: [], hasMore: false };
    }

    const query = foodsSlice.join(',');
    const response = await fetch(`${API_NINJAS_BASE_URL}?query=${encodeURIComponent(query)}`);
    if (!response.ok) {
        throw new Error(`API Ninjas error: ${response.status}`);
    }
    const json = await response.json() as any[];
    const toNum = (v: any) => typeof v === 'number' ? v : (typeof v === 'string' ? Number.parseFloat(v) : 0);
    const data: NutritionInfo[] = json.map((item, index) => ({
        id: `${item.name || 'food'}-${start + index}`,
        name: item.name || 'Food',
        description: `Approximate nutrition facts per ${item.serving_size_g || 100}g of ${item.name || 'this food'}.`,
        imageUrl: '',
        nutrients: {
            protein: Number.isFinite(toNum(item.protein_g)) ? toNum(item.protein_g) : 0,
            carbs: Number.isFinite(toNum(item.carbohydrates_total_g)) ? toNum(item.carbohydrates_total_g) : 0,
            fats: Number.isFinite(toNum(item.fat_total_g)) ? toNum(item.fat_total_g) : 0,
        },
    }));
    const hasMore = start + pageSize < NUTRITION_FOODS.length;
    return { data, hasMore };
};

const API_CONFIG = {
    'articles': { ttl: 1000 * 60 * 60 * 24, fallbackData: mockArticles, pageSize: 20, total: mockArticles.length, limit: 100 },
    'products': { ttl: 1000 * 60 * 60 * 24 * 30, fallbackData: mockProducts, pageSize: 4, total: mockProducts.length, limit: Infinity },
    'tutorials': { ttl: 1000 * 60 * 60 * 24 * 30, fallbackData: mockTutorials, pageSize: 3, total: mockTutorials.length, limit: Infinity },
    'nutrition': { ttl: 1000 * 60 * 60 * 24 * 7, fallbackData: mockNutritionData, pageSize: 6, total: mockNutritionData.length, limit: 1000 },
    'videos': { ttl: 1000 * 60 * 60 * 24 * 7, fallbackData: mockVideos, pageSize: 8, total: mockVideos.length, limit: 100 },
};

type ApiResourceKey = keyof typeof API_CONFIG;

export const apiStatusEvent = new EventTarget();

const setCache = (key: string, data: unknown) => {
    try {
        const cacheEntry = { timestamp: Date.now(), data };
        localStorage.setItem(`api_cache_${key}`, JSON.stringify(cacheEntry));
    } catch (e) {
        console.error('Failed to write to localStorage', e);
    }
};

const getCache = <T>(key: string, ttl: number): T | null => {
    try {
        const cached = localStorage.getItem(`api_cache_${key}`);
        if (!cached) return null;
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp > ttl) {
            localStorage.removeItem(`api_cache_${key}`);
            return null;
        }
        return data as T;
    } catch (e) {
        console.error('Failed to read from localStorage', e);
        return null;
    }
};

const getRateLimitUsage = () => {
    try {
        const usage = localStorage.getItem('api_rate_limit_usage');
        return usage ? JSON.parse(usage) : {};
    } catch (e) {
        console.error('Failed to read rate limit usage from localStorage', e);
        return {};
    }
};

const trackRateLimit = (key: ApiResourceKey) => {
    try {
        const usage = getRateLimitUsage();
        if (!usage[key]) {
            usage[key] = { count: 0, reset: new Date().getTime() + 1000 * 60 * 60 * 24 };
        }
        if (new Date().getTime() > usage[key].reset) {
            usage[key].count = 0;
            usage[key].reset = new Date().getTime() + 1000 * 60 * 60 * 24;
        }
        const limit = API_CONFIG[key].limit;
        if (limit !== Infinity && usage[key].count >= limit) {
            localStorage.setItem('api_rate_limit_usage', JSON.stringify(usage));
            apiStatusEvent.dispatchEvent(new CustomEvent('update', { detail: getRateLimitStatus() }));
            return false;
        }
        usage[key].count += 1;
        localStorage.setItem('api_rate_limit_usage', JSON.stringify(usage));
        apiStatusEvent.dispatchEvent(new CustomEvent('update', { detail: getRateLimitStatus() }));
        return true;
    } catch (e) {
        console.error('Failed to write rate limit usage to localStorage', e);
        return true;
    }
};

export const getRateLimitStatus = () => {
    const usage = getRateLimitUsage();
    const initialValue = {} as Record<ApiResourceKey, { used: number, limit: number }>;
    return Object.keys(API_CONFIG).reduce((acc, key) => {
        const k = key as ApiResourceKey;
        const currentUsage = (usage as any)[k] as { count: number } | undefined;
        acc[k] = { used: currentUsage?.count || 0, limit: API_CONFIG[k].limit };
        return acc;
    }, initialValue);
};

const apiFetch = async <T>(key: ApiResourceKey, page: number = 1, retries = 3, delay = 500): Promise<{ data: T[], hasMore: boolean }> => {
    const withinLimit = trackRateLimit(key);
    if (!withinLimit) {
        throw new Error(`Rate limit exceeded for ${key}`);
    }
    const config = API_CONFIG[key];
    try {
        await new Promise(res => setTimeout(res, 300 + Math.random() * 500));
        switch (key) {
            case 'articles': {
                const newsResult = await fetchArticlesFromNewsAPI(page, Math.floor(config.pageSize * 0.7));
                const pubmedResult = await fetchArticlesFromPubMed(page, Math.floor(config.pageSize * 0.3));
                const combined = [...newsResult.data, ...pubmedResult.data];
                if (combined.length > 0) return { data: combined, hasMore: true } as unknown as { data: T[]; hasMore: boolean };
                const start = (page - 1) * config.pageSize;
                const end = start + config.pageSize;
                const data = config.fallbackData.slice(start, end) as T[];
                const hasMore = end < config.fallbackData.length;
                return { data, hasMore };
            }
            case 'products': return await fetchProductsFromOpenBeautyFacts(page, config.pageSize) as unknown as { data: T[]; hasMore: boolean };
            case 'videos': return await fetchVideosFromYouTube(page, config.pageSize) as unknown as { data: T[]; hasMore: boolean };
            case 'nutrition': return await fetchNutritionFromApiNinjas(page, config.pageSize) as unknown as { data: T[]; hasMore: boolean };
            default: {
                const start = (page - 1) * config.pageSize;
                const end = start + config.pageSize;
                const data = config.fallbackData.slice(start, end) as T[];
                const hasMore = end < config.fallbackData.length;
                return { data, hasMore };
            }
        }
    } catch (error) {
        console.error(`apiFetch error for ${key} (page ${page}, retries left ${retries}):`, error);
        if (retries > 0) {
            await new Promise(res => setTimeout(res, delay));
            return apiFetch(key, page, retries - 1, delay * 2);
        }
        console.error(`apiFetch giving up for ${key} after retries`, { key, page });
        throw error;
    }
};

const fetchDataWithCache = async <T>(key: ApiResourceKey, page: number = 1): Promise<{ data: T[], hasMore: boolean }> => {
    const cacheKey = `${key}_page_${page}`;
    const config = API_CONFIG[key];
    try {
        const v = localStorage.getItem('api_cache_version');
        if (v !== '4') {
            const toDelete: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('api_cache_')) toDelete.push(k);
            }
            toDelete.forEach(k => localStorage.removeItem(k));
            localStorage.setItem('api_cache_version', '4');
        }
    } catch (e) {}
    const cachedData = getCache<{ data: T[], hasMore: boolean }>(cacheKey, config.ttl);
    if (cachedData) {
        if (key === 'articles') {
            const sanitized = { ...cachedData, data: (cachedData.data as unknown as Article[]).map(sanitizeArticle) as unknown as T[] };
            return sanitized;
        }
        return cachedData;
    }
    try {
        const result = await apiFetch<T>(key, page);
        setCache(cacheKey, result);
        return result;
    } catch (error) {
        console.error(`fetchDataWithCache falling back to mock data for ${key} (page ${page}):`, error);
        const { fallbackData, pageSize } = config;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const data = fallbackData.slice(start, end) as T[];
        const hasMore = end < fallbackData.length;
        return { data, hasMore };
    }
};

export const getArticles = (page: number) => fetchDataWithCache<Article>('articles', page);
export const getProducts = (page: number) => fetchDataWithCache<Product>('products', page);
export const getTutorials = (page: number) => fetchDataWithCache<Tutorial>('tutorials', page);
export const getNutritionData = (page: number) => fetchDataWithCache<(NutritionInfo | TipCard)>('nutrition', page);
export const getVideos = (page: number) => fetchDataWithCache<Video>('videos', page);

export const getFeaturedArticles = async () => {
    try {
        const newsResult = await fetchArticlesFromNewsAPI(1, 3);
        // Cache featured articles so they can be found by getArticleById
        if (newsResult.data.length > 0) {
            setCache('featured_articles', newsResult.data);
        }
        return newsResult;
    } catch (error) {
        const fallback = mockArticles.slice(0, 3);
        return { data: fallback, hasMore: false };
    }
};

const sanitizeArticle = (a: Article): Article => ({
    ...a,
    content: cleanNewsApiText(a.content),
    description: cleanNewsApiText(a.description),
});

const findArticleInCacheById = (id: string): Article | undefined => {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('api_cache_articles_page_')) continue;
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            const data = parsed?.data?.data as Article[] | undefined;
            if (Array.isArray(data)) {
                const match = data.find(a => a.id === id);
                if (match) return sanitizeArticle(match);
            }
        }
    } catch (e) {
        console.error('Failed to search cached articles by id', e);
    }
    return undefined;
};

export const getArticleById = async (id: string): Promise<Article | undefined> => {
    await new Promise(res => setTimeout(res, 150));
    const cached = findArticleInCacheById(id);
    if (cached) return cached;
    
    // Check featured articles cache
    const featuredCache = getCache<Article[]>('featured_articles', API_CONFIG.articles.ttl);
    if (featuredCache) {
        const featured = featuredCache.find(a => a.id === id);
        if (featured) return sanitizeArticle(featured);
    }
    
    const fromMocks = allMockData.find(item => (item as any).id === id && (item as any).contentType === 'Article') as Article | undefined;
    if (fromMocks) return fromMocks;
    return mockArticles.find(article => article.id === id);
}

const findProductInCacheById = (id: string): Product | undefined => {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith('api_cache_products_page_')) continue;
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            const data = parsed?.data?.data as Product[] | undefined;
            if (Array.isArray(data)) {
                const match = data.find(p => p.id === id);
                if (match) return match;
            }
        }
    } catch (e) {
        console.error('Failed to search cached products by id', e);
    }
    return undefined;
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
    await new Promise(res => setTimeout(res, 100));
    const cached = findProductInCacheById(id);
    if (cached) return cached;
    const fromMocks = (API_CONFIG.products.fallbackData as Product[]).find(p => p.id === id);
    return fromMocks;
}

export const searchAll = async (query: string, filters: { type: string, sort: string }) => {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();
    
    let results = allMockData.filter(item => {
        const typeMatch = filters.type === 'All' || item.contentType === filters.type;
        const queryMatch = JSON.stringify(item).toLowerCase().includes(lowerQuery);
        return typeMatch && queryMatch;
    });

    if (filters.sort === 'Newest') {
        results = results.sort((a, b) => {
            const dateA = (a as Article).date ? new Date( (a as Article).date).getTime() : 0;
            const dateB = (b as Article).date ? new Date( (b as Article).date).getTime() : 0;
            return dateB - dateA;
        });
    }

    return results;
};