import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TermsOfServicePage = ({ language, onBack }) => {
    const content = {
        zh: {
            title: "服务条款",
            lastUpdated: "最后更新：2026年5月1日",
            sections: [
                {
                    title: "1. 引言",
                    content: "欢迎使用 GoldCat Terminal。访问或使用本平台的任何功能即表示您已阅读、理解并同意受本服务条款（\"条款\"）约束。",
                    list: [
                        "若您不同意本条款，请立即停止使用本服务。"
                    ]
                },
                {
                    title: "2. 服务说明",
                    content: "GoldCat Terminal 是一个面向加密货币交易者的信息展示与交易辅助分析工具，提供以下功能：",
                    list: [
                        "交易记录管理",
                        "风险分析和计算",
                        "AI 智能分析（高级会员）",
                        "数据导出功能",
                        "交易模式识别",
                        "AI 市场观测信号（仅供参考）",
                        "本平台不执行任何交易，不接触用户资金，不构成投资顾问或交易指令服务"
                    ]
                },
                {
                    title: "3. 适用地区与合规声明",
                    content: "加密货币相关活动在不同国家和地区受到不同程度法律限制。使用本服务前，您须自行确认所在地法律法规并确保使用行为合法合规。",
                    list: [
                        "本服务不向中华人民共和国大陆地区居民提供，中国大陆用户访问须自行了解并遵守当地法律法规",
                        "若您所在地区禁止加密货币相关活动，请勿使用本服务",
                        "若因违反当地法律法规造成任何后果，由用户自行承担"
                    ]
                },
                {
                    title: "4. 用户义务",
                    content: "使用我们的服务时，您同意：",
                    list: [
                        "保护好您的账户安全和凭证",
                        "提供准确和真实的信息",
                        "遵守所有适用的法律法规",
                        "不从事任何非法活动或滥用服务",
                        "不干扰或破坏服务或服务器",
                        "不侵犯他人的知识产权",
                        "不将本平台信号用于任何商业推广中的收益承诺或盈利保证"
                    ]
                },
                {
                    title: "5. 会员和付款",
                    content: "我们提供免费和高级会员选项：",
                    list: [
                        "免费账户：限制为 20 笔交易记录",
                        "高级会员：无限交易记录、AI 智能分析、优先支持，费用为 $39.00 / 年（或 39 USDT / 年）",
                        "所有支付通过 SSL 加密保障安全",
                        "费用一经支付均不可退款，除非法律另有规定",
                        "接受 USDT 仅为结算便利，不构成任何加密资产投资背书"
                    ]
                },
                {
                    title: "6. 免责声明",
                    content: "重要提示：本平台信息仅供参考，不构成投资建议、交易指令或财务咨询。",
                    list: [
                        "AI 模型基于历史数据训练，无法预测未来市场走势",
                        "AI 确信度仅反映模型对历史模式的匹配程度，不等同于未来涨跌概率，请勿据此单独作出交易决策",
                        "市场数据可能存在延迟、错误或中断，波动率信号计算基于特定参数，在极端行情下可能失效",
                        "示例：极端行情、流动性危机或黑天鹅事件下，本平台信号可能出现较大偏差，建议结合多方信息综合判断",
                        "交易涉及重大风险，您可能损失全部本金，过往表现不代表未来结果",
                        "您应自行承担所有交易决策及后果，我们不对基于本服务作出的投资决策负责"
                    ]
                },
                {
                    title: "7. 知识产权",
                    content: "服务及其原始内容、功能和特性归 GoldCat Terminal 所有。您的交易数据归您所有，您保留对其的所有权利。"
                },
                {
                    title: "8. 服务可用性",
                    content: "虽然我们努力维持服务的持续可用性，但我们不保证服务不会中断。我们保留随时修改、暂停或终止服务任何方面的权利。"
                },
                {
                    title: "9. 责任限制",
                    content: "服务按\"原样\"提供，不提供任何明示或暗示的保证。在法律允许的最大范围内，我们不对因使用服务而产生的任何直接、间接、附带、惩罚性或后果性损害承担责任。"
                },
                {
                    title: "10. 账户终止",
                    content: "我们保留因以下原因暂停或终止您账户的权利：",
                    list: [
                        "违反这些条款",
                        "欺诈或可疑活动",
                        "长期不活动",
                        "法律或监管要求"
                    ]
                },
                {
                    title: "11. 条款变更",
                    content: "我们保留随时修改这些条款的权利。任何更改后继续使用服务即表示接受新条款。我们将通过在此页面发布更新的条款来通知用户重大更改。"
                },
                {
                    title: "12. 联系我们",
                    content: "如果您对这些条款有任何疑问，请通过 support@goldcat.trade 联系我们。"
                }
            ]
        },
        en: {
            title: "Terms of Service",
            lastUpdated: "Last updated: May 1, 2026",
            sections: [
                {
                    title: "1. Introduction",
                    content: "Welcome to GoldCat Terminal. By accessing or using any feature of this platform, you agree to be bound by these Terms of Service (\"Terms\").",
                    list: [
                        "If you do not agree to these Terms, please discontinue use of the Service immediately."
                    ]
                },
                {
                    title: "2. Service Description",
                    content: "GoldCat Terminal is an information display and trading-analysis assistance tool for crypto traders. The Service includes:",
                    list: [
                        "Trade record management",
                        "Risk analysis and calculation",
                        "AI Smart Analysis (Premium members)",
                        "Data export functionality",
                        "Trading pattern recognition",
                        "AI market observation signals (for reference only)",
                        "The platform does not execute trades, hold user funds, or provide investment advisory/trade-instruction services"
                    ]
                },
                {
                    title: "3. Geographic Restrictions & Compliance",
                    content: "Crypto-related activities are regulated differently across jurisdictions. You must independently verify local legal requirements before using this Service.",
                    list: [
                        "This service is not offered to residents of mainland China. Users from mainland China must independently understand and comply with applicable local laws and regulations",
                        "If crypto-related activities are prohibited in your jurisdiction, do not use this Service",
                        "You are solely responsible for consequences arising from violations of local laws"
                    ]
                },
                {
                    title: "4. User Obligations",
                    content: "By using our Service, you agree to:",
                    list: [
                        "Secure your account and credentials",
                        "Provide accurate and truthful information",
                        "Comply with all applicable laws and regulations",
                        "Not engage in any illegal activities or abuse the Service",
                        "Not interfere with or disrupt the Service or servers",
                        "Not infringe on others' intellectual property rights",
                        "Not use platform signals in any promotion implying guaranteed returns or profits"
                    ]
                },
                {
                    title: "5. Membership and Payments",
                    content: "We offer both free and premium membership options:",
                    list: [
                        "Free Account: Limited to 20 trade records",
                        "Premium Membership: Unlimited records, AI Smart Analysis, Priority Support — $39.00/year (or 39 USDT/year)",
                        "All payments are protected by SSL encryption",
                        "All fees are non-refundable unless required by applicable law",
                        "USDT acceptance is for settlement convenience only and does not constitute investment endorsement"
                    ]
                },
                {
                    title: "6. Disclaimer",
                    content: "Important Notice: Platform content is for informational purposes only and does not constitute investment advice, trading instructions, or financial consultation.",
                    list: [
                        "AI models are trained on historical data and cannot predict future market movements",
                        "AI confidence reflects historical pattern fit only. It is not equivalent to future up/down probability and must not be used as a sole trading basis",
                        "Market data may be delayed, inaccurate, or interrupted. Volatility signal calculations depend on specific parameters and may fail in extreme conditions",
                        "Example: During extreme volatility, liquidity crises, or black swan events, platform signals may deviate significantly. Always cross-check with multiple information sources",
                        "Trading involves substantial risk and can result in total loss of principal. Past performance is not indicative of future results",
                        "You are solely responsible for your trading decisions and outcomes. We are not liable for investment decisions made based on this Service"
                    ]
                },
                {
                    title: "7. Intellectual Property",
                    content: "The Service and its original content, features, and functionality are owned by GoldCat Terminal. Your trading data belongs to you, and you retain all rights to it."
                },
                {
                    title: "8. Service Availability",
                    content: "While we strive to maintain continuous service availability, we do not guarantee uninterrupted access to the Service. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time."
                },
                {
                    title: "9. Limitation of Liability",
                    content: "The Service is provided \"as is\" without any warranties, express or implied. To the maximum extent permitted by law, we shall not be liable for any direct, indirect, incidental, punitive, or consequential damages arising from use of the Service."
                },
                {
                    title: "10. Account Termination",
                    content: "We reserve the right to suspend or terminate your account for:",
                    list: [
                        "Violation of these Terms",
                        "Fraudulent or suspicious activity",
                        "Extended inactivity",
                        "Legal or regulatory requirements"
                    ]
                },
                {
                    title: "11. Changes to Terms",
                    content: "We reserve the right to modify these Terms at any time. Continued use of the Service after any changes constitutes acceptance of the new Terms. We will notify users of material changes by posting the updated Terms on this page."
                },
                {
                    title: "12. Contact Us",
                    content: "If you have any questions about these Terms, please contact us at support@goldcat.trade."
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

export default TermsOfServicePage;
