
import React, { useState, useEffect } from 'react';
import { subscribeToLogs, clearLogs, addDebugLog } from '../utils/logger';
import { X, Copy, Trash2, Activity } from 'lucide-react';

export function MobileDebugOverlay() {
    const [logs, setLogs] = useState([]);
    const [isVisible, setIsVisible] = useState(true); // Default to true for now to ensure user sees it
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        return subscribeToLogs((newLogs) => {
            setLogs(newLogs);
        });
    }, []);

    const copyLogs = () => {
        const text = logs.map(l => `[${l.timestamp}] ${l.type.toUpperCase()}: ${l.message}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            addDebugLog('Logs copied to clipboard', 'success');
        }).catch(err => {
            addDebugLog('Failed to copy logs: ' + err, 'error');
        });
    };

    if (!isVisible) return null;

    if (!isExpanded) {
        return (
            <button
                onClick={() => setIsExpanded(true)}
                className="fixed bottom-4 right-4 z-[9999] p-3 bg-red-600 text-white rounded-full shadow-lg border border-red-400 animate-pulse"
                title="Open Debug Console"
            >
                <Activity size={24} />
            </button>
        );
    }

    return (
        <div className="fixed inset-x-0 bottom-0 h-1/2 bg-black/95 text-green-400 font-mono text-[10px] z-[9999] border-t-2 border-red-500 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1 bg-gray-900 border-b border-gray-800">
                <span className="font-bold text-red-500">MOBILE DEBUG CONSOLE</span>
                <div className="flex items-center gap-2">
                    <button onClick={copyLogs} className="p-1 hover:text-white"><Copy size={16} /></button>
                    <button onClick={clearLogs} className="p-1 hover:text-white"><Trash2 size={16} /></button>
                    <button onClick={() => setIsExpanded(false)} className="p-1 hover:text-white"><X size={16} /></button>
                </div>
            </div>

            {/* Log Content */}
            <div className="flex-1 overflow-auto p-2 scrollbar-thin scrollbar-thumb-gray-700">
                {logs.length === 0 && <div className="text-gray-500 italic">No logs yet...</div>}

                {logs.map(log => (
                    <div key={log.id} className={`mb-1 break-words ${getErrorColor(log.type)} border-b border-white/5 pb-1`}>
                        <span className="opacity-50">[{log.timestamp}]</span>{' '}
                        <span>{log.message}</span>
                    </div>
                ))}
            </div>

            {/* Connection Info Footer */}
            <div className="bg-gray-900 p-1 text-[9px] text-gray-500 flex justify-between">
                <span>Screen: {window.innerWidth}x{window.innerHeight}</span>
                <span>User Agent: {navigator.userAgent.slice(0, 20)}...</span>
            </div>
        </div>
    );
}

function getErrorColor(type) {
    switch (type) {
        case 'error': return 'text-red-400 font-bold';
        case 'warning': return 'text-yellow-400';
        case 'success': return 'text-green-400';
        default: return 'text-gray-300';
    }
}
