
const listeners = new Set();
const logs = [];

export function subscribeToLogs(callback) {
    listeners.add(callback);
    callback([...logs]); // Initial call
    return () => listeners.delete(callback);
}

export function addDebugLog(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8); // HH:mm:ss
    const logEntry = {
        id: Date.now() + Math.random(),
        timestamp,
        message: typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message),
        type
    };

    logs.push(logEntry);
    if (logs.length > 50) logs.shift(); // Keep last 50 logs

    // Notify listeners
    listeners.forEach(listener => listener([...logs]));

    // Also log to browser console
    if (type === 'error') {
        console.error('[MobileDebug]', message);
    } else {
        console.log('[MobileDebug]', message);
    }
}

export function clearLogs() {
    logs.length = 0;
    listeners.forEach(listener => listener([...logs]));
}
