import React from 'react';
import { DailyBriefContent } from '../features/TerminalV2/components/DailyBriefContent';

const DailyAlphaTab = ({ lang = 'zh' }) => {
    return (
        <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
            <DailyBriefContent lang={lang} isModal={false} />
        </div>
    );
};

export default DailyAlphaTab;
