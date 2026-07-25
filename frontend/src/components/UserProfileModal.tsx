import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { X, User, Key, CheckCircle, AlertCircle, Loader, Edit } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuthStore();
  
  const [tab, setTab] = useState<'view' | 'edit' | 'password'>('view');
  
  // Profile Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gender, setGender] = useState('MALE');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Password Fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync state with currentUser when modal opens or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.fullName);
      setPhone(currentUser.phone);
      setAddress(currentUser.address || '');
      setGender(currentUser.gender || 'MALE');
      setAvatarUrl(currentUser.avatarUrl || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authService.updateProfile({
        fullName,
        phone,
        address,
        gender,
        avatarUrl
      });
      setSuccess('Cập nhật thông tin cá nhân thành công!');
      setTimeout(() => {
        setTab('view');
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể cập nhật hồ sơ cá nhân.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và mật khẩu xác nhận không khớp.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.changePassword({
        oldPassword,
        newPassword,
        confirmPassword
      });
      setSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setTab('view');
        setSuccess(null);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white text-gray-800 rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-baolau-dark text-white p-4 px-6 flex items-center justify-between">
          <h2 className="font-oswald text-xl font-bold tracking-wider text-baolau-yellow uppercase">
            Hồ Sơ Cá Nhân
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition focus:outline-none">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8">
          {error && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-200 text-red-600 p-3 rounded mb-4 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 bg-green-50 border border-green-200 text-green-600 p-3 rounded mb-4 text-sm">
              <CheckCircle size={16} className="shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* TAB 1: VIEW DETAILS */}
          {tab === 'view' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-baolau-yellow/15 flex items-center justify-center text-baolau-yellow overflow-hidden border border-baolau-yellow/30 shrink-0">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{currentUser.fullName}</h3>
                  <p className="text-xs bg-baolau-dark text-baolau-yellow font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block">
                    {currentUser.role}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Email</p>
                  <p className="text-gray-900 font-medium break-all">{currentUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Số điện thoại</p>
                  <p className="text-gray-900 font-medium">{currentUser.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Giới tính</p>
                  <p className="text-gray-900 font-medium">
                    {currentUser.gender === 'MALE' ? 'Nam' : currentUser.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold uppercase">Địa chỉ</p>
                  <p className="text-gray-900 font-medium">{currentUser.address || 'Chưa cung cấp'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-6 border-t border-gray-100">
                <button
                  onClick={() => setTab('edit')}
                  className="flex-1 bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold py-2.5 rounded transition text-xs uppercase flex items-center justify-center space-x-2"
                >
                  <Edit size={14} />
                  <span>Sửa thông tin</span>
                </button>
                <button
                  onClick={() => setTab('password')}
                  className="flex-1 border border-baolau-yellow text-baolau-dark hover:bg-baolau-yellow/10 font-bold py-2.5 rounded transition text-xs uppercase flex items-center justify-center space-x-2"
                >
                  <Key size={14} />
                  <span>Đổi mật khẩu</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: EDIT PROFILE */}
          {tab === 'edit' && (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Họ và Tên</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                  required
                />
              </div>

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
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Đường dẫn ảnh đại diện (Avatar URL)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                />
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTab('view')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded transition text-xs uppercase"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-baolau-green hover:bg-baolau-green-hover disabled:bg-baolau-green/50 text-white font-bold py-2.5 rounded transition text-xs uppercase flex items-center justify-center space-x-2"
                >
                  {isLoading ? <Loader size={14} className="animate-spin" /> : null}
                  <span>LƯU THAY ĐỔI</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CHANGE PASSWORD */}
          {tab === 'password' && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu cũ</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                  required
                />
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTab('view')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded transition text-xs uppercase"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-baolau-green hover:bg-baolau-green-hover disabled:bg-baolau-green/50 text-white font-bold py-2.5 rounded transition text-xs uppercase flex items-center justify-center space-x-2"
                >
                  {isLoading ? <Loader size={14} className="animate-spin" /> : null}
                  <span>ĐỔI MẬT KHẨU</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
