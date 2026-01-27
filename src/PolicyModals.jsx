// Privacy Policy and Terms of Service Modals Component
import React from 'react';
import { X } from 'lucide-react';

export const PrivacyPolicyModal = ({ show, onClose, language }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">
                        {language === 'zh' ? '隐私政策' : 'Privacy Policy'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-sm text-gray-300 space-y-4">
                    {language === 'zh' ? (
                        <>
                            <p className="text-gray-400 text-xs">最后更新：2024年12月4日</p>
                            <div>
                                <h3 className="text-white font-semibold mb-2">信息收集</h3>
                                <p>GoldCat致力于保护您的隐私。我们收集邮箱地址、交易数据和使用情况。</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">数据使用</h3>
                                <p>我们使用数据提供服务、保存记录和处理支付。</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">数据存储</h3>
                                <p>通过Supabase安全存储，行级安全策略确保只有您可以访问数据。</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">您的权利</h3>
                                <p>您可以访问、更正、删除数据或导出交易记录。</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">联系我们</h3>
                                <p>隐私问题请联系：<a href="mailto:goldcatservice@gmail.com" className="text-amber-500 hover:text-amber-400">goldcatservice@gmail.com</a></p>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-400 text-xs">Last Updated: December 4, 2024</p>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Information Collection</h3>
                                <p>GoldCat collects email addresses, trading data, and usage information to provide services.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Data Use</h3>
                                <p>We use data to provide services, store records, and process payments.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Data Storage</h3>
                                <p>Securely stored via Supabase with Row Level Security ensuring data privacy.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Your Rights</h3>
                                <p>You can access, correct, delete data, or export trade records.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Contact</h3>
                                <p>Privacy inquiries: <a href="mailto:goldcatservice@gmail.com" className="text-amber-500 hover:text-amber-400">goldcatservice@gmail.com</a></p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export const TermsOfServiceModal = ({ show, onClose, language }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">
                        {language === 'zh' ? '服务条款' : 'Terms of Service'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="text-sm text-gray-300 space-y-4">
                    {language === 'zh' ? (
                        <>
                            <p className="text-gray-400 text-xs">最后更新：2024年12月4日</p>
                            <div>
                                <h3 className="text-white font-semibold mb-2">服务说明</h3>
                                <p>GoldCat是交易日志和风险分析工具，帮助交易者记录、分析和改进策略。</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">用户责任</h3>
                                <p>您需保管账户安全，输入真实数据，禁止非法活动或滥用服务。</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">会员和付款</h3>
                                <p>免费用户限20笔记录，高级会员无限制。通过Stripe处理支付，费用不可退款。</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">免责声明</h3>
                                <p><strong>不构成投资建议</strong>。交易有风险，您应自行承担决策后果。</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">联系</h3>
                                <p>问题请联系：<a href="mailto:goldcatservice@gmail.com" className="text-amber-500 hover:text-amber-400">goldcatservice@gmail.com</a></p>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-400 text-xs">Last Updated: December 4, 2024</p>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Service Description</h3>
                                <p>GoldCat is a trading journal and risk analysis tool for traders.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">User Responsibilities</h3>
                                <p>Secure your account, input accurate data, no illegal activities or system abuse.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Membership & Payments</h3>
                                <p>Free users limited to 20 trades. Premium unlimited. Payments via Stripe, non-refundable.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Disclaimer</h3>
                                <p><strong>Not investment advice.</strong> Trading involves risk. You accept full responsibility.</p>
                            </div>
                            <div>
                                <h3 className="text-white font-semibold mb-2">Contact</h3>
                                <p>Inquiries: <a href="mailto:goldcatservice@gmail.com" className="text-amber-500 hover:text-amber-400">goldcatservice@gmail.com</a></p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
