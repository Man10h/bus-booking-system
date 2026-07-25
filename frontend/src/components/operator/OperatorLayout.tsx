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
  const { fetchProfile, profile, isLoading, error } = useOperatorStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  useEffect(() => {
    fetchProfile();
  }, []);

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

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-16 px-4">
        <div className="max-w-md w-full bg-white p-6 rounded-lg border border-red-200 text-center space-y-4 shadow-sm">
          <ShieldAlert className="text-red-500 mx-auto" size={48} />
          <h2 className="font-oswald text-xl font-bold uppercase text-gray-800">Không tìm thấy thông tin nhà xe</h2>
          <p className="text-sm text-gray-600">
            Tài khoản của bạn đã được cấp quyền Operator nhưng chưa liên kết với thông tin nhà xe nào trên hệ thống. 
            Vui lòng liên hệ Admin để hoàn tất cấu hình.
          </p>
          <Link to="/" className="inline-block bg-baolau-dark hover:bg-baolau-dark/95 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded shadow">
            Quay lại trang chủ
          </Link>
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
