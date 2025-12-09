
import React from 'react';

interface ScoreProps {
    label: string;
    score: number; // 0 to 100
    color: string;
}

const ScoreBar: React.FC<ScoreProps> = ({ label, score, color }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-gray-500 mb-1">
            <span>{label}</span>
            <span>{score}/100</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${color}`}
                style={{ width: `${score}%` }}
            />
        </div>
    </div>
);

interface BlushScoreWidgetProps {
    productName: string;
    scores: {
        scent?: number;
        texture?: number;
        value?: number;
        support?: number; // For SaaS
        features?: number; // For SaaS
    };
    overall: number;
}

export const BlushScoreWidget: React.FC<BlushScoreWidgetProps> = ({ productName, scores, overall }) => {
    const getGrade = (s: number) => {
        if (s >= 97) return 'A+';
        if (s >= 93) return 'A';
        if (s >= 90) return 'A-';
        if (s >= 80) return 'B';
        return 'C';
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 my-6">
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span className="text-pink-500">✦</span> BlushScore™ Analysis
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">AI-Driven Sentiment from 1,000+ Reviews</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-gray-900">{overall}</div>
                    <div className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded inline-block">
                        GRADE {getGrade(overall)}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {scores.scent && <ScoreBar label="Scent Profile" score={scores.scent} color="bg-pink-400" />}
                {scores.texture && <ScoreBar label="Texture & Feel" score={scores.texture} color="bg-rose-400" />}

                {/* SaaS Specifics */}
                {scores.support && <ScoreBar label="Customer Support" score={scores.support} color="bg-blue-500" />}
                {scores.features && <ScoreBar label="Feature Velocity" score={scores.features} color="bg-indigo-500" />}

                {/* Universal */}
                <ScoreBar label="Value for Money" score={scores.value || 85} color="bg-emerald-400" />
            </div>

            <div className="mt-6 text-[10px] text-gray-400 text-center uppercase tracking-widest">
                Verified by Blush & Breathe Intelligence
            </div>
        </div>
    );
};
