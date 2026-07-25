import React, { useEffect, useState } from 'react';
import { useOperatorStore } from '../../store/useOperatorStore';
import { useBookingStore } from '../../store/useBookingStore';
import { operatorService } from '../../services/operatorService';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  Power, 
  Save, 
  X, 
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface StopInput {
  stopOrder: number;
  stopName: string;
  distanceFromStart: number;
  estimatedArrivalOffsetMinutes: number;
  isPickup: boolean;
  isDropOff: boolean;
  cityId: number;
}

export const OperatorRoutes: React.FC = () => {
  const { 
    routes, 
    routesPage, 
    fetchRoutes, 
    createRoute, 
    updateRoute, 
    deactivateRoute, 
    isLoading 
  } = useOperatorStore();
  const { cityOptions, loadCities } = useBookingStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRouteId, setEditingRouteId] = useState<number | null>(null);

  // Form states
  const [routeCode, setRouteCode] = useState('');
  const [departureCityId, setDepartureCityId] = useState<number | ''>('');
  const [arrivalCityId, setArrivalCityId] = useState<number | ''>('');
  const [distance, setDistance] = useState<number | ''>('');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState<number | ''>('');
  const [stops, setStops] = useState<StopInput[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes(0, 10);
    if (cityOptions.length === 0) {
      loadCities();
    }
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchRoutes(newPage, 10);
  };

  const handleOpenCreateModal = () => {
    setEditingRouteId(null);
    setRouteCode('');
    setDepartureCityId('');
    setArrivalCityId('');
    setDistance('');
    setEstimatedDurationMinutes('');
    setStops([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (route: any) => {
    try {
      const details = await operatorService.getRouteDetail(route.id);
      setEditingRouteId(details.id);
      setRouteCode(details.routeCode);
      
      // Find city IDs from city names
      const depCity = cityOptions.find(c => c.name === details.departureCityName);
      const arrCity = cityOptions.find(c => c.name === details.arrivalCityName);
      setDepartureCityId(depCity ? depCity.id : '');
      setArrivalCityId(arrCity ? arrCity.id : '');
      
      setDistance(details.distance);
      setEstimatedDurationMinutes(details.estimatedDurationMinutes);
      
      // Transform route stops from backend (if any)
      const transformedStops = (details.routeStopResponse || []).map((stop: any) => {
        const stopCity = cityOptions.find(c => c.name === stop.cityName);
        return {
          stopOrder: stop.stopOrder,
          stopName: stop.stopName,
          distanceFromStart: stop.distanceFromStart,
          estimatedArrivalOffsetMinutes: stop.estimatedArrivalOffsetMinutes,
          isPickup: stop.isPickup,
          isDropOff: stop.isDropOff,
          cityId: stopCity ? stopCity.id : 0
        };
      });
      setStops(transformedStops);
      setFormError(null);
      setIsModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Lỗi tải chi tiết tuyến đường');
    }
  };

  const handleAddStop = () => {
    const nextOrder = stops.length + 1;
    setStops([
      ...stops,
      {
        stopOrder: nextOrder,
        stopName: '',
        distanceFromStart: 0,
        estimatedArrivalOffsetMinutes: 0,
        isPickup: true,
        isDropOff: true,
        cityId: cityOptions[0]?.id || 0
      }
    ]);
  };

  const handleRemoveStop = (index: number) => {
    const updated = stops.filter((_, i) => i !== index).map((stop, i) => ({
      ...stop,
      stopOrder: i + 1
    }));
    setStops(updated);
  };

  const handleStopChange = (index: number, field: keyof StopInput, value: any) => {
    const updated = [...stops];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setStops(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!routeCode || !departureCityId || !arrivalCityId || !distance || !estimatedDurationMinutes) {
      setFormError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (departureCityId === arrivalCityId) {
      setFormError('Điểm đi và điểm đến không được trùng nhau.');
      return;
    }

    const payload = {
      routeCode,
      departureCityId: Number(departureCityId),
      arrivalCityId: Number(arrivalCityId),
      distance: Number(distance),
      estimatedDurationMinutes: Number(estimatedDurationMinutes),
      routeStops: stops.map(s => ({
        ...s,
        distanceFromStart: Number(s.distanceFromStart),
        estimatedArrivalOffsetMinutes: Number(s.estimatedArrivalOffsetMinutes)
      }))
    };

    try {
      if (editingRouteId !== null) {
        await updateRoute(editingRouteId, payload);
      } else {
        await createRoute(payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra khi lưu tuyến đường.');
    }
  };

  const handleDeactivate = async (routeId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn thay đổi trạng thái hoạt động của tuyến xe này?')) {
      try {
        await deactivateRoute(routeId);
      } catch (err: any) {
        alert(err.message || 'Lỗi thay đổi trạng thái tuyến xe');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-oswald text-2xl font-bold uppercase tracking-wider text-gray-800">
            Quản lý tuyến đường & Trạm dừng
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Xem danh sách tuyến xe chạy và thiết lập lộ trình đón/trả khách cho từng tuyến.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-baolau-cyan hover:bg-baolau-cyan/90 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded shadow transition flex items-center space-x-1.5"
        >
          <Plus size={16} />
          <span>Thêm tuyến chạy</span>
        </button>
      </div>

      {/* Routes List Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-200">
                <th className="p-4">Mã Tuyến</th>
                <th className="p-4">Điểm Xuất Phát</th>
                <th className="p-4">Điểm Đến</th>
                <th className="p-4">Khoảng Cách</th>
                <th className="p-4">Thời Gian Đi</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {routes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    Không có tuyến chạy nào được thiết lập.
                  </td>
                </tr>
              ) : (
                routes.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-bold text-gray-900">{route.routeCode}</td>
                    <td className="p-4 font-semibold text-baolau-dark">{route.departureCityName}</td>
                    <td className="p-4 font-semibold text-baolau-dark">{route.arrivalCityName}</td>
                    <td className="p-4">{route.distance} km</td>
                    <td className="p-4">{route.estimatedDurationMinutes} phút (~{Math.round(route.estimatedDurationMinutes/60)}h)</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        route.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-500'
                      }`}>
                        {route.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(route)}
                        className="p-1.5 bg-gray-100 hover:bg-baolau-yellow hover:text-baolau-dark rounded text-gray-500 transition"
                        title="Chỉnh sửa tuyến đường"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeactivate(route.id)}
                        className={`p-1.5 rounded transition ${
                          route.status === 'ACTIVE'
                            ? 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white'
                            : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-600 hover:text-white'
                        }`}
                        title={route.status === 'ACTIVE' ? 'Tạm dừng tuyến xe' : 'Kích hoạt lại tuyến xe'}
                      >
                        <Power size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {routesPage.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Tổng số <strong>{routesPage.totalElements}</strong> kết quả
            </span>
            <div className="flex space-x-1">
              <button
                disabled={routesPage.currentPage === 0 || isLoading}
                onClick={() => handlePageChange(routesPage.currentPage - 1)}
                className="p-1 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 border border-gray-200 rounded bg-white text-xs font-semibold text-gray-700">
                {routesPage.currentPage + 1} / {routesPage.totalPages}
              </span>
              <button
                disabled={routesPage.currentPage >= routesPage.totalPages - 1 || isLoading}
                onClick={() => handlePageChange(routesPage.currentPage + 1)}
                className="p-1 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl border border-gray-100 my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="font-oswald text-lg font-bold uppercase tracking-wider text-gray-800">
                {editingRouteId ? 'Cập nhật tuyến đường' : 'Thêm tuyến chạy mới'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded flex items-center space-x-2">
                  <X size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Main Route Info fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Mã Tuyến *</label>
                  <input
                    type="text"
                    required
                    value={routeCode}
                    onChange={(e) => setRouteCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition"
                    placeholder="Ví dụ: HN-HP-01"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm Đi *</label>
                  <select
                    required
                    value={departureCityId}
                    onChange={(e) => setDepartureCityId(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition cursor-pointer"
                  >
                    <option value="">Chọn điểm đi</option>
                    {cityOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Điểm Đến *</label>
                  <select
                    required
                    value={arrivalCityId}
                    onChange={(e) => setArrivalCityId(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition cursor-pointer"
                  >
                    <option value="">Chọn điểm đến</option>
                    {cityOptions.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Khoảng Cách (km) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={distance}
                    onChange={(e) => setDistance(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition"
                    placeholder="Nhập số km (ví dụ: 120)"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian đi dự kiến (phút) *</label>
                  <input
                    type="number"
                    required
                    value={estimatedDurationMinutes}
                    onChange={(e) => setEstimatedDurationMinutes(e.target.value !== '' ? Number(e.target.value) : '')}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition"
                    placeholder="Nhập số phút chạy xe (ví dụ: 180)"
                  />
                </div>
              </div>

              {/* Dynamic Stops Config */}
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center space-x-1.5">
                    <MapPin size={14} className="text-baolau-cyan" />
                    <span>Lộ trình các trạm dừng đón / trả khách</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddStop}
                    className="bg-gray-100 hover:bg-gray-200 text-baolau-cyan font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded transition flex items-center space-x-1"
                  >
                    <Plus size={12} />
                    <span>Thêm trạm dừng</span>
                  </button>
                </div>

                {stops.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">
                    Chưa có trạm dừng trung gian nào được thêm. Chuyến xe sẽ chạy thẳng không dừng đón/trả dọc đường.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {stops.map((stop, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded-md border border-gray-100 relative">
                        <div className="md:col-span-1 text-center font-black text-xs text-baolau-cyan">
                          #{stop.stopOrder}
                        </div>
                        
                        <div className="md:col-span-3 space-y-0.5">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase">Tên trạm dừng</label>
                          <input
                            type="text"
                            required
                            value={stop.stopName}
                            onChange={(e) => handleStopChange(index, 'stopName', e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-baolau-cyan transition"
                            placeholder="Ví dụ: Bến xe Vĩnh Niệm"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-0.5">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase">Tỉnh / Thành</label>
                          <select
                            value={stop.cityId}
                            onChange={(e) => handleStopChange(index, 'cityId', Number(e.target.value))}
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-baolau-cyan transition cursor-pointer"
                          >
                            {cityOptions.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2 space-y-0.5">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase">Cách điểm đầu (km)</label>
                          <input
                            type="number"
                            required
                            value={stop.distanceFromStart}
                            onChange={(e) => handleStopChange(index, 'distanceFromStart', Number(e.target.value))}
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-baolau-cyan transition"
                          />
                        </div>

                        <div className="md:col-span-2 space-y-0.5">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase">Thời gian lệch (phút)</label>
                          <input
                            type="number"
                            required
                            value={stop.estimatedArrivalOffsetMinutes}
                            onChange={(e) => handleStopChange(index, 'estimatedArrivalOffsetMinutes', Number(e.target.value))}
                            className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-baolau-cyan transition"
                          />
                        </div>

                        <div className="md:col-span-1 flex justify-around pt-3 md:pt-0">
                          <label className="flex flex-col items-center space-y-0.5 cursor-pointer">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Đón</span>
                            <input
                              type="checkbox"
                              checked={stop.isPickup}
                              onChange={(e) => handleStopChange(index, 'isPickup', e.target.checked)}
                              className="rounded border-gray-300 text-baolau-cyan focus:ring-baolau-cyan cursor-pointer"
                            />
                          </label>
                          <label className="flex flex-col items-center space-y-0.5 cursor-pointer">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Trả</span>
                            <input
                              type="checkbox"
                              checked={stop.isDropOff}
                              onChange={(e) => handleStopChange(index, 'isDropOff', e.target.checked)}
                              className="rounded border-gray-300 text-baolau-cyan focus:ring-baolau-cyan cursor-pointer"
                            />
                          </label>
                        </div>

                        <div className="md:col-span-1 text-right pt-2 md:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveStop(index)}
                            className="p-1 bg-white hover:bg-red-50 border border-gray-200 hover:border-red-200 text-gray-400 hover:text-red-500 rounded transition"
                            title="Xóa trạm"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Buttons */}
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
                  <span>Lưu lại</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
