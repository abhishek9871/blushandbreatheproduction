
import React from 'react';
import type { NutritionInfo, TipCard } from '../types';

const NutrientBar: React.FC<{ label: string; value: number; max: number }> = ({ label, value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-bold leading-normal tracking-[0.015em]">{label}</p>
            <div className="h-2 flex-1 bg-border-light dark:bg-border-dark rounded-full overflow-hidden">
                <div className="bg-accent h-full" style={{ width: `${percentage}%` }}></div>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">{value}g</p>
        </>
    );
};

const NutritionInfoCard: React.FC<{ item: NutritionInfo }> = ({ item }) => {
    return (
        <div className="flex flex-col rounded-xl shadow-md transition-shadow hover:shadow-xl bg-white dark:bg-[#1C2C1F] overflow-hidden">
            <div className="w-full bg-center bg-no-repeat aspect-video bg-cover" style={{ backgroundImage: `url(${item.imageUrl})` }}></div>
            <div className="flex w-full grow flex-col items-stretch justify-start p-6 gap-4">
                <h3 className="text-text-light dark:text-text-dark text-2xl font-bold leading-tight tracking-[-0.015em]">{item.name}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-base font-normal leading-normal">{item.description}</p>
                <div className="flex flex-col gap-3 pt-2">
                    <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">Key Nutrients (per 100g)</p>
                    <div className="grid gap-x-4 gap-y-3 grid-cols-[auto_1fr_auto] items-center py-2">
                        <NutrientBar label="PROTEIN" value={item.nutrients.protein} max={25} />
                        <NutrientBar label="CARBS" value={item.nutrients.carbs} max={20} />
                        <NutrientBar label="FATS" value={item.nutrients.fats} max={20} />
                    </div>
                </div>
                <div className="pt-2">
                    <button className="flex w-full max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-4 bg-accent text-text-light text-sm font-bold leading-normal transition-opacity hover:opacity-90">
                        <span className="truncate">Learn More</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

const NutritionTipCard: React.FC<{ item: TipCard }> = ({ item }) => {
    return (
        <div className="flex flex-col rounded-xl shadow-md transition-shadow hover:shadow-xl bg-white dark:bg-[#1C2C1F] overflow-hidden p-6 gap-4 items-start">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-accent text-3xl">{item.icon}</span>
            </div>
            <h3 className="text-text-light dark:text-text-dark text-2xl font-bold leading-tight tracking-[-0.015em]">{item.title}</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-base font-normal leading-normal flex-grow">{item.description}</p>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-4 bg-accent text-text-light text-sm font-bold leading-normal transition-opacity hover:opacity-90 mt-auto">
                <span className="truncate">Read Tip</span>
            </button>
        </div>
    );
};

const NutritionCard: React.FC<{ item: NutritionInfo | TipCard }> = ({ item }) => {
    if ('type' in item && item.type === 'tip') {
        return <NutritionTipCard item={item} />;
    }
    return <NutritionInfoCard item={item as NutritionInfo} />;
};

export default NutritionCard;
