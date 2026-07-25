import React, { useEffect, useState } from 'react';
import { useOperatorStore } from '../../store/useOperatorStore';
import { 
  Bus, 
  Plus, 
  Settings, 
  Power, 
  Save, 
  X, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Gem,
  ToggleLeft
} from 'lucide-react';
import type { SeatResponse, VehicleResponse } from '../../types/operator';

export const OperatorVehicles: React.FC = () => {
  const {
    vehicles,
    vehiclesPage,
    vehicleTypes,
    activeSeats,
    fetchVehicles,
    fetchVehicleTypes,
    createVehicle,
    updateVehicle,
    updateVehicleStatus,
    fetchVehicleSeats,
    updateSeatStatus,
    toggleSeatVip,
    isLoading
  } = useOperatorStore();

  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);

  // Form states
  const [licensePlate, setLicensePlate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleTypeId, setVehicleTypeId] = useState<number | ''>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Seat schema modal state
  const [isSeatsModalOpen, setIsSeatsModalOpen] = useState(false);
  const [configuringVehicle, setConfiguringVehicle] = useState<VehicleResponse | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatResponse | null>(null);
  const [seatActionLoading, setSeatActionLoading] = useState(false);

  useEffect(() => {
    fetchVehicles(0, 10);
    fetchVehicleTypes();
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchVehicles(newPage, 10);
  };

  const handleOpenCreateModal = () => {
    setEditingVehicleId(null);
    setLicensePlate('');
    setBrand('');
    setModel('');
    setDescription('');
    setVehicleTypeId(vehicleTypes[0]?.id || '');
    setFormError(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: VehicleResponse) => {
    setEditingVehicleId(vehicle.id);
    setLicensePlate(vehicle.licensePlate);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setDescription(vehicle.description);
    setVehicleTypeId(vehicle.vehicleType?.id || vehicle.vehicleTypeResponse?.id || '');
    setFormError(null);
    setIsVehicleModalOpen(true);
  };

  const handleOpenSeatsModal = async (vehicle: VehicleResponse) => {
    setConfiguringVehicle(vehicle);
    setSelectedSeat(null);
    setIsSeatsModalOpen(true);
    await fetchVehicleSeats(vehicle.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!licensePlate || !brand || !model || !vehicleTypeId) {
      setFormError('Vui lòng điền các trường bắt buộc.');
      return;
    }

    const payload = {
      licensePlate,
      brand,
      model,
      description,
      totalSeats: 0, // Backend calculates this automatically based on vehicleTypeId
      vehicleTypeId: Number(vehicleTypeId)
    };

    try {
      if (editingVehicleId !== null) {
        await updateVehicle(editingVehicleId, payload);
      } else {
        await createVehicle(payload);
      }
      setIsVehicleModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi lưu thông tin xe.');
    }
  };

  const handleToggleVehicleStatus = async (vehicleId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    if (window.confirm(`Bạn có muốn chuyển trạng thái xe thành ${nextStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm ngừng'} không?`)) {
      try {
        await updateVehicleStatus(vehicleId, nextStatus);
      } catch (err: any) {
        alert(err.message || 'Lỗi cập nhật trạng thái xe');
      }
    }
  };

  // Seat toggle status
  const handleToggleSeatStatus = async () => {
    if (!selectedSeat || !configuringVehicle) return;
    setSeatActionLoading(true);
    const nextStatus = selectedSeat.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateSeatStatus(selectedSeat.id, nextStatus);
      await fetchVehicleSeats(configuringVehicle.id);
      // Refresh selected seat state
      const updatedSeat = activeSeats.find(s => s.id === selectedSeat.id);
      if (updatedSeat) {
        setSelectedSeat({
          ...updatedSeat,
          status: nextStatus
        });
      } else {
        setSelectedSeat(null);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi thay đổi trạng thái ghế');
    } finally {
      setSeatActionLoading(false);
    }
  };

  // Seat toggle VIP
  const handleToggleSeatVip = async () => {
    if (!selectedSeat || !configuringVehicle) return;
    setSeatActionLoading(true);
    try {
      await toggleSeatVip(selectedSeat.id);
      await fetchVehicleSeats(configuringVehicle.id);
      // Refresh selected seat state
      const updatedSeat = activeSeats.find(s => s.id === selectedSeat.id);
      if (updatedSeat) {
        setSelectedSeat({
          ...updatedSeat,
          isVip: !selectedSeat.isVip
        });
      } else {
        setSelectedSeat(null);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi đổi hạng VIP ghế');
    } finally {
      setSeatActionLoading(false);
    }
  };

  // Render Seat Grid Helper
  const renderSeatMap = (floorNum: number) => {
    if (!configuringVehicle) return null;
    const vType = configuringVehicle.vehicleType || configuringVehicle.vehicleTypeResponse;
    if (!vType) return null;
    const { rows, cols } = vType;
    const floorSeats = activeSeats.filter(s => s.floor === floorNum);

    const grid = [];
    for (let r = 1; r <= rows; r++) {
      const rowCells = [];
      for (let c = 1; c <= cols; c++) {
        const seat = floorSeats.find(s => s.row === r && s.col === c);
        if (seat) {
          const isSelected = selectedSeat?.id === seat.id;
          let seatBg = 'bg-baolau-cyan text-white hover:bg-baolau-cyan/90'; // Regular active
          if (seat.status === 'INACTIVE') {
            seatBg = 'bg-gray-200 text-gray-400 border-dashed hover:bg-gray-300';
          } else if (seat.isVip) {
            seatBg = 'bg-baolau-yellow text-baolau-dark font-black hover:bg-baolau-yellow/90';
          }

          if (isSelected) {
            seatBg += ' ring-4 ring-offset-2 ring-baolau-dark';
          }

          rowCells.push(
            <button
              key={`${r}-${c}`}
              type="button"
              onClick={() => setSelectedSeat(seat)}
              className={`w-12 h-12 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center relative shadow-sm ${seatBg}`}
            >
              <span>{seat.seatNumber}</span>
              {seat.isVip && seat.status === 'ACTIVE' && (
                <Gem size={10} className="absolute top-1 right-1 text-baolau-dark/50" />
              )}
            </button>
          );
        } else {
          // Empty space
          rowCells.push(<div key={`${r}-${c}`} className="w-12 h-12" />);
        }
      }
      grid.push(
        <div key={r} className="flex justify-center gap-3">
          {rowCells}
        </div>
      );
    }

    return <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">{grid}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-oswald text-2xl font-bold uppercase tracking-wider text-gray-800">
            Quản lý đội xe & Cấu hình ghế
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Đăng ký xe, cấu hình sơ đồ ghế ngồi gốc, phân bổ ghế VIP và quản lý hoạt động xe.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-baolau-cyan hover:bg-baolau-cyan/90 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded shadow transition flex items-center space-x-1.5"
        >
          <Plus size={16} />
          <span>Thêm xe mới</span>
        </button>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 text-gray-400 font-bold uppercase border-b border-gray-200">
                <th className="p-4">Biển Số Xe</th>
                <th className="p-4">Hãng Xe</th>
                <th className="p-4">Model</th>
                <th className="p-4">Loại Xe</th>
                <th className="p-4">Tổng Số Ghế</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    Chưa có xe nào trong đội. Vui lòng bấm Thêm xe mới.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4 font-bold text-gray-900">{v.licensePlate}</td>
                    <td className="p-4 font-semibold text-baolau-dark">{v.brand}</td>
                    <td className="p-4">{v.model}</td>
                    <td className="p-4 font-medium text-baolau-cyan">{v.vehicleType?.name || v.vehicleTypeResponse?.name}</td>
                    <td className="p-4 font-bold">{v.totalSeats} ghế</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        v.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-red-50 text-red-500'
                      }`}>
                        {v.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngừng'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end space-x-2">
                      <button
                        onClick={() => handleOpenSeatsModal(v)}
                        className="p-1.5 bg-gray-100 hover:bg-baolau-cyan hover:text-white rounded text-gray-500 transition"
                        title="Cấu hình sơ đồ ghế"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(v)}
                        className="p-1.5 bg-gray-100 hover:bg-baolau-yellow hover:text-baolau-dark rounded text-gray-500 transition"
                        title="Chỉnh sửa xe"
                      >
                        <Settings size={14} className="rotate-45" />
                      </button>
                      <button
                        onClick={() => handleToggleVehicleStatus(v.id, v.status)}
                        className={`p-1.5 rounded transition ${
                          v.status === 'ACTIVE'
                            ? 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white'
                            : 'bg-emerald-50 text-emerald-500 hover:bg-emerald-600 hover:text-white'
                        }`}
                        title={v.status === 'ACTIVE' ? 'Tạm ngừng hoạt động xe' : 'Cho phép xe hoạt động'}
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
        {vehiclesPage.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Tổng số <strong>{vehiclesPage.totalElements}</strong> kết quả
            </span>
            <div className="flex space-x-1">
              <button
                disabled={vehiclesPage.currentPage === 0 || isLoading}
                onClick={() => handlePageChange(vehiclesPage.currentPage - 1)}
                className="p-1 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 py-1 border border-gray-200 rounded bg-white text-xs font-semibold text-gray-700">
                {vehiclesPage.currentPage + 1} / {vehiclesPage.totalPages}
              </span>
              <button
                disabled={vehiclesPage.currentPage >= vehiclesPage.totalPages - 1 || isLoading}
                onClick={() => handlePageChange(vehiclesPage.currentPage + 1)}
                className="p-1 border border-gray-200 rounded text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Form Modal */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl border border-gray-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="font-oswald text-lg font-bold uppercase tracking-wider text-gray-800">
                {editingVehicleId ? 'Cập nhật thông tin xe' : 'Đăng ký xe mới'}
              </h2>
              <button 
                onClick={() => setIsVehicleModalOpen(false)} 
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
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Biển Số Xe *</label>
                <input
                  type="text"
                  required
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition"
                  placeholder="Ví dụ: 29B-12345"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Hãng Sản Xuất *</label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition"
                    placeholder="Ví dụ: Thaco, Hyundai"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Dòng xe / Model *</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition"
                    placeholder="Ví dụ: Universe 2024"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Phân loại xe / Sơ đồ nguyên bản *</label>
                <select
                  required
                  value={vehicleTypeId}
                  onChange={(e) => setVehicleTypeId(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition cursor-pointer"
                >
                  {vehicleTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.floors} tầng, {type.rows} hàng, {type.cols} cột)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Mô tả tiện ích</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan transition resize-none"
                  placeholder="Wifi tốc độ cao, nước uống miễn phí, cổng sạc USB tại ghế..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
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

      {/* Seats Schema Config Modal */}
      {isSeatsModalOpen && configuringVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl border border-gray-100 my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-oswald text-lg font-bold uppercase tracking-wider text-gray-800">
                  Cấu hình sơ đồ ghế xe
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Xe: <strong className="text-gray-700">{configuringVehicle.licensePlate}</strong> | Loại: <strong className="text-gray-700">{configuringVehicle.vehicleType?.name || configuringVehicle.vehicleTypeResponse?.name}</strong>
                </p>
              </div>
              <button 
                onClick={() => setIsSeatsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Column: Sơ đồ ghế */}
              <div className="md:col-span-8 flex flex-col md:flex-row justify-center gap-8 items-center bg-gray-50/50 p-6 rounded-xl border border-gray-100">
                {(configuringVehicle.vehicleType?.floors || configuringVehicle.vehicleTypeResponse?.floors || 1) === 1 ? (
                  <div className="space-y-2 text-center">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sơ đồ ghế ngồi</span>
                    {renderSeatMap(1)}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tầng 1 (Dưới)</span>
                      {renderSeatMap(1)}
                    </div>
                    <div className="space-y-2 text-center">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tầng 2 (Trên)</span>
                      {renderSeatMap(2)}
                    </div>
                  </>
                )}
              </div>

              {/* Right Column: Panel chỉnh sửa ghế */}
              <div className="md:col-span-4 bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-6">
                <div>
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500">Cài đặt thuộc tính ghế</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Chọn một ghế trên sơ đồ để bắt đầu thay đổi.</p>
                </div>

                {selectedSeat ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase">Số ghế:</span>
                        <span className="font-oswald text-lg font-bold text-baolau-dark">{selectedSeat.seatNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase">Tầng:</span>
                        <span className="text-xs font-bold text-gray-700">Tầng {selectedSeat.floor}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase">Trạng thái:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          selectedSeat.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                        }`}>
                          {selectedSeat.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase">Hạng ghế:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          selectedSeat.isVip ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {selectedSeat.isVip ? 'VIP (Thêm phí)' : 'Regular'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={seatActionLoading}
                        onClick={handleToggleSeatStatus}
                        className="w-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider py-2.5 rounded shadow-sm transition flex items-center justify-center space-x-2"
                      >
                        <ToggleLeft size={16} className={selectedSeat.status === 'ACTIVE' ? 'text-emerald-500' : 'text-gray-300'} />
                        <span>{selectedSeat.status === 'ACTIVE' ? 'Khóa hoạt động ghế' : 'Mở hoạt động ghế'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={seatActionLoading || selectedSeat.status === 'INACTIVE'}
                        onClick={handleToggleSeatVip}
                        className="w-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider py-2.5 rounded shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        <Gem size={14} className={selectedSeat.isVip ? 'text-amber-500' : 'text-gray-300'} />
                        <span>{selectedSeat.isVip ? 'Hạ xuống ghế Thường' : 'Nâng cấp lên VIP'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
                    <Bus size={32} className="text-gray-300" />
                    <span className="text-xs text-gray-400">Vui lòng click chọn 1 ghế trên sơ đồ bên trái.</span>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-100 space-y-2 text-[10px] text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-baolau-cyan border rounded" />
                    <span>Ghế thường đang hoạt động (Regular)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-baolau-yellow border rounded" />
                    <span>Ghế VIP đang hoạt động (Có phụ thu)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-200 border border-dashed rounded" />
                    <span>Ghế tạm khóa (Không cho đặt)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsSeatsModalOpen(false)}
                className="px-6 py-2 bg-baolau-dark hover:bg-baolau-dark/95 text-white font-bold text-xs uppercase tracking-wider rounded shadow transition"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
