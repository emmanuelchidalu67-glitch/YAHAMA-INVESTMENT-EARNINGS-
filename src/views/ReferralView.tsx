import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Share2,
  Gift,
  Award,
  Sparkles,
  ChevronRight,
  Send,
  MessageCircle,
  TrendingUp,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import { User, AdminSettings } from '../types';
import { ApiService } from '../services/api';
import { soundService } from '../utils/sound';

interface ReferralViewProps {
  user: User | null;
  adminSettings: AdminSettings;
  onRequireAuth: () => void;
  onOpenSpin: () => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({
  user,
  adminSettings,
  onRequireAuth,
  onOpenSpin,
}) => {
  const [activeTierTab, setActiveTierTab] = useState<1 | 2 | 3>(1);
  const [referralData, setReferralData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const fetchReferralTeam = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await ApiService.getReferrals(user.id);
      setReferralData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralTeam();
  }, [user]);

  if (!user) {
    return (
      <div className="py-12 px-4 text-center space-y-4 bg-white border-2 border-sky-100 rounded-3xl shadow-lg max-w-md mx-auto my-6">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 via-sky-400 to-amber-400 p-1 mx-auto shadow-md">
          <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
            <Users className="w-8 h-8 text-sky-600" />
          </div>
        </div>
        <h3 className="font-black text-base text-slate-900">Sign In Required</h3>
        <p className="text-xs text-slate-600 max-w-xs mx-auto font-medium">
          Sign in to get your custom Yamaha invite link and earn up to 20% direct referral commission!
        </p>
        <button
          onClick={onRequireAuth}
          className="py-3 px-8 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 text-white font-black text-xs shadow-lg shadow-sky-200 cursor-pointer"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const generateShareLink = () => {
    if (!user) return '';
    const custom = adminSettings?.customReferralLink?.trim() || 'https://yamaha-investment-earnings.ai.studio/?ref={CODE}';
    if (custom.includes('{CODE}')) {
      return custom.replace(/\{CODE\}/g, user.referralCode);
    }
    if (custom.includes('{ref}')) {
      return custom.replace(/\{ref\}/g, user.referralCode);
    }
    if (custom.startsWith('http://') || custom.startsWith('https://')) {
      if (custom.endsWith('=')) {
        return `${custom}${user.referralCode}`;
      }
      return custom.includes('?')
        ? `${custom}&ref=${user.referralCode}`
        : `${custom}?ref=${user.referralCode}`;
    }
    return `https://yamaha-investment-earnings.ai.studio/?ref=${user.referralCode}`;
  };

  const shareLink = generateShareLink();

  const handleCopy = (text: string, type: 'link' | 'code') => {
    soundService.playClick();
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setShowToast(true);
      setTimeout(() => setCopiedLink(false), 3000);
      setTimeout(() => setShowToast(false), 3000);
    } else {
      setCopiedCode(true);
      setShowToast(true);
      setTimeout(() => setCopiedCode(false), 3000);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const getTierMembers = () => {
    if (!referralData) return [];
    switch (activeTierTab) {
      case 1:
        return referralData.tier1 || [];
      case 2:
        return referralData.tier2 || [];
      case 3:
        return referralData.tier3 || [];
      default:
        return [];
    }
  };

  const currentTierMembers = getTierMembers();

  const chartData = [
    {
      name: 'Tier 1 (20%)',
      rate: '20%',
      members: referralData?.tier1?.length || 0,
      earnings: referralData?.tier1?.reduce((acc: number, m: any) => acc + (m.commissionEarned || 0), 0) || 0,
      fill: '#0284c7',
    },
    {
      name: 'Tier 2 (3%)',
      rate: '3%',
      members: referralData?.tier2?.length || 0,
      earnings: referralData?.tier2?.reduce((acc: number, m: any) => acc + (m.commissionEarned || 0), 0) || 0,
      fill: '#0ea5e9',
    },
    {
      name: 'Tier 3 (1%)',
      rate: '1%',
      members: referralData?.tier3?.length || 0,
      earnings: referralData?.tier3?.reduce((acc: number, m: any) => acc + (m.commissionEarned || 0), 0) || 0,
      fill: '#059669',
    },
  ];

  return (
    <div className="space-y-4 pb-12 text-slate-900">
      {/* Top Banner - Milky Diamond & Sky Blue */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-white via-sky-50 to-amber-50/60 text-slate-900 shadow-xl shadow-sky-100/70 border-2 border-sky-200 relative overflow-hidden">
        <div className="flex items-center gap-2 text-sky-800 text-xs font-black uppercase tracking-wider mb-1">
          <Users className="w-4 h-4 text-sky-600" /> 3-Tier Referral Agency
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Earn Up To 20% Commissions</h2>
        <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
          Share your referral link with friends. Every time they invest in YAMAHA VIP packages, you receive instant cash directly to your wallet!
        </p>
      </div>

      {/* Share Box (Diamond & Gold Styled) */}
      <div className="p-5 rounded-3xl bg-white border-2 border-sky-200 shadow-xl shadow-sky-100/60 space-y-4 text-slate-900">
        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
            Your Invitation Code
          </label>
          <div className="flex items-center justify-between bg-sky-50/60 p-3 rounded-2xl border-2 border-sky-100">
            <span className="font-mono font-black text-xl text-sky-900 tracking-wider">
              {user.referralCode}
            </span>
            <button
              onClick={() => handleCopy(user.referralCode, 'code')}
              className="py-2 px-3.5 rounded-xl bg-white hover:bg-sky-50 text-sky-800 font-black text-xs flex items-center gap-1.5 border border-sky-200 shadow-xs cursor-pointer active:scale-95"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedCode ? 'Copied' : 'Copy Code'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
            Your Invitation Link
          </label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              readOnly
              value={shareLink}
              className="w-full px-3.5 py-2.5 rounded-2xl border-2 border-sky-100 bg-sky-50/60 font-mono text-xs text-sky-900 font-bold outline-none truncate"
            />
            <button
              onClick={() => handleCopy(shareLink, 'link')}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-sky-50 text-sky-800 font-black text-xs shrink-0 flex items-center gap-1 border border-sky-200 shadow-xs cursor-pointer active:scale-95"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Prominent Copy Referral Link Primary Button */}
          <button
            onClick={() => handleCopy(shareLink, 'link')}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-md shadow-sky-200 flex items-center justify-center gap-2 transition-all cursor-pointer border border-sky-400 active:scale-95"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Link Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-white" />
                <span>Copy Referral Link</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Share Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              `Join YAMAHA INVESTMENT EARNINGS INCOME now and get welcome bonus! Earn daily returns from VIP packages: ${shareLink}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" /> Share on WhatsApp
          </a>

          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(
              'Join YAMAHA INVESTMENT EARNINGS INCOME & get instant bonus!'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Share on Telegram
          </a>
        </div>

        {/* Investment-Trigger Policy Notice */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Referral Policy:</strong> Referral commissions and invite bonuses are strictly tied to downline activity. No bonus is awarded if the user you invited didn't deposit and invest in a VIP package!
          </p>
        </div>
      </div>

      {/* RECHARTS VISUALIZATION FOR REFERRAL TIER GROWTH & EARNINGS */}
      <div className="p-5 rounded-3xl bg-white border-2 border-sky-200 shadow-xl shadow-sky-100/60 space-y-4 text-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-sky-600" /> Tier Performance & Earnings
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold">Visualizing members & commission per referral tier</p>
          </div>
          <span className="text-xs font-black text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
            Total: ₦{(user.totalReferralBonus || 0).toLocaleString()}
          </span>
        </div>

        {/* Recharts Bar Chart */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0f2fe" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#0369a1' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#0369a1' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: any, name: string) => [
                  name === 'earnings' ? `₦${Number(value).toLocaleString()}` : `${value} members`,
                  name === 'earnings' ? 'Commissions Earned' : 'Downline Count',
                ]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  color: '#0f172a',
                  fontSize: '11px',
                  border: '2px solid #bae6fd',
                  boxShadow: '0 4px 12px rgba(14,165,233,0.15)',
                }}
              />
              <Bar dataKey="members" radius={[6, 6, 0, 0]} name="Downline Count">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recharts Area Chart for Cumulative Referral Earnings */}
        <div className="pt-2 border-t border-sky-100">
          <p className="text-xs font-black text-amber-800 mb-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Tier Commission Distribution (₦)
          </p>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0f2fe" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#0369a1' }} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#0369a1' }} axisLine={false} />
                <Tooltip
                  formatter={(val: any) => [`₦${Number(val).toLocaleString()}`, 'Commission']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    color: '#0f172a',
                    fontSize: '11px',
                    border: '2px solid #bae6fd',
                  }}
                />
                <Area type="monotone" dataKey="earnings" stroke="#f59e0b" fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Spin Bonus Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-xl shadow-amber-200/60 border-2 border-amber-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white text-amber-600 font-black text-lg flex items-center justify-center shadow-xs">
            🎁
          </div>
          <div>
            <p className="font-black text-xs text-slate-950">Free Spin Wheel Rewards</p>
            <p className="text-[11px] text-slate-900 font-bold">
              Get <span className="font-black text-amber-950">+1 Spin</span> for every friend who registers!
            </p>
          </div>
        </div>
        <button
          onClick={onOpenSpin}
          className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-black text-xs px-3.5 py-2 rounded-xl shadow cursor-pointer active:scale-95"
        >
          Spins: {referralData ? referralData.spinsAvailable || 0 : 0}
        </button>
      </div>

      {/* 3-Tier Commission Structure */}
      <div className="p-4 rounded-3xl bg-white border-2 border-sky-200 shadow-md shadow-sky-100/50 space-y-3 text-slate-900">
        <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-500" /> 3-Tier Commission Rates
        </h3>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 font-black">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Tier 1</p>
            <p className="text-base text-sky-700">20%</p>
            <p className="text-[9px] text-slate-400 font-semibold">Direct Invites</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-900 font-black">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Tier 2</p>
            <p className="text-base text-sky-700">3%</p>
            <p className="text-[9px] text-slate-400 font-semibold">Secondary</p>
          </div>
          <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-black">
            <p className="text-[10px] text-slate-500 font-bold uppercase">Tier 3</p>
            <p className="text-base text-emerald-700">1%</p>
            <p className="text-[9px] text-slate-400 font-semibold">Tertiary</p>
          </div>
        </div>
      </div>

      {/* Team Member Downlines Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900">
            Team Members ({referralData ? referralData.totalTeamCount || 0 : 0})
          </h3>
          <span className="text-xs font-black text-emerald-700">
            Total Bonus: ₦{user.totalReferralBonus ? user.totalReferralBonus.toLocaleString() : '0.00'}
          </span>
        </div>

        {/* Tier Tabs (3 Tiers Only) */}
        <div className="flex bg-sky-50/80 p-1 rounded-2xl border border-sky-200">
          {([1, 2, 3] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                soundService.playClick();
                setActiveTierTab(t);
              }}
              className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                activeTierTab === t
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tier {t}
            </button>
          ))}
        </div>

        {/* Downlines List */}
        <div className="space-y-2">
          {currentTierMembers.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border-2 border-sky-100 text-center text-xs text-slate-600 font-medium">
              No registered members in Tier {activeTierTab} yet. Share your invitation link to grow your team!
            </div>
          ) : (
            currentTierMembers.map((member: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white border-2 border-sky-100 shadow-xs flex items-center justify-between text-xs text-slate-900"
              >
                <div>
                  <p className="font-black text-slate-900">{member.fullName}</p>
                  <p className="text-[10px] text-slate-500 font-bold">
                    {member.phone} • Joined {new Date(member.registeredAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-black text-emerald-700">+₦{member.commissionEarned.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 font-bold">Invested: ₦{member.totalInvested.toLocaleString()}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Toast Notification for Copied Link */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-3 animate-bounce max-w-xs w-full">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
            <Check className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex-1">
            <p className="font-black text-xs text-amber-300">Link Copied!</p>
            <p className="text-[11px] text-slate-200 font-medium leading-tight">
              Referral link copied to clipboard. Share with friends to earn!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
