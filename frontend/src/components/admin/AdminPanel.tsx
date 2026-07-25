import React, { useState } from 'react';
import { UserManagement } from './UserManagement';
import { ServiceClientManagement } from './ServiceClientManagement';
import { VehicleTypeManagement } from './VehicleTypeManagement';
import { Users, Key, Settings2, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

type AdminTab = 'users' | 'clients' | 'vehicleTypes';

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex pt-16">
      {/* Sidebar */}
      <aside className="w-64 bg-baolau-dark text-white flex flex-col justify-between shrink-0 border-r border-white/5">
        <div className="p-4 space-y-6">
          <div className="pb-4 border-b border-white/10">
            <h2 className="font-oswald text-sm font-bold uppercase tracking-wider text-baolau-yellow">Hệ Thống Quản Trị</h2>
            <p className="text-xs text-gray-400 mt-1">Admin Dashboard Panel</p>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-baolau-yellow text-baolau-dark'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users size={16} />
              <span>Quản lý người dùng</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-baolau-yellow text-baolau-dark'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Key size={16} />
              <span>Service Clients</span>
            </button>

            <button
              onClick={() => setActiveTab('vehicleTypes')}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'vehicleTypes'
                  ? 'bg-baolau-yellow text-baolau-dark'
                  : 'text-gray-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings2 size={16} />
              <span>Quản lý Loại xe</span>
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
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'clients' && <ServiceClientManagement />}
          {activeTab === 'vehicleTypes' && <VehicleTypeManagement />}
        </div>
      </main>
    </div>
  );
};
