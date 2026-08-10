import React, { useEffect, useState } from 'react';
import { useOperatorStore } from '../../store/useOperatorStore';
import { 
  Plus, 
  Trash2, 
  Save, 
  X, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Bus
} from 'lucide-react';

export const OperatorSchedules: React.FC = () => {
  const {
    schedules,
    schedulesPage,
    routes,
    vehicles,
    fetchSchedules,
    fetchRoutes,
    fetchVehicles,
    createSchedule,
    cancelSchedule,
    isLoading
  } = useOperatorStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [routeId, setRouteId] = useState<number | ''>('');
  const [vehicleId, setVehicleId] = useState<number | ''>('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [basePrice, setBasePrice] = useState<number | ''>('');
  const [vipPrice, setVipPrice] = useState<number | ''>('');

  useEffect(() => {
    fetchSchedules(0, 10);
    fetchRoutes(0, 100);
    fetchVehicles(0, 100);
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchSchedules(newPage, 10);
  };

  const handleOpenCreateModal = () => {
    const firstActiveRoute = routes.find(r => r.status === 'ACTIVE');
    const firstActiveVehicle = vehicles.find(v => v.status === 'ACTIVE');
    setRouteId(firstActiveRoute?.id || '');
    setVehicleId(firstActiveVehicle?.id || '');
    setDepartureTime('');
    setArrivalTime('');
    setBasePrice('');
    setVipPrice('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!routeId || !vehicleId || !departureTime || !arrivalTime || !basePrice || !vipPrice) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    const depDate = new Date(departureTime);
    const arrDate = new Date(arrivalTime);

    if (arrDate <= depDate) {
      setFormError('Thời gian đến phải sau thời gian khởi hành.');
      return;
    }

    if (Number(vipPrice) < Number(basePrice)) {
      setFormError('Giá vé VIP không được nhỏ hơn giá vé thường.');
      return;
    }

    // Convert HTML picker value (YYYY-MM-DDTHH:mm) to Backend ISO LocalDateTime string (YYYY-MM-DDTHH:mm:ss)
    const formattedDeparture = `${departureTime}:00`;
    const formattedArrival = `${arrivalTime}:00`;

    const payload = {
      routeId: Number(routeId),
      vehicleId: Number(vehicleId),
      departureTime: formattedDeparture,
      arrivalTime: formattedArrival,
      basePrice: Number(basePrice),
      vipPrice: Number(vipPrice)
    };

    try {
      await createSchedule(payload);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi tạo lịch trình chuyến xe.');
    }
  };

  const handleCancelSchedule = async (scheduleId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy lịch trình chuyến xe này không? Khách hàng sẽ không thể đặt vé cho chuyến đi này nữa.')) {
      try {
        await cancelSchedule(scheduleId);
      } catch (err: any) {
        alert(err.message || 'Lỗi hủy lịch trình');
      }
    }
  };

  // Helper: Format Date String to human readable
  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      return `${time} - ${date}`;
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-oswald text-2xl font-bold uppercase tracking-wider text-gray-800">
            Quản lý lịch trình chuyến xe
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập giờ chạy, phân công xe khách chạy tuyến, định giá vé và theo dõi số ghế trống.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          disabled={routes.length === 0 || vehicles.length === 0}
          className="bg-baolau-cyan hover:bg-baolau-cyan/90 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded shadow transition flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          title={routes.length === 0 || vehicles.length === 0 ? 'Cần đăng ký tuyến xe và xe trước khi tạo lịch trình' : ''}
        >
          <Plus size={16} />
          <span>Tạo lịch trình</span>
        </button>
      </div>

      {/* Schedules List Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-200">
                <th className="p-4">Tuyến Xe</th>
                <th className="p-4">Xe Thực Hiện</th>
                <th className="p-4">Giờ Xuất Phát</th>
                <th className="p-4">Giờ Đến Dự Kiến</th>
                <th className="p-4">Giá Vé Thường</th>
                <th className="p-4">Giá Vé VIP</th>
                <th className="p-4">Còn Trống</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400 font-medium">
                    Chưa có lịch trình chuyến chạy nào được lên lịch.
                  </td>
                </tr>
              ) : (
                schedules.map((s) => {
                  // Find route details
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-4 font-bold text-gray-900">
                        {s.routeDetailResponse 
                          ? `${s.routeDetailResponse.routeCode} (${s.routeDetailResponse.departureCityName} → ${s.routeDetailResponse.arrivalCityName})` 
                          : `Tuyến #${s.id}`}
                      </td>
                      <td className="p-4 font-semibold text-baolau-dark">
                        <div className="flex items-center space-x-1">
                          <Bus size={12} className="text-gray-400" />
                          <span>
                            {s.vehicleResponse 
                              ? `${s.vehicleResponse.licensePlate} (${s.vehicleResponse.brand})` 
                              : `Xe #${s.id}`}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-medium text-gray-900">{formatDateTime(s.departureTime)}</td>
                      <td className="p-4 text-gray-500">{formatDateTime(s.arrivalTime)}</td>
                      <td className="p-4 font-bold text-baolau-cyan">{s.basePrice.toLocaleString('vi-VN')} đ</td>
                      <td className="p-4 font-bold text-baolau-yellow">{s.vipPrice.toLocaleString('vi-VN')} đ</td>
                      <td className="p-4 font-bold text-emerald-600">{s.availableSeats} / {s.totalSeats} ghế</td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          s.status === 'OPEN'
                            ? 'bg-emerald-50 text-emerald-600'
                            : s.status === 'CANCELLED'
                            ? 'bg-red-50 text-red-500'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {s.status === 'OPEN' ? 'Đang mở bán' : s.status === 'CANCELLED' ? 'Đã hủy' : s.status}
                        </span>
                      </td>
                      <td className="p-4 text-right flex justify-end space-x-2">
                        {s.status === 'OPEN' && (
                          <button
                            onClick={() => handleCancelSchedule(s.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded transition"
                            title="Hủy lịch trình"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {schedulesPage.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Tổng số <strong>{schedulesPage.totalElements}</strong> kết quả
            </span>
            <div className="flex space-x-1">
              <button
                disabled={schedulesPage.currentPage === 0 || isLoading}
                onClick={() => handlePageChange(schedulesPage.currentPage - 1)}
                className="p-1 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 border border-gray-200 rounded bg-white text-xs font-semibold text-gray-700">
                {schedulesPage.currentPage + 1} / {schedulesPage.totalPages}
              </span>
              <button
                disabled={schedulesPage.currentPage >= schedulesPage.totalPages - 1 || isLoading}
                onClick={() => handlePageChange(schedulesPage.currentPage + 1)}
                className="p-1 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="font-oswald text-lg font-bold uppercase tracking-wider text-gray-800">
                Lập lịch trình chuyến chạy mới
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded flex items-center space-x-2">
                  <X size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Tuyến chạy xe *</label>
                <select
                  required
                  value={routeId}
                  onChange={(e) => setRouteId(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition cursor-pointer"
                >
                  {routes.filter(r => r.status === 'ACTIVE').map(route => (
                    <option key={route.id} value={route.id}>
                      {route.routeCode} ({route.departureCityName} → {route.arrivalCityName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Xe phân công chạy *</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition cursor-pointer"
                >
                  {vehicles.filter(v => v.status === 'ACTIVE').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.licensePlate} ({v.brand} - {(v.vehicleType?.name || v.vehicleTypeResponse?.name || '')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ khởi hành *</label>
                  <input
                    type="datetime-local"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Giờ đến dự kiến *</label>
                  <input
                    type="datetime-local"
                    required
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Giá vé hạng thường (đ) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition"
                    placeholder="Ví dụ: 250000"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Giá vé hạng VIP (đ) *</label>
                  <input
                    type="number"
                    required
                    value={vipPrice}
                    onChange={(e) => setVipPrice(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition"
                    placeholder="Ví dụ: 350000"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded hover:bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-baolau-cyan hover:bg-baolau-cyan/90 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded shadow transition flex items-center space-x-1.5"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>Lên lịch bán</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
