import React from 'react';
import { DailyBriefContent } from './DailyBriefContent';

export const DailyBriefModalBilingual = ({ isOpen, onClose, lang = 'zh' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <DailyBriefContent lang={lang} onClose={onClose} isModal={true} />
        </div>
    );
};
