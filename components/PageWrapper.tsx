
import React, { ReactNode } from 'react';

const PageWrapper: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <div className="page-fade-in">
            {children}
        </div>
    );
};

export default PageWrapper;
