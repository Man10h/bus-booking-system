import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/authService';
import { User, LogOut, ChevronDown, Globe, BookOpen, Compass, Ticket, Bell, Loader2, ShieldAlert } from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';

interface NavbarProps {
  onLoginClick: () => void;
  onProfileClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onProfileClick }) => {
  const { currentUser, isAuthenticated } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    isLoading,
    currentPage,
    totalPages,
    fetchNotifications,
    markNotificationAsRead
  } = useNotificationStore();

  const handleLogout = () => {
    authService.logout();
    setIsDropdownOpen(false);
    setIsNotifOpen(false);
  };

  const handleNotifToggle = () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    setIsDropdownOpen(false);
    if (nextState) {
      fetchNotifications(0, 10);
    }
  };

  const handleProfileToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setIsNotifOpen(false);
  };

  const isUser = isAuthenticated && currentUser?.role === 'USER';
  const isOperator = isAuthenticated && currentUser?.role === 'OPERATOR';
  const isAdmin = isAuthenticated && currentUser?.role === 'ADMIN';

  return (
    <nav className="fixed top-0 left-0 w-full z-40 bg-baolau-dark/95 backdrop-blur-md border-b border-white/5 text-white h-16 px-4 md:px-8 flex items-center justify-between">
      {/* Left: Brand/Logo */}
      <div className="flex items-center space-x-8">
        <Link to="/" className="flex items-center space-x-2 font-oswald text-2xl font-bold tracking-wider text-white">
          <span className="text-baolau-yellow">B</span>USBOOKING
        </Link>
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-300">
          <Link to="/" className="hover:text-baolau-yellow transition flex items-center space-x-1">
            <Compass size={16} />
            <span>Hành trình</span>
          </Link>
          <Link to="/explore" className="hover:text-baolau-yellow transition flex items-center space-x-1">
            <BookOpen size={16} />
            <span>Khám phá</span>
          </Link>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-4 md:space-x-6 text-sm">
        <div className="flex items-center space-x-1 cursor-pointer hover:text-baolau-yellow transition">
          <Globe size={16} />
          <span className="hidden sm:inline">Tiếng Việt</span>
        </div>

        {isUser && (
          <Link to="/my-bookings" className="hover:text-baolau-yellow transition hidden sm:inline flex items-center space-x-1">
            <Ticket size={16} />
            <span>Quản lý đặt chỗ</span>
          </Link>
        )}

        {isOperator && (
          <Link to="/operator" className="hover:text-baolau-yellow transition hidden sm:inline flex items-center space-x-1">
            <BookOpen size={16} />
            <span>Kênh Nhà Xe</span>
          </Link>
        )}

        {isAdmin && (
          <Link to="/admin" className="hover:text-baolau-yellow transition hidden sm:inline flex items-center space-x-1">
            <ShieldAlert size={16} />
            <span>Kênh Quản Trị</span>
          </Link>
        )}

        {isAuthenticated && currentUser ? (
          <div className="flex items-center space-x-4">
            {/* Bell Icon & Dropdown for USER role only */}
            {isUser && (
              <div className="relative">
                <button
                  onClick={handleNotifToggle}
                  className="relative p-1.5 hover:bg-white/10 rounded-full transition focus:outline-none text-gray-300 hover:text-white cursor-pointer"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-baolau-yellow text-baolau-dark font-bold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-baolau-dark">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 md:w-96 bg-baolau-dark border border-white/10 rounded-lg shadow-xl text-gray-200 z-50 animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col max-h-[500px]">
                    {/* Header */}
                    <div className="p-3 border-b border-white/5 flex items-center justify-between">
                      <span className="font-bold text-xs uppercase tracking-wider text-white">Thông báo</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-baolau-yellow/20 text-baolau-yellow px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} chưa đọc
                        </span>
                      )}
                    </div>

                    {/* List content */}
                    <div className="overflow-y-auto flex-grow divide-y divide-white/5 max-h-80">
                      {isLoading && notifications.length === 0 ? (
                        <div className="p-8 text-center flex justify-center items-center">
                          <Loader2 className="animate-spin text-baolau-cyan" size={20} />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-xs">
                          Không có thông báo mới nào
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (!item.isRead) {
                                markNotificationAsRead(item.id);
                              }
                            }}
                            className={`p-3.5 text-xs transition cursor-pointer flex gap-3 items-start ${
                              item.isRead ? 'opacity-65 hover:bg-white/2' : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            {/* Dot indicator for unread */}
                            {!item.isRead && (
                              <span className="w-2 h-2 mt-1.5 rounded-full bg-baolau-cyan shrink-0" />
                            )}
                            <div className="flex-grow space-y-1">
                              <p className="leading-relaxed text-gray-200">{item.content}</p>
                              <p className="text-[10px] text-gray-500">
                                {new Date(item.createdAt).toLocaleString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Load more button */}
                    {currentPage < totalPages - 1 && (
                      <div className="p-2 border-t border-white/5 text-center">
                        <button
                          onClick={() => fetchNotifications(currentPage + 1, 10, true)}
                          disabled={isLoading}
                          className="text-xs text-baolau-cyan hover:text-baolau-cyan/80 font-bold py-1 w-full flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          {isLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <span>Xem thêm thông báo</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={handleProfileToggle}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-full transition focus:outline-none cursor-pointer"
              >
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <User size={14} className="text-baolau-yellow" />
                )}
                <span className="font-semibold text-xs max-w-[100px] truncate">{currentUser.fullName}</span>
                <ChevronDown size={14} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-baolau-dark border border-white/10 rounded-lg shadow-xl py-1 text-gray-200 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      onProfileClick();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-baolau-yellow transition flex items-center space-x-2 cursor-pointer"
                  >
                    <User size={16} />
                    <span>Thông tin cá nhân</span>
                  </button>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsDropdownOpen(false)}
                      className="w-full text-left px-4 py-2 hover:bg-white/5 hover:text-baolau-yellow transition flex items-center space-x-2 cursor-pointer"
                    >
                      <ShieldAlert size={16} />
                      <span>Trang quản trị (Admin)</span>
                    </Link>
                  )}

                  <div className="border-t border-white/5 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition flex items-center space-x-2 cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="flex items-center space-x-1.5 bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-semibold px-4 py-1.5 rounded transition cursor-pointer"
          >
            <User size={16} />
            <span>Đăng nhập</span>
          </button>
        )}
      </div>
    </nav>
  );
};

