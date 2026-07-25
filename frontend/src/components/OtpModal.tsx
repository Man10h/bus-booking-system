import React, { useState } from 'react';
import { Shield, X, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { authService } from '../services/authService';

interface OtpModalProps {
  isOpen: boolean;
  email: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const OtpModal: React.FC<OtpModalProps> = ({ isOpen, email, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!code || code.length < 4) {
      setError('Mã xác thực không hợp lệ.');
      return;
    }

    setIsLoading(true);

    try {
      const verified = await authService.verifyOtp(email, code);
      if (verified) {
        setSuccessMsg('Xác thực tài khoản thành công!');
        setTimeout(() => {
          onSuccess();
          setCode('');
          setSuccessMsg(null);
        }, 1500);
      } else {
        setError('Mã xác thực không chính xác hoặc đã hết hạn.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Xác thực mã OTP thất bại. Vui lòng kiểm tra lại.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-baolau-dark text-white rounded-lg shadow-2xl border border-white/10 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition focus:outline-none"
        >
          <X size={20} />
        </button>

        {/* Form Body */}
        <div className="p-8">
          <div className="mx-auto w-12 h-12 bg-baolau-yellow/10 rounded-full flex items-center justify-center text-baolau-yellow mb-4">
            <Shield size={24} />
          </div>

          <h2 className="text-center font-oswald text-2xl font-bold tracking-wider text-baolau-yellow uppercase mb-2">
            Xác Thực OTP
          </h2>
          <p className="text-center text-xs text-gray-400 mb-6">
            Mã OTP đã được gửi tới email <br/>
            <span className="text-white font-medium">{email}</span>. <br/>
            Vui lòng kiểm tra và nhập mã xác thực gồm 6 chữ số bên dưới.
          </p>

          {error && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded mb-4 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 bg-baolau-green/10 border border-baolau-green/30 text-baolau-green p-3 rounded mb-4 text-sm">
              <CheckCircle size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* OTP Code input */}
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Nhập mã xác thực"
                maxLength={8}
                className="w-full bg-white/10 border border-white/10 rounded px-3 py-3 text-center tracking-widest text-lg font-bold text-white placeholder-gray-500 placeholder-normal focus:outline-none focus:border-baolau-yellow/50 focus:bg-white/15 transition"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !!successMsg}
              className="w-full bg-baolau-green hover:bg-baolau-green-hover disabled:bg-baolau-green/50 text-white font-bold uppercase tracking-wider py-3 rounded transition flex items-center justify-center space-x-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>XÁC NHẬN</span>
              )}
            </button>
          </form>

          {/* Resend Option */}
          <div className="text-center mt-6">
            <span className="text-xs text-gray-500">Không nhận được mã? </span>
            <button 
              type="button" 
              className="text-xs text-baolau-cyan hover:underline transition"
              onClick={() => alert('Yêu cầu gửi lại mã OTP đã được ghi nhận!')}
            >
              Gửi lại OTP
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
