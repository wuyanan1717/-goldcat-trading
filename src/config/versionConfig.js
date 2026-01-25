/**
 * Feature Version Control System
 * 
 * This file manages version isolation for features in the application.
 * Use this to safely roll out new versions and maintain rollback capability.
 */

// Feature version configuration
export const FEATURE_VERSIONS = {
    QUANTUM_OBSERVER: {
        current: 'v3', // ROLLBACK: V4 has performance issues, using stable V3
        available: ['v3', 'v4'],
        rolloutPercentage: 100,
        description: 'Quantum Observer - Advanced market analysis with AI'
    }
};

/**
 * Get active version for a feature
 * @param {string} featureName - Feature key from FEATURE_VERSIONS
 * @param {string} userId - Optional user ID for gradual rollout
 * @returns {string} Active version ('v3' or 'v4')
 */
export const getFeatureVersion = (featureName, userId = null) => {
    const config = FEATURE_VERSIONS[featureName];
    if (!config) {
        console.warn(`Unknown feature: ${featureName}, defaulting to v3`);
        return 'v3'; // Safe default fallback
    }

    // Support gradual rollout based on user ID
    if (config.rolloutPercentage < 100 && userId) {
        const userHash = hashUserId(userId);
        const inRollout = (userHash % 100) < config.rolloutPercentage;
        return inRollout ? config.current : 'v3';
    }

    return config.current;
};

/**
 * Simple hash function for user ID (for consistent rollout)
 * @param {string} userId 
 * @returns {number}
 */
function hashUserId(userId) {
    if (!userId) return 0;
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        const char = userId.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Get all active versions (for debugging/monitoring)
 */
export const getActiveVersions = () => {
    return Object.entries(FEATURE_VERSIONS).map(([feature, config]) => ({
        feature,
        version: config.current,
        rollout: config.rolloutPercentage
    }));
};

// Export for admin/debug purposes
export const setFeatureVersion = (featureName, version) => {
    if (FEATURE_VERSIONS[featureName] && FEATURE_VERSIONS[featureName].available.includes(version)) {
        FEATURE_VERSIONS[featureName].current = version;
        console.log(`✓ Feature ${featureName} switched to ${version}`);
        return true;
    }
    console.error(`✗ Invalid version ${version} for feature ${featureName}`);
    return false;
};
