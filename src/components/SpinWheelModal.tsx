import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Trophy, HelpCircle, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { SPIN_REWARDS } from '../data/initialData';
import { User, SpinReward } from '../types';
import { soundService } from '../utils/sound';
import { triggerHaptic, HapticPattern } from '../utils/haptics';
import palmpaySpinBg from '../assets/images/palmpay_spin_bg_1786464711833.jpg';

interface SpinWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSpinSuccess: (reward: SpinReward, updatedUser: User) => void;
  onRequireAuth: () => void;
}

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  onClose,
  user,
  onSpinSuccess,
  onRequireAuth,
}) => {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonReward, setWonReward] = useState<SpinReward | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      drawWheel(0);
    }
  }, [isOpen]);

  const drawWheel = (currentRotationDeg: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const numSlices = SPIN_REWARDS.length;
    const arc = (2 * Math.PI) / numSlices;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 8;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((currentRotationDeg * Math.PI) / 180);

    // Slices
    SPIN_REWARDS.forEach((reward, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.fillStyle = reward.color;
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arc);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.fillStyle = reward.textColor || '#FFFFFF';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.rotate(angle + arc / 2);
      ctx.fillText(reward.label, radius - 14, 0);
      ctx.restore();
    });

    ctx.restore();

    // Center pin
    ctx.beginPath();
    ctx.arc(centerX, centerY, 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#1E1B4B';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#F59E0B';
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPIN', centerX, centerY);
  };

  const handleSpin = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }

    if (spinning) return;

    if ((user.spinsAvailable || 0) <= 0) {
      setErrorMsg('No spins remaining! Refer friends to unlock more free spins (1 spin per referral).');
      return;
    }

    setErrorMsg('');
    setSpinning(true);
    setWonReward(null);
    triggerHaptic(HapticPattern.SPIN_START);

    try {
      const res = await fetch('/api/user/spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Spin failed');
      }

      const reward: SpinReward = data.reward;
      const targetRewardIndex = SPIN_REWARDS.findIndex((r) => r.id === reward.id);
      const sliceAngle = 360 / SPIN_REWARDS.length;

      // Calculate final rotation so needle (top 270 deg) lands on the target slice
      const targetAngle = 270 - (targetRewardIndex * sliceAngle + sliceAngle / 2);
      const extraRounds = 360 * 5; // 5 full spins
      const finalRotation = rotation + extraRounds + (targetAngle - (rotation % 360));

      setRotation(finalRotation);

      // Animate rotation on canvas
      const startTime = performance.now();
      const spinDuration = 4000; // 4 seconds
      let lastTickAngle = rotation;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        // Ease out cubic
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentAngle = rotation + (finalRotation - rotation) * easeOut;

        drawWheel(currentAngle);

        // Tactile ticking vibration as each wheel peg / slice passes
        if (Math.abs(currentAngle - lastTickAngle) >= sliceAngle) {
          triggerHaptic(HapticPattern.SPIN_TICK);
          lastTickAngle = currentAngle;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setSpinning(false);
          setWonReward(reward);
          onSpinSuccess(reward, data.user);
          soundService.playCoin();
          triggerHaptic(HapticPattern.SPIN_WIN);

          if (reward.amount > 0) {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        }
      };

      requestAnimationFrame(animate);
    } catch (err: any) {
      setSpinning(false);
      triggerHaptic(HapticPattern.INVEST_ERROR);
      setErrorMsg(err.message || 'Spin error occurred');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="text-white rounded-3xl max-w-xs w-full p-4 border border-amber-400/50 shadow-2xl relative overflow-hidden bg-purple-950 bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(to bottom, rgba(30, 27, 75, 0.85), rgba(15, 23, 42, 0.95)), url(${palmpaySpinBg})` }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-purple-900/80 hover:bg-purple-800 text-purple-200 z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-1 bg-amber-500/25 text-amber-300 border border-amber-400/50 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-3 h-3 text-amber-300" /> PalmPay Spin & Win
          </div>
          <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
            YAMAHA Fortune Wheel
          </h2>
          <p className="text-[11px] text-purple-200/90 font-medium">
            Win up to ₦10,000 instant wallet credit!
          </p>
        </div>

        {/* Wheel Container - Compact 220px */}
        <div className="relative flex flex-col items-center justify-center my-2">
          {/* Top Needle Pointer */}
          <div className="z-10 -mb-2.5 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-amber-400 drop-shadow-md"></div>

          {/* Canvas Wheel */}
          <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-amber-400 via-purple-600 to-amber-300 shadow-2xl border-2 border-amber-300/80">
            <canvas ref={canvasRef} width={220} height={220} className="rounded-full shadow-inner" />
          </div>
        </div>

        {/* Status / Win Alert */}
        {wonReward && (
          <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border border-emerald-500/60 text-center animate-bounce">
            <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-1" />
            <p className="text-xs text-emerald-200 font-semibold">
              {wonReward.amount > 0 ? 'Instant Cash Credited!' : 'Result'}
            </p>
            <p className="text-lg font-black text-amber-300">
              {wonReward.amount > 0 ? `+₦${wonReward.amount.toLocaleString()}` : wonReward.label}
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="my-2 p-2.5 rounded-xl bg-red-900/60 border border-red-500/50 text-xs text-red-200 text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Spin Count & Action Button */}
        <div className="mt-4 flex flex-col items-center gap-2">
          <div className="text-xs text-purple-200 flex items-center gap-1.5 bg-purple-900/80 px-3 py-1 rounded-full border border-purple-700">
            <span>Available Spins:</span>
            <span className="font-extrabold text-amber-300">{user ? user.spinsAvailable || 0 : 0}</span>
          </div>

          <button
            onClick={handleSpin}
            disabled={spinning}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-purple-950 font-black text-base shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
          >
            {spinning ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-purple-950" />
                Spinning Wheel...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 fill-purple-950" />
                SPIN WHEEL NOW
              </>
            )}
          </button>

          <p className="text-[10px] text-purple-300/70 text-center mt-1">
            * Earn 1 free spin for every friend who registers using your referral link!
          </p>
        </div>
      </div>
    </div>
  );
};

// Movable Floating Spin Button Component
export const FloatingSpinButton: React.FC<{ onClick: () => void; spinCount: number }> = ({
  onClick,
  spinCount,
}) => {
  return (
    <div className="fixed bottom-20 right-4 z-30 animate-bounce">
      <button
        onClick={onClick}
        className="group relative p-3 rounded-full bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-300 text-purple-950 font-black shadow-2xl shadow-amber-500/50 border-2 border-white flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        <Sparkles className="w-7 h-7 text-purple-950 animate-pulse" />
        {spinCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white font-black text-[10px] flex items-center justify-center border border-white">
            {spinCount}
          </span>
        )}
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-purple-950 text-amber-300 font-extrabold text-[9px] px-2 py-0.5 rounded-full border border-purple-700 shadow-md">
          SPIN & WIN
        </span>
      </button>
    </div>
  );
};
