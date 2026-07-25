import React, { useState } from 'react';
import { Mail, Key, X, AlertCircle, Loader } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegisterRedirect: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onRegisterRedirect }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.login({ email, password });
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin tài khoản.'
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
          <h2 className="text-center font-oswald text-3xl font-bold tracking-wider text-baolau-yellow uppercase mt-4 mb-2">
            Đăng Nhập
          </h2>
          <p className="text-center text-sm text-gray-400 mb-6">
            Vui lòng đăng nhập vào tài khoản của bạn
          </p>

          {error && (
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded mb-4 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="địa chỉ email"
                className="w-full bg-white/10 border border-white/10 rounded px-3 py-2.5 pl-10 text-white placeholder-gray-500 italic text-sm focus:outline-none focus:border-baolau-yellow/50 focus:bg-white/15 transition"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Key size={16} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mật khẩu"
                className="w-full bg-white/10 border border-white/10 rounded px-3 py-2.5 pl-10 text-white placeholder-gray-500 italic text-sm focus:outline-none focus:border-baolau-yellow/50 focus:bg-white/15 transition"
                required
              />
            </div>

            {/* Forget Password */}
            <div className="text-right">
              <a href="#" className="text-xs text-baolau-cyan hover:underline transition">
                Quên mật khẩu?
              </a>
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-baolau-yellow hover:bg-baolau-yellow/90 disabled:bg-baolau-yellow/50 text-baolau-dark font-bold uppercase tracking-wider py-3 rounded transition flex items-center justify-center space-x-2 text-sm"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>ĐĂNG NHẬP</span>
              )}
            </button>
          </form>

          {/* Bottom CTA to Register */}
          <div className="mt-8 pt-6 border-t border-white/5">
            <button
              onClick={onRegisterRedirect}
              className="w-full border border-baolau-yellow text-baolau-yellow hover:bg-baolau-yellow/5 font-bold uppercase tracking-wider py-3 rounded transition text-xs"
            >
              Chưa có tài khoản? Đăng ký ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
