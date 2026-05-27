import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TermsOfServicePage = ({ language, onBack }) => {
    const content = {
        zh: {
            title: "服务条款（2025版）",
            lastUpdated: "最后更新：2025年5月27日",
            sections: [
                {
                    title: "1. 引言",
                    content: "欢迎使用 GoldCat Terminal。访问或使用本平台的任何功能即表示您已阅读、理解并同意受本服务条款（\"条款\"）的约束。若您不同意本条款，请立即停止使用本服务。"
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
                        "AI 市场观测信号（仅供参考）"
                    ]
                },
                {
                    title: "重要说明",
                    content: "本平台所有功能均为辅助性信息工具，不执行任何交易操作，不接触用户资金，不构成投资顾问、财务顾问或交易指令服务。"
                },
                {
                    title: "3. 适用地区与合规声明",
                    content: "本服务不向中华人民共和国大陆地区居民提供。加密货币相关活动在不同国家和地区受到不同程度的法律限制。您在使用本服务前，须自行确认您所在地区的相关法律法规，并确保您的使用行为合法合规。",
                    list: [
                        "本平台不对因用户违反当地法律法规所造成的任何后果承担责任",
                        "若您所在地区禁止加密货币相关活动，请勿使用本服务",
                        "用户注册即视为声明其使用本服务符合所在地区的法律规定"
                    ]
                },
                {
                    title: "4. 用户义务",
                    content: "使用本服务时，您同意：",
                    list: [
                        "保护好您的账户安全和登录凭证",
                        "提供准确和真实的注册信息",
                        "遵守所有适用的法律法规",
                        "不从事任何非法活动或滥用服务",
                        "不干扰或破坏服务或服务器",
                        "不侵犯他人的知识产权",
                        "不将本平台信号用于任何商业推广中的收益承诺或保证"
                    ]
                },
                {
                    title: "5. 会员和付款",
                    content: "我们提供免费和高级会员选项：",
                    list: [
                        "免费账户：限制为 20 笔交易记录",
                        "高级会员：无限交易记录、AI 智能分析、优先支持，费用为 $39.00 / 年",
                        "支付方式：",
                        "信用卡 / 借记卡：支持 Visa、Mastercard、Amex，通过 Stripe 安全处理",
                        "加密货币（USDT）：支持使用 USDT 进行链上支付，金额为 39.00 USDT / 年",
                        "所有支付均通过 SSL 加密保障安全。费用一经支付均不可退款，除非法律另有规定。",
                        "说明：接受 USDT 作为支付方式仅为便利用户结算，不代表本平台推荐或背书任何加密资产投资行为，支付行为与交易决策无关。"
                    ]
                },
                {
                    title: "6. 风险披露与免责声明",
                    content: "请在使用本服务前仔细阅读以下内容：",
                    list: [
                        "6.1 不构成投资建议",
                        "本平台提供的所有内容，包括但不限于 AI 观测信号、波动概率、支撑阻力位、技术指标及市场分析，仅为信息参考，不构成任何投资建议、交易指令或财务咨询。任何基于本平台信息作出的交易决策，其后果由用户自行承担。",
                        "6.2 AI 信号准确性限制",
                        "AI 模型基于历史数据训练，无法预测未来市场走势",
                        "平台显示的\"AI 确信度\"百分比仅反映模型对历史规律的匹配程度，不代表实际盈利概率",
                        "在极端行情、流动性危机或黑天鹅事件下，AI 信号可能出现较大偏差",
                        "数据存在延迟可能性，不保证实时准确性",
                        "6.3 加密资产风险",
                        "加密货币市场波动剧烈，存在本金全部损失的风险",
                        "过往表现不代表未来结果",
                        "请仅使用您可承受损失的资金参与加密货币交易",
                        "本平台对用户的任何交易盈亏不承担任何责任",
                        "6.4 第三方渠道推广",
                        "若您通过第三方机构、社区或渠道了解到本平台，请注意：本平台对第三方推广内容不承担责任。任何第三方关于本平台信号\"高胜率\"\"稳定盈利\"等表述均非本平台官方立场，请以本服务条款为准。"
                    ]
                },
                {
                    title: "7. 知识产权",
                    content: "服务及其原始内容、功能和特性归 GoldCat Terminal 所有。您的交易数据归您所有，您保留对其的所有权利。"
                },
                {
                    title: "8. 服务可用性",
                    content: "我们努力维持服务的持续可用性，但不保证服务不会中断。我们保留随时修改、暂停或终止服务任何方面的权利，且不承担因此产生的任何损失责任。"
                },
                {
                    title: "9. 责任限制",
                    content: "服务按\"原样\"提供，不附带任何明示或暗示的保证。在法律允许的最大范围内，GoldCat Terminal 及其团队不对因使用或无法使用本服务而产生的任何直接、间接、附带、惩罚性或后果性损害承担责任，包括但不限于交易损失、数据丢失或利润损失。"
                },
                {
                    title: "10. 账户终止",
                    content: "我们保留因以下原因暂停或终止您账户的权利：",
                    list: [
                        "违反本条款",
                        "欺诈或可疑活动",
                        "长期不活动",
                        "法律或监管要求"
                    ]
                },
                {
                    title: "11. 条款变更",
                    content: "我们保留随时修改本条款的权利。重大变更将在本页面发布更新内容，任何更改后继续使用服务即表示接受新条款。"
                },
                {
                    title: "12. 联系我们",
                    content: "如对本条款有任何疑问，请通过 support@goldcat.trade 联系我们。"
                }
            ]
        },
        en: {
            title: "Terms of Service (2025 Edition)",
            lastUpdated: "Last updated: May 27, 2025",
            sections: [
                {
                    title: "1. Introduction",
                    content: "Welcome to GoldCat Terminal. By accessing or using any feature of this platform, you confirm that you have read, understood, and agreed to be bound by these Terms of Service (\"Terms\").",
                    list: [
                        "If you do not agree to these Terms, please discontinue use of the Service immediately."
                    ]
                },
                {
                    title: "2. Service Description",
                    content: "GoldCat Terminal is an information display and trading analysis assistance tool designed for cryptocurrency traders. The Service includes:",
                    list: [
                        "Trade journal management",
                        "Risk analysis and calculation",
                        "AI-powered analysis (Premium members)",
                        "Data export functionality",
                        "Trading pattern recognition",
                        "AI market observation signals (for reference only)",
                        "Important Notice: All features on this platform are supplementary information tools only. The platform does not execute trades, handle user funds, or constitute investment advisory, financial advisory, or trade instruction services."
                    ]
                },
                {
                    title: "3. Geographic Restrictions & Compliance",
                    content: "This Service is not available to residents of mainland China (People's Republic of China). Cryptocurrency-related activities are subject to varying degrees of legal restrictions across different countries and regions. Before using this Service, you must independently verify the applicable laws and regulations in your jurisdiction and ensure that your use is lawful.",
                    list: [
                        "The platform bears no responsibility for any consequences arising from users violating local laws or regulations",
                        "If cryptocurrency-related activities are prohibited in your jurisdiction, please refrain from using this Service",
                        "By registering, you represent and warrant that your use of the Service complies with the laws of your jurisdiction"
                    ]
                },
                {
                    title: "4. User Obligations",
                    content: "By using our Service, you agree to:",
                    list: [
                        "Safeguard your account credentials and maintain account security",
                        "Provide accurate and truthful registration information",
                        "Comply with all applicable laws and regulations",
                        "Refrain from any illegal activities or misuse of the Service",
                        "Not interfere with or disrupt the Service or its servers",
                        "Not infringe on the intellectual property rights of others",
                        "Not use platform signals in any commercial promotion that implies guaranteed returns or profit"
                    ]
                },
                {
                    title: "5. Membership and Payments",
                    content: "We offer both free and premium membership options:",
                    list: [
                        "Free Account: Limited to 20 trade records",
                        "Premium Membership: Unlimited trade records, AI-powered analysis, and priority support — $39.00 / year",
                        "Payment Methods:",
                        "Credit / Debit Card: Visa · Mastercard · Amex, securely processed via Stripe",
                        "Cryptocurrency (USDT): On-chain payment, 39 USDT / year",
                        "All payments are secured via SSL encryption. All fees are non-refundable unless otherwise required by applicable law.",
                        "Notice: The acceptance of USDT as a payment method is provided solely as a convenience for settlement purposes. It does not constitute an endorsement or recommendation of any cryptocurrency investment, and the act of payment is unrelated to any trading decisions."
                    ]
                },
                {
                    title: "6. Risk Disclosure & Disclaimer",
                    content: "Please read the following carefully before using this Service:",
                    list: [
                        "6.1 Not Investment Advice",
                        "All content provided by this platform — including but not limited to AI observation signals, volatility probabilities, support/resistance levels, technical indicators, and market analysis — is for informational reference only and does not constitute investment advice, trading instructions, or financial consulting. Users bear sole responsibility for any trading decisions made based on information from this platform.",
                        "6.2 AI Signal Accuracy Limitations",
                        "AI analysis models are trained on historical data and cannot predict future market movements",
                        "The \"AI Confidence\" percentage displayed on the platform reflects the model's pattern-matching against historical data only — it does not represent the probability of profit",
                        "AI signals may deviate significantly during extreme market conditions, liquidity crises, or black swan events",
                        "Data may be subject to delays; real-time accuracy is not guaranteed",
                        "6.3 Cryptocurrency Asset Risks",
                        "Cryptocurrency markets are highly volatile — there is a risk of total loss of principal",
                        "Past performance is not indicative of future results",
                        "Only trade with funds you can afford to lose",
                        "The platform bears no liability for any trading gains or losses incurred by users",
                        "6.4 Third-Party Promotion",
                        "If you learned about this platform through a third-party institution, community, or channel, please be aware: this platform bears no responsibility for third-party promotional content. Any third-party claims regarding \"high win rates\" or \"stable profits\" from platform signals do not represent the official position of this platform. These Terms of Service shall prevail."
                    ]
                },
                {
                    title: "7. Intellectual Property",
                    content: "The Service and its original content, features, and functionality are owned by GoldCat Terminal. Your trading data belongs to you, and you retain all rights to it."
                },
                {
                    title: "8. Service Availability",
                    content: "While we endeavor to maintain continuous service availability, we do not guarantee uninterrupted access. We reserve the right to modify, suspend, or terminate any aspect of the Service at any time without liability for any resulting losses."
                },
                {
                    title: "9. Limitation of Liability",
                    content: "The Service is provided \"as is\" without warranties of any kind, express or implied. To the fullest extent permitted by law, GoldCat Terminal and its team shall not be liable for any direct, indirect, incidental, punitive, or consequential damages arising from the use or inability to use the Service, including but not limited to trading losses, data loss, or loss of profits."
                },
                {
                    title: "10. Account Termination",
                    content: "We reserve the right to suspend or terminate your account for the following reasons:",
                    list: [
                        "Violation of these Terms",
                        "Fraudulent or suspicious activity",
                        "Extended inactivity",
                        "Legal or regulatory requirements"
                    ]
                },
                {
                    title: "11. Changes to Terms",
                    content: "We reserve the right to modify these Terms at any time. Significant changes will be communicated by posting updated Terms on this page. Continued use of the Service following any changes constitutes acceptance of the revised Terms."
                },
                {
                    title: "12. Contact Us",
                    content: "For any questions regarding these Terms, please contact: support@goldcat.trade"
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
