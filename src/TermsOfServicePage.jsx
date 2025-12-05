import React from 'react';
import { ArrowLeft } from 'lucide-react';

const TermsOfServicePage = ({ language, onBack }) => {
    const content = {
        zh: {
            title: "服务条款",
            lastUpdated: "最后更新：2024年12月4日",
            sections: [
                {
                    title: "1. 引言",
                    content: "欢迎使用 GoldCat Terminal。访问或使用我们的交易日志和风险分析服务即表示您同意受本服务条款（\"条款\"）的约束。使用服务前请仔细阅读这些条款。"
                },
                {
                    title: "2. 服务说明",
                    content: "GoldCat Terminal 是一个交易日志和风险分析工具，帮助交易者记录、分析和改进其交易策略。服务包括：",
                    list: [
                        "交易记录管理",
                        "风险分析和计算",
                        "AI 智能分析（高级会员）",
                        "数据导出功能",
                        "交易模式识别"
                    ]
                },
                {
                    title: "3. 用户义务",
                    content: "使用我们的服务时，您同意：",
                    list: [
                        "保护好您的账户安全和凭证",
                        "提供准确和真实的信息",
                        "遵守所有适用的法律法规",
                        "不从事任何非法活动或滥用服务",
                        "不干扰或破坏服务或服务器",
                        "不侵犯他人的知识产权"
                    ]
                },
                {
                    title: "4. 会员和付款",
                    content: "我们提供免费和高级会员选项：",
                    list: [
                        "免费账户：限制为 20 笔交易记录",
                        "高级会员：无限交易记录、AI 智能分析、优先支持",
                        "付款通过 Creem 处理，采用一次性终身访问模式",
                        "所有费用均不可退款，除非法律另有规定"
                    ]
                },
                {
                    title: "5. 知识产权",
                    content: "服务及其原始内容、功能和特性归 GoldCat Terminal 所有。您的交易数据归您所有，您保留对其的所有权利。"
                },
                {
                    title: "6. 免责声明",
                    content: "重要提示：",
                    list: [
                        "本服务不构成投资建议或财务咨询",
                        "交易涉及重大风险，您可能损失投资",
                        "过往表现不代表未来结果",
                        "您应自行承担所有交易决策的后果",
                        "我们不对基于本服务做出的任何投资决策负责"
                    ]
                },
                {
                    title: "7. 服务可用性",
                    content: "虽然我们努力维持服务的持续可用性，但我们不保证服务不会中断。我们保留随时修改、暂停或终止服务任何方面的权利。"
                },
                {
                    title: "8. 责任限制",
                    content: "服务按\"原样\"提供，不提供任何明示或暗示的保证。在法律允许的最大范围内，我们不对因使用服务而产生的任何直接、间接、附带、惩罚性或后果性损害承担责任。"
                },
                {
                    title: "9. 账户终止",
                    content: "我们保留因以下原因暂停或终止您账户的权利：",
                    list: [
                        "违反这些条款",
                        "欺诈或可疑活动",
                        "长期不活动",
                        "法律或监管要求"
                    ]
                },
                {
                    title: "10. 条款变更",
                    content: "我们保留随时修改这些条款的权利。任何更改后继续使用服务即表示接受新条款。我们将通过在此页面发布更新的条款来通知用户重大更改。"
                },
                {
                    title: "11. 联系我们",
                    content: "如果您对这些条款有任何疑问，请通过 support@goldcat.trade 联系我们。"
                }
            ]
        },
        en: {
            title: "Terms of Service",
            lastUpdated: "Last updated: December 4, 2024",
            sections: [
                {
                    title: "1. Introduction",
                    content: "Welcome to GoldCat Terminal. By accessing or using our trading journal and risk analysis service, you agree to be bound by these Terms of Service (\"Terms\"). Please read these Terms carefully before using the Service."
                },
                {
                    title: "2. Service Description",
                    content: "GoldCat Terminal is a trading journal and risk analysis tool that helps traders record, analyze, and improve their trading strategies. The Service includes:",
                    list: [
                        "Trade record management",
                        "Risk analysis and calculation",
                        "AI Smart Analysis (Premium members)",
                        "Data export functionality",
                        "Trading pattern recognition"
                    ]
                },
                {
                    title: "3. User Obligations",
                    content: "By using our Service, you agree to:",
                    list: [
                        "Secure your account and credentials",
                        "Provide accurate and truthful information",
                        "Comply with all applicable laws and regulations",
                        "Not engage in any illegal activities or abuse the Service",
                        "Not interfere with or disrupt the Service or servers",
                        "Not infringe on others' intellectual property rights"
                    ]
                },
                {
                    title: "4. Membership and Payments",
                    content: "We offer both free and premium membership options:",
                    list: [
                        "Free Account: Limited to 20 trade records",
                        "Premium Membership: Unlimited records, AI Smart Analysis, Priority Support",
                        "Payments processed through Creem with one-time lifetime access model",
                        "All fees are non-refundable unless required by law"
                    ]
                },
                {
                    title: "5. Intellectual Property",
                    content: "The Service and its original content, features, and functionality are owned by GoldCat Terminal. Your trading data belongs to you, and you retain all rights to it."
                },
                {
                    title: "6. Disclaimer",
                    content: "Important Notice:",
                    list: [
                        "This Service does not constitute investment advice or financial counseling",
                        "Trading involves significant risk and you may lose your investment",
                        "Past performance does not guarantee future results",
                        "You are solely responsible for all trading decisions",
                        "We are not liable for any investment decisions made based on this Service"
                    ]
                },
                {
                    title: "7. Service Availability",
                    content: "While we strive to maintain continuous service availability, we do not guarantee uninterrupted access to the Service. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time."
                },
                {
                    title: "8. Limitation of Liability",
                    content: "The Service is provided \"as is\" without any warranties, express or implied. To the maximum extent permitted by law, we shall not be liable for any direct, indirect, incidental, punitive, or consequential damages arising from use of the Service."
                },
                {
                    title: "9. Account Termination",
                    content: "We reserve the right to suspend or terminate your account for:",
                    list: [
                        "Violation of these Terms",
                        "Fraudulent or suspicious activity",
                        "Extended inactivity",
                        "Legal or regulatory requirements"
                    ]
                },
                {
                    title: "10. Changes to Terms",
                    content: "We reserve the right to modify these Terms at any time. Continued use of the Service after any changes constitutes acceptance of the new Terms. We will notify users of material changes by posting the updated Terms on this page."
                },
                {
                    title: "11. Contact Us",
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
                    <p>© 2024 GoldCat Terminal • {language === 'zh' ? '保留所有权利' : 'All rights reserved'}</p>
                </div>
            </footer>
        </div>
    );
};

export default TermsOfServicePage;
