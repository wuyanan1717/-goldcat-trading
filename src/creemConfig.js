// Creem Payment Configuration
// 支付配置

export const CREEM_CONFIG = {
    // 测试环境（开发时使用）
    TEST: {
        PRODUCT_ID: 'prod_2493rLO59EuzEVCJbnBxhk',
        CHECKOUT_URL: 'https://www.creem.io/test/payment/prod_2493rLO59EuzEVCJbnBxhk',
    },

    // 生产环境（正式上线后使用）
    PRODUCTION: {
        PRODUCT_ID: 'prod_2eQVR7OEf1I3N4Ji34KPlJ', // 正式环境 Product ID
        CHECKOUT_URL: 'https://buy.stripe.com/5kQ00jbqxdXu38D01ubAs00', // Stripe 正式环境 Checkout URL ($39)
    },

    // 当前使用的环境（切换这里即可）
    // 'TEST' 或 'PRODUCTION'
    CURRENT_ENV: 'PRODUCTION',
};

// 获取当前Checkout URL的辅助函数
export const getCheckoutUrl = (userEmail, userId) => {
    const config = CREEM_CONFIG[CREEM_CONFIG.CURRENT_ENV];

    // 将用户邮箱作为参数传递（用于 Creem 识别客户）
    const url = new URL(config.CHECKOUT_URL);
    if (userEmail) {
        url.searchParams.set('email', userEmail);
        url.searchParams.set('prefilled_email', userEmail);
        url.searchParams.set('customer_email', userEmail);
    }

    // 关键：传递 User ID 用于 Webhook 精确匹配 (Stripe client_reference_id)
    if (userId) {
        url.searchParams.set('client_reference_id', userId);
    }

    return url.toString();
};
