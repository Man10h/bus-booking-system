import React, { useState, useEffect } from 'react';
import { useOperatorStore } from '../../store/useOperatorStore';
import { OperatorProfile } from './OperatorProfile';
import { OperatorRoutes } from './OperatorRoutes';
import { OperatorVehicles } from './OperatorVehicles';
import { OperatorSchedules } from './OperatorSchedules';
import { 
  Building2, 
  MapPin, 
  Bus, 
  Calendar, 
  ShieldAlert, 
  Loader2, 
  LogOut 
} from 'lucide-react';
import { Link } from 'react-router-dom';

type TabType = 'profile' | 'routes' | 'vehicles' | 'schedules';

export const OperatorLayout: React.FC = () => {
  const { fetchProfile, createProfile, profile, isLoading } = useOperatorStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Registration Form States
  const [companyName, setCompanyName] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleRegisterProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setIsRegistering(true);
    try {
      await createProfile({ companyName, taxCode, contactPhone });
    } catch (err: any) {
      setRegisterError(err.message || 'Đăng ký thông tin nhà xe thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-baolau-cyan mx-auto" size={40} />
          <p className="text-gray-500 font-medium">Đang tải thông tin nhà xe...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center pt-16 px-4">
        <div className="max-w-md w-full bg-white border-t-4 border-baolau-yellow border-x border-b border-gray-200 shadow-lg p-6 space-y-6">
          <div className="text-center space-y-2 pb-4 border-b border-gray-100">
            <Building2 className="text-baolau-yellow mx-auto" size={48} />
            <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-gray-800">
              Đăng ký hồ sơ nhà xe
            </h2>
            <p className="text-xs text-gray-500 font-sans">
              Tài khoản của bạn đã được cấp quyền Nhà xe. Vui lòng hoàn tất thông tin thương hiệu để bắt đầu quản trị.
            </p>
          </div>

          <form onSubmit={handleRegisterProfile} className="space-y-4 font-sans">
            {registerError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded flex items-center space-x-2">
                <ShieldAlert size={16} className="shrink-0 text-red-500" />
                <span>{registerError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Tên công ty / Nhà xe *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                placeholder="Ví dụ: Hoàng Long Limousine"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Mã số thuế *</label>
              <input
                type="text"
                required
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                placeholder="Nhập mã số thuế doanh nghiệp"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider font-semibold">Số điện thoại liên hệ *</label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow focus:bg-white transition"
                placeholder="Hotline hỗ trợ khách hàng"
              />
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <Link
                to="/"
                className="flex-1 text-center py-2.5 border border-gray-200 text-gray-500 font-bold rounded text-xs hover:bg-gray-50 transition uppercase tracking-wider"
              >
                Trang chủ
              </Link>
              <button
                type="submit"
                disabled={isRegistering}
                className="flex-grow bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold text-xs uppercase tracking-wider py-2.5 rounded shadow transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isRegistering ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : null}
                <span>ĐĂNG KÝ HỒ SƠ</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex pt-16">
      {/* Sidebar */}
      <aside className="w-64 bg-baolau-dark text-white flex flex-col justify-between shrink-0 border-r border-white/5">
        <div className="p-4 space-y-6">
          <div className="pb-4 border-b border-white/10">
            <h2 className="font-oswald text-sm font-bold uppercase tracking-wider text-baolau-yellow">Kênh Nhà Xe</h2>
            <p className="text-xs text-gray-400 mt-1 truncate">{profile?.companyName}</p>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'profile'
                  ? 'bg-baolau-yellow text-baolau-dark'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Building2 size={16} />
              <span>Hồ sơ & Ví Merchant</span>
            </button>

            <button
              onClick={() => setActiveTab('routes')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'routes'
                  ? 'bg-baolau-yellow text-baolau-dark'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MapPin size={16} />
              <span>Tuyến đường & Trạm</span>
            </button>

            <button
              onClick={() => setActiveTab('vehicles')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'vehicles'
                  ? 'bg-baolau-yellow text-baolau-dark'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Bus size={16} />
              <span>Quản lý xe & Ghế</span>
            </button>

            <button
              onClick={() => setActiveTab('schedules')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition ${
                activeTab === 'schedules'
                  ? 'bg-baolau-yellow text-baolau-dark'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Calendar size={16} />
              <span>Quản lý lịch trình</span>
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-white/10">
          <Link
            to="/"
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded bg-white/5 text-gray-300 hover:bg-red-500/10 hover:text-red-400 text-xs font-bold uppercase tracking-wider transition"
          >
            <LogOut size={14} />
            <span>Thoát kênh quản trị</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {activeTab === 'profile' && <OperatorProfile />}
          {activeTab === 'routes' && <OperatorRoutes />}
          {activeTab === 'vehicles' && <OperatorVehicles />}
          {activeTab === 'schedules' && <OperatorSchedules />}
        </div>
      </main>
    </div>
  );
};
