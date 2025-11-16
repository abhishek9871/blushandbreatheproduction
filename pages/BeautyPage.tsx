import React from 'react';
import { useApi } from '../hooks/useApi';
import { getProducts, getTutorials } from '../services/apiService';
import ProductCard from '../components/ProductCard';
import TutorialCard from '../components/TutorialCard';
import ErrorMessage from '../components/ErrorMessage';
import ProductCardSkeleton from '../components/skeletons/ProductCardSkeleton';

const BeautyPage: React.FC = () => {
    const { data: products, loading: productsLoading, error: productsError } = useApi(getProducts as any);
    const { data: tutorials, loading: tutorialsLoading, error: tutorialsError } = useApi(getTutorials as any);
    
    return (
        <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-wrap justify-between gap-3 p-4">
                    <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">Explore Beauty</h1>
                </div>
                <div className="px-4 py-3">
                    <div className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[350px] shadow-lg" style={{backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 45%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuB3vWry0ADnDb4qb-nmzYUqtGd8cUKP3ivi6v-s6SESkAVC6jTvDK4nPjl8XFw_naL42QrA7vOLCKTW54XZ3vIZ6hg_d17PW6pgc7lb03yvRXXPAM4L8tBC4MF611rcGaGZas09_zRy5Fb6tqoI9mdvhsMhopeCdC-CDF7ehl-Pf8OqiRKKo-mBPGBCtejDXPgHMj1VFhQnKsqLTvCunTLYyRfQhtXC0QtBkziEownLbOw4yyVZoLhWdV-f4DvtCG66IgABFCziNF0")'}}>
                        <div className="flex p-8">
                            <p className="text-white tracking-light text-4xl font-bold leading-tight max-w-lg">Glow Up: Discover Your Perfect Shade</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 px-4 py-6 overflow-x-auto">
                    <button className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <p className="text-sm font-medium leading-normal">Category</p>
                        <span className="material-symbols-outlined text-xl">expand_more</span>
                    </button>
                    <button className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <p className="text-sm font-medium leading-normal">Brand</p>
                        <span className="material-symbols-outlined text-xl">expand_more</span>
                    </button>
                    <button className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark px-4 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <p className="text-sm font-medium leading-normal">Price</p>
                        <span className="material-symbols-outlined text-xl">expand_more</span>
                    </button>
                    <button className="flex h-11 shrink-0 items-center justify-center gap-x-2 rounded-full bg-secondary/20 text-text-light dark:text-text-dark border border-secondary/30 px-4 hover:bg-secondary/40 transition-colors">
                        <p className="text-sm font-medium leading-normal">Sort By: Popularity</p>
                        <span className="material-symbols-outlined text-xl">expand_more</span>
                    </button>
                </div>

                <section className="py-8">
                    <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-5">Featured Products</h2>
                    {productsError && <ErrorMessage message={productsError} />}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                        {productsLoading
                            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                            : products.map(product => <ProductCard key={product.id} product={product} />)
                        }
                    </div>
                </section>

                <section className="py-8">
                    <h2 className="text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-5">Latest Tips & Tutorials</h2>
                    {tutorialsError && <ErrorMessage message={tutorialsError} />}
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                       {tutorialsLoading
                            ? Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />) // Re-using for similar layout
                            : tutorials.map(tutorial => <TutorialCard key={tutorial.id} tutorial={tutorial} />)
                       }
                    </div>
                </section>
            </div>
        </>
    );
};

export default BeautyPage;
