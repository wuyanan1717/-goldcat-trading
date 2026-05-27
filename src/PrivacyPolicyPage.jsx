import React from 'react';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage = ({ language, onBack }) => {
    const content = {
        zh: {
            title: "隐私政策（2026版）",
            lastUpdated: "最后更新：2026年5月1日",
            sections: [
                {
                    title: "1. 引言",
                    content: "GoldCat Terminal（以下简称\"我们\"）重视您的隐私。本隐私政策说明了当您使用我们的交易日志和风险分析服务时，我们如何收集、使用和保护您的信息。"
                },
                {
                    title: "2. 适用地区与合规提示",
                    content: "本服务不向中华人民共和国大陆地区居民提供。中国大陆用户访问须自行了解并遵守当地法律法规。若您所在地区对加密货币相关活动有限制，请勿继续使用本服务。"
                },
                {
                    title: "3. 我们收集的信息",
                    content: "我们收集以下信息：",
                    list: [
                        "账户信息：电子邮件地址用于身份验证",
                        "交易数据：您手动输入的交易记录、分析和笔记",
                        "使用数据：服务使用统计和交互信息",
                        "支付信息：由第三方支付处理商（Stripe）安全处理"
                    ]
                },
                {
                    title: "4. 信息使用方式",
                    content: "我们使用收集的信息用于：",
                    list: [
                        "提供和维护服务",
                        "处理付款和管理订阅",
                        "改进服务质量和功能",
                        "与您沟通服务更新",
                        "确保平台安全并防止滥用"
                    ]
                },
                {
                    title: "5. 数据存储与安全",
                    content: "您的数据通过 Supabase 安全存储，采用行级安全（RLS）策略确保只有您可以访问自己的数据。我们实施适当的技术和组织措施来保护您的个人信息。"
                },
                {
                    title: "6. 数据共享",
                    content: "我们不会出售您的个人数据。我们仅在以下情况下共享数据：",
                    list: [
                        "第三方服务提供商：Supabase（数据库）、Stripe（支付处理）",
                        "法律要求：如法律、法规或法律程序要求",
                        "保护权利：保护我们的权利、隐私、安全或财产"
                    ]
                },
                {
                    title: "7. 您的权利",
                    content: "您有权：",
                    list: [
                        "访问您的个人数据",
                        "更正不准确的数据",
                        "删除您的账户和数据",
                        "导出您的交易记录"
                    ]
                },
                {
                    title: "8. Cookie 和跟踪",
                    content: "我们使用必要的本地存储来保存您的会话信息和偏好设置。我们不使用第三方跟踪 cookie。"
                },
                {
                    title: "9. 儿童隐私",
                    content: "我们的服务不面向13岁以下的儿童。我们不会故意收集13岁以下儿童的个人信息。"
                },
                {
                    title: "10. 隐私政策变更",
                    content: "我们可能会不时更新本隐私政策。我们将通过在此页面发布新的隐私政策来通知您任何重大变更。"
                },
                {
                    title: "11. 联系我们",
                    content: "如果您对本隐私政策有任何疑问，请通过 support@goldcat.trade 联系我们。"
                }
            ]
        },
        en: {
            title: "Privacy Policy (2026 Edition)",
            lastUpdated: "Last updated: May 1, 2026",
            sections: [
                {
                    title: "1. Introduction",
                    content: "At GoldCat Terminal (\"we\" or \"us\"), we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our trading journal and risk analysis service."
                },
                {
                    title: "2. Geographic Restriction & Compliance Notice",
                    content: "This service is not offered to residents of mainland China. Users from mainland China must independently understand and comply with applicable local laws and regulations. If crypto-related activities are restricted in your jurisdiction, please do not use this service."
                },
                {
                    title: "3. Information We Collect",
                    content: "We collect the following information:",
                    list: [
                        "Account Information: Email address for authentication",
                        "Trading Data: Trade records, analysis, and notes you manually enter",
                        "Usage Data: Service usage statistics and interaction information",
                        "Payment Information: Securely processed by third-party payment processor (Stripe)"
                    ]
                },
                {
                    title: "4. How We Use Information",
                    content: "We use collected information to:",
                    list: [
                        "Provide and maintain the Service",
                        "Process payments and manage subscriptions",
                        "Improve service quality and features",
                        "Communicate service updates",
                        "Ensure platform security and prevent abuse"
                    ]
                },
                {
                    title: "5. Data Storage and Security",
                    content: "Your data is securely stored via Supabase with Row Level Security (RLS) policies ensuring only you can access your data. We implement appropriate technical and organizational measures to protect your personal information."
                },
                {
                    title: "6. Data Sharing",
                    content: "We do not sell your personal data. We only share data in the following cases:",
                    list: [
                        "Third-party Service Providers: Supabase (database), Stripe (payment processing)",
                        "Legal Requirements: As required by law, regulation, or legal process",
                        "Protect Rights: To protect our rights, privacy, safety, or property"
                    ]
                },
                {
                    title: "7. Your Rights",
                    content: "You have the right to:",
                    list: [
                        "Access your personal data",
                        "Correct inaccurate data",
                        "Delete your account and data",
                        "Export your trade records"
                    ]
                },
                {
                    title: "8. Cookies and Tracking",
                    content: "We use necessary local storage to save your session information and preferences. We do not use third-party tracking cookies."
                },
                {
                    title: "9. Children's Privacy",
                    content: "Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13."
                },
                {
                    title: "10. Changes to Privacy Policy",
                    content: "We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page."
                },
                {
                    title: "11. Contact Us",
                    content: "If you have any questions about this Privacy Policy, please contact us at support@goldcat.trade."
                }
            ]
        }
    };

    const t = content[language] || content.en;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-neutral-900 border-b border-neutral-800">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>{language === 'zh' ? '返回' : 'Back'}</span>
                    </button>
                    <h1 className="text-xl font-bold text-white">GoldCat Terminal</h1>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <article className="prose prose-invert max-w-none">
                    <h1 className="text-4xl font-black text-white mb-2">{t.title}</h1>
                    <p className="text-sm text-gray-400 mb-12">{t.lastUpdated}</p>

                    {t.sections.map((section, index) => (
                        <section key={index} className="mb-10">
                            <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                            <p className="text-gray-300 leading-relaxed mb-4">{section.content}</p>
                            {section.list && (
                                <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                                    {section.list.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </article>
            </main>

            {/* Footer */}
            <footer className="border-t border-neutral-800 py-8">
                <div className="max-w-4xl mx-auto px-6 text-center text-sm text-gray-500">
                    <p>© 2026 GoldCat Terminal • {language === 'zh' ? '保留所有权利' : 'All rights reserved'}</p>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicyPage;
