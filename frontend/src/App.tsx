import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useBookingStore } from './store/useBookingStore';
import { Navbar } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { OtpModal } from './components/OtpModal';
import { UserProfileModal } from './components/UserProfileModal';
import { RouteList } from './components/RouteList';
import { ScheduleList } from './components/ScheduleList';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MyBookings } from './components/MyBookings';
import { PaymentHistory } from './components/PaymentHistory';
import { OperatorLayout } from './components/operator/OperatorLayout';
import { Explore } from './components/Explore';
import { AdminPanel } from './components/admin/AdminPanel';
import { useNotificationStore } from './store/useNotificationStore';
import { 
  Search, 
  Calendar, 
  MapPin, 
  ArrowRightLeft, 
  Shield, 
  Clock, 
  Award, 
  ListFilter,
  CalendarDays,
  Loader2
} from 'lucide-react';
import './App.css';

function App() {
  const { restoreSession, isAuthenticated, currentUser } = useAuthStore();
  const { fetchNotifications, reset: resetNotifications } = useNotificationStore();
  
  const {
    departureCity,
    arrivalCity,
    departureDate,
    routes,
    schedules,
    cityOptions,
    isLoading,
    error,
    setDepartureCity,
    setArrivalCity,
    setDepartureDate,
    loadCities,
    fetchRoutes,
    fetchSchedules
  } = useBookingStore();

  // Search active tab state: 'schedules' | 'routes'
  const [activeTab, setActiveTab] = useState<'schedules' | 'routes'>('schedules');
  const [hasSearched, setHasSearched] = useState(false);

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  // Load session and cities on mount
  useEffect(() => {
    restoreSession();
    loadCities();
  }, []);

  // Fetch or reset notifications based on auth state
  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'USER') {
      fetchNotifications(0, 10);
    } else {
      resetNotifications();
    }
  }, [isAuthenticated, currentUser]);

  const handleRegisterSuccess = (email: string) => {
    setIsRegisterOpen(false);
    setOtpEmail(email);
    setIsOtpOpen(true);
  };

  const handleOtpSuccess = () => {
    setIsOtpOpen(false);
    setIsLoginOpen(true);
  };

  const handleRegisterRedirect = () => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  };

  const handleLoginRedirect = () => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  };

  const handleSwapCities = () => {
    const temp = departureCity;
    setDepartureCity(arrivalCity);
    setArrivalCity(temp);
  };

  const handleSearch = async () => {
    setHasSearched(true);
    if (activeTab === 'schedules') {
      await fetchSchedules();
    } else {
      await fetchRoutes();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      
      {/* Header/Navbar */}
      <Navbar 
        onLoginClick={() => setIsLoginOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
      />

      <Routes>
        <Route path="/" element={
          <>
            {/* Hero Search Section */}
            <div className="relative min-h-[500px] md:min-h-[550px] flex items-center justify-center pt-16 bg-baolau-dark text-white overflow-hidden">
              {/* Background Overlay */}
              <div className="absolute inset-0 bg-cover bg-center opacity-25 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1920')]" />
              <div className="absolute inset-0 bg-gradient-to-t from-baolau-dark via-baolau-dark/60 to-transparent" />

              <div className="relative w-full max-w-5xl px-4 md:px-8 py-12 flex flex-col items-center z-10">
                
                {/* Tagline */}
                <h1 className="text-center font-oswald text-4xl md:text-5xl font-bold tracking-wider uppercase mb-3 max-w-3xl drop-shadow-lg">
                  Khám phá Việt Nam <br className="sm:hidden" />
                  <span className="text-baolau-yellow">bằng xe khách</span>
                </h1>
                <p className="text-center text-sm md:text-base text-gray-300 mb-8 max-w-xl drop-shadow-md">
                  Tìm kiếm tuyến đường, xem lịch trình chuyến xe và đặt chỗ giữ vé trực tuyến nhanh chóng.
                </p>

                {/* Search Card Container */}
                <div className="w-full bg-white text-gray-800 rounded-lg shadow-2xl p-6 border border-gray-100">
                  
                  {/* Search Tab Switcher */}
                  <div className="flex border-b border-gray-100 pb-4 mb-4 space-x-6">
                    <button
                      onClick={() => {
                        setActiveTab('schedules');
                        setHasSearched(false);
                      }}
                      className={`flex items-center space-x-1.5 pb-2 text-xs font-bold uppercase tracking-wider transition border-b-2 focus:outline-none ${
                        activeTab === 'schedules'
                          ? 'border-baolau-yellow text-baolau-dark'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <CalendarDays size={14} />
                      <span>Đặt vé lịch trình</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('routes');
                        setHasSearched(false);
                      }}
                      className={`flex items-center space-x-1.5 pb-2 text-xs font-bold uppercase tracking-wider transition border-b-2 focus:outline-none ${
                        activeTab === 'routes'
                          ? 'border-baolau-yellow text-baolau-dark'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <ListFilter size={14} />
                      <span>Tra cứu tuyến xe</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Origin City Dropdown */}
                    <div className={`${activeTab === 'schedules' ? 'md:col-span-4' : 'md:col-span-5'} space-y-1`}>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Từ</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400 z-10" size={18} />
                        <select
                          value={departureCity?.id || ''}
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            const city = cityOptions.find(c => c.id === id) || null;
                            setDepartureCity(city);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2.5 pl-10 text-sm focus:outline-none focus:border-baolau-yellow transition cursor-pointer"
                        >
                          <option value="">Chọn điểm xuất phát</option>
                          {cityOptions
                            .filter(city => city.id !== arrivalCity?.id)
                            .map(city => (
                              <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
 
                    {/* Swap Button Icon */}
                    <div className={`hidden md:flex ${activeTab === 'schedules' ? 'md:col-span-1' : 'md:col-span-2'} justify-center pt-5`}>
                      <button 
                        onClick={handleSwapCities}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full border border-gray-200 transition focus:outline-none shadow-sm"
                        title="Đổi điểm đi/đến"
                      >
                        <ArrowRightLeft size={16} />
                      </button>
                    </div>
 
                    {/* Destination City Dropdown */}
                    <div className={`${activeTab === 'schedules' ? 'md:col-span-4' : 'md:col-span-5'} space-y-1`}>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Đến</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400 z-10" size={18} />
                        <select
                          value={arrivalCity?.id || ''}
                          onChange={(e) => {
                            const id = Number(e.target.value);
                            const city = cityOptions.find(c => c.id === id) || null;
                            setArrivalCity(city);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2.5 pl-10 text-sm focus:outline-none focus:border-baolau-yellow transition cursor-pointer"
                        >
                          <option value="">Chọn điểm đến</option>
                          {cityOptions
                            .filter(city => city.id !== departureCity?.id)
                            .map(city => (
                              <option key={city.id} value={city.id}>{city.name}</option>
                            ))}
                        </select>
                      </div>
                    </div>
 
                    {/* Datepicker */}
                    {activeTab === 'schedules' && (
                      <div className="md:col-span-3 space-y-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                          Ngày khởi hành
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                          <input
                            type="date"
                            value={departureDate}
                            onChange={(e) => setDepartureDate(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2.5 pl-10 text-sm focus:outline-none focus:border-baolau-yellow transition"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Search Submit Button */}
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleSearch}
                      disabled={isLoading}
                      className="w-full md:w-auto bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold px-8 py-3 rounded shadow transition flex items-center justify-center space-x-2 text-sm uppercase tracking-wider"
                    >
                      {isLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Search size={16} />
                      )}
                      <span>{isLoading ? 'Đang tìm...' : 'Tìm kiếm'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-grow max-w-5xl w-full mx-auto px-4 md:px-8 py-10 space-y-12">
              
              {/* User Welcome Alert */}
              {isAuthenticated && currentUser && (
                <div className="bg-baolau-cyan/10 border border-baolau-cyan/20 rounded-lg p-4 flex items-center justify-between text-baolau-cyan">
                  <div className="flex items-center space-x-3 text-sm">
                    <Shield size={20} />
                    <span>Chào mừng quay trở lại, <strong>{currentUser.fullName}</strong>! Bạn đang đăng nhập với quyền <strong>{currentUser.role}</strong>.</span>
                  </div>
                  <button 
                    onClick={() => setIsProfileOpen(true)}
                    className="text-xs font-bold uppercase hover:underline"
                  >
                    Xem Hồ Sơ
                  </button>
                </div>
              )}

              {/* Dynamic Search Results Container */}
              {hasSearched ? (
                <section className="space-y-6">
                  
                  {/* Step Breadcrumbs */}
                  <div className="flex items-center justify-center space-x-2 md:space-x-4 text-xs font-bold text-gray-400 uppercase tracking-wider pb-4 border-b border-gray-200">
                    <span className="text-baolau-cyan">1. Tìm kiếm</span>
                    <span>→</span>
                    <span className={activeTab === 'schedules' ? 'text-baolau-yellow font-black' : ''}>
                      2. {activeTab === 'schedules' ? 'Chọn chuyến & ghế' : 'Xem tuyến xe'}
                    </span>
                    <span>→</span>
                    <span>3. Điền thông tin</span>
                    <span>→</span>
                    <span>4. Thanh toán</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <h2 className="font-oswald text-xl md:text-2xl font-bold uppercase tracking-wider text-gray-800">
                      {activeTab === 'schedules' ? 'Chuyến xe phù hợp' : 'Các tuyến xe tìm được'}
                    </h2>
                    <span className="text-xs text-gray-500">
                      Kết quả cho: <strong>{departureCity?.name || 'Mọi nơi'}</strong> → <strong>{arrivalCity?.name || 'Mọi nơi'}</strong>
                    </span>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-md">
                      {error}
                    </div>
                  )}

                  {/* List Components */}
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <Loader2 className="animate-spin text-baolau-cyan" size={40} />
                      <span className="text-gray-500 font-medium">Hệ thống đang truy vấn dữ liệu, vui lòng đợi...</span>
                    </div>
                  ) : activeTab === 'schedules' ? (
                    <ScheduleList schedules={schedules} />
                  ) : (
                    <RouteList routes={routes} />
                  )}

                </section>
              ) : (
                /* Landing/Homepage Promo content when not searched yet */
                <>
                  {/* Feature Highlights */}
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 bg-baolau-yellow/15 text-baolau-yellow rounded-full flex items-center justify-center animate-pulse">
                        <Shield size={22} />
                      </div>
                      <h3 className="font-bold text-gray-900">Thanh toán an toàn</h3>
                      <p className="text-sm text-gray-500">Mọi thông tin giao dịch đều được mã hóa bảo mật thông qua cổng thanh toán VNPay chính thức.</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 bg-baolau-green/15 text-baolau-green rounded-full flex items-center justify-center">
                        <Clock size={22} />
                      </div>
                      <h3 className="font-bold text-gray-900">Đặt chỗ nhanh chóng</h3>
                      <p className="text-sm text-gray-500">Đặt giữ chỗ tức thời chỉ trong 5 phút. Ghế nằm của bạn sẽ được giữ cố định trên hệ thống.</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 bg-baolau-cyan/15 text-baolau-cyan rounded-full flex items-center justify-center">
                        <Award size={22} />
                      </div>
                      <h3 className="font-bold text-gray-900">Hãng xe uy tín</h3>
                      <p className="text-sm text-gray-500">Liên kết chặt chẽ với các nhà xe giường nằm hàng đầu, đảm bảo dịch vụ chuyên nghiệp.</p>
                    </div>
                  </section>
                </>
              )}
            </main>
          </>
        } />
        
        <Route path="/my-bookings" element={
          <ProtectedRoute role="USER">
            <MyBookings />
          </ProtectedRoute>
        } />

        <Route path="/payment-history" element={
          <ProtectedRoute role="USER">
            <PaymentHistory />
          </ProtectedRoute>
        } />

        <Route path="/operator" element={
          <ProtectedRoute role="OPERATOR">
            <OperatorLayout />
          </ProtectedRoute>
        } />

        <Route path="/admin" element={
          <ProtectedRoute role="ADMIN">
            <AdminPanel />
          </ProtectedRoute>
        } />

        <Route path="/explore" element={<Explore />} />
      </Routes>

      {/* Footer */}
      <footer className="bg-baolau-dark text-gray-400 text-xs py-8 border-t border-white/5 mt-auto">
        <div className="max-w-5xl w-full mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Baolau Bus Booking. Bản quyền thuộc về Baolau System.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-white transition">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-white transition">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white transition">Liên hệ hỗ trợ</a>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onRegisterRedirect={handleRegisterRedirect}
      />

      <RegisterModal 
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={handleRegisterSuccess}
        onLoginRedirect={handleLoginRedirect}
      />

      <OtpModal 
        isOpen={isOtpOpen}
        email={otpEmail}
        onClose={() => setIsOtpOpen(false)}
        onSuccess={handleOtpSuccess}
      />

      <UserProfileModal 
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

    </div>
  );
}

export default App;
