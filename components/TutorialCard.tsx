
import React from 'react';
import type { Tutorial } from '../types';

const TutorialCard: React.FC<{ tutorial: Tutorial }> = ({ tutorial }) => {
    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-video w-full overflow-hidden bg-gray-100">
                <img alt={tutorial.title} className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300" src={tutorial.imageUrl} />
            </div>
            <div className="flex flex-1 flex-col justify-between p-4">
                <div>
                    <span className="inline-block bg-secondary/20 text-primary-darker font-semibold text-xs px-2 py-1 rounded-full mb-2">{tutorial.category}</span>
                    <h3 className="font-semibold text-lg leading-tight">{tutorial.title}</h3>
                    <p className="text-sm text-text-subtle-light dark:text-text-subtle-dark mt-2">{tutorial.description}</p>
                </div>
                <p className="text-xs text-text-subtle-light dark:text-text-subtle-dark mt-4">{tutorial.date}</p>
            </div>
        </div>
    );
};

export default TutorialCard;
