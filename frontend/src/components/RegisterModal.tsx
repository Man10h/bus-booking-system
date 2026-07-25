import React, { useState } from 'react';
import { User, Mail, Lock, Phone, MapPin, X, AlertCircle, Loader, CheckSquare, Square } from 'lucide-react';
import { authService } from '../services/authService';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
  onLoginRedirect: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onLoginRedirect 
}) => {
  // Input fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rePassword, setRePassword] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('MALE');

  // Checkboxes
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  // States
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!fullName || !email || !phone || !password || !rePassword) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }
    if (password !== rePassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }
    if (!acceptTerms || !acceptPrivacy) {
      setError('Bạn phải đọc và đồng ý với Điều khoản sử dụng & Chính sách bảo mật.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.register({
        email,
        password,
        rePassword,
        phone,
        fullName,
        address,
        gender
      });
      onSuccess(email);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Đăng ký tài khoản thất bại. Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white text-gray-800 rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-10 my-8 animate-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-baolau-dark text-white p-4 px-6 flex items-center justify-between">
          <h2 className="font-oswald text-xl font-bold tracking-wider text-baolau-yellow uppercase">
            Đăng Ký Tài Khoản Mới
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column 1: Personal Details */}
            <div className="space-y-4">
              <h3 className="font-oswald text-md font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1">
                Thông tin cá nhân
              </h3>
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Họ và Tên *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 pl-10 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              {/* Gender & Address */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Phone size={14} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09xxxxxxxx"
                      className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 pl-9 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Địa chỉ</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <MapPin size={16} />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Quận 1, TP. Hồ Chí Minh"
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 pl-10 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Account Security */}
            <div className="space-y-4">
              <h3 className="font-oswald text-md font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-1 flex items-center justify-between">
                <span>Thông tin đăng nhập</span>
                <span className="text-[10px] bg-baolau-yellow/20 text-baolau-yellow px-2 py-0.5 rounded font-sans font-bold">MÃ HÓA BẢO MẬT</span>
              </h3>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Địa chỉ Email *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="username@gmail.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 pl-10 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu bảo mật"
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 pl-10 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              {/* Re-password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nhập lại Mật khẩu *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type="password"
                    value={rePassword}
                    onChange={(e) => setRePassword(e.target.value)}
                    placeholder="Xác nhận mật khẩu"
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 pl-10 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Privacy Policies */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="font-oswald text-md font-semibold text-gray-500 uppercase tracking-wider pb-1">
              Chính sách & Điều khoản
            </h3>
            
            {/* Scrollbox Terms */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded text-xs text-gray-500 h-24 overflow-y-auto space-y-2">
              <p className="font-semibold">ĐIỀU KHOẢN SỬ DỤNG DỊCH VỤ BAOLAU BUS BOOKING SYSTEM</p>
              <p>1. Bằng việc đăng ký tài khoản, khách hàng cam kết cung cấp thông tin cá nhân chính xác và hoàn toàn chịu trách nhiệm về thông tin đã cung cấp.</p>
              <p>2. Dịch vụ đặt vé chỉ có hiệu lực sau khi hệ thống ghi nhận thanh toán thành công và gửi mã vé điện tử qua email.</p>
              <p>3. Các chính sách đổi vé, hủy vé và hoàn tiền sẽ được áp dụng theo quy định chi tiết của từng nhà xe liên kết.</p>
            </div>

            {/* Checkbox Terms */}
            <div 
              onClick={() => setAcceptTerms(!acceptTerms)} 
              className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer select-none"
            >
              {acceptTerms ? (
                <CheckSquare size={16} className="text-baolau-cyan" />
              ) : (
                <Square size={16} className="text-gray-400" />
              )}
              <span>Tôi xác nhận đã đọc và chấp nhận <span className="text-baolau-cyan hover:underline">Điều khoản sử dụng</span></span>
            </div>

            {/* Scrollbox Privacy */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded text-xs text-gray-500 h-24 overflow-y-auto space-y-2">
              <p className="font-semibold">CHÍNH SÁCH BẢO MẬT THÔNG TIN</p>
              <p>1. Mọi thông tin cá nhân của khách hàng sẽ được mã hóa và bảo mật tuyệt đối.</p>
              <p>2. Chúng tôi cam kết không bán hoặc chia sẻ thông tin người dùng cho bên thứ ba ngoại trừ mục đích phục vụ quy trình đặt vé và thanh toán trực tuyến.</p>
              <p>3. Hệ thống có quyền gửi thông báo trạng thái hành trình, biên lai thanh toán và OTP thông qua email đã đăng ký.</p>
            </div>

            {/* Checkbox Privacy */}
            <div 
              onClick={() => setAcceptPrivacy(!acceptPrivacy)} 
              className="flex items-center space-x-2 text-xs text-gray-700 cursor-pointer select-none"
            >
              {acceptPrivacy ? (
                <CheckSquare size={16} className="text-baolau-cyan" />
              ) : (
                <Square size={16} className="text-gray-400" />
              )}
              <span>Tôi xác nhận đã đọc và chấp nhận <span className="text-baolau-cyan hover:underline">Chính sách bảo mật</span></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-4">
            <button
              type="button"
              onClick={onLoginRedirect}
              className="text-sm text-baolau-cyan hover:underline transition"
            >
              Đã có tài khoản? Quay lại Đăng nhập
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto bg-baolau-green hover:bg-baolau-green-hover disabled:bg-baolau-green/50 text-white font-bold px-8 py-3 rounded transition flex items-center justify-center space-x-2 text-sm uppercase"
            >
              {isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>GỬI</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
