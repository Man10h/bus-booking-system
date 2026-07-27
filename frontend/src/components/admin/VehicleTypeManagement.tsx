import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';

export const VehicleTypeManagement: React.FC = () => {
  const { 
    vehicleTypes, 
    isLoading, 
    error, 
    fetchVehicleTypes, 
    createVehicleType, 
    updateVehicleType, 
    deleteVehicleType 
  } = useAdminStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);

  // Form fields
  const [seatType, setSeatType] = useState('SEAT');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [floors, setFloors] = useState(1);
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(3);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchVehicleTypes();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSeatType('SEAT');
    setCode('');
    setName('');
    setFloors(1);
    setRows(5);
    setCols(3);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (type: any) => {
    setModalMode('edit');
    setSelectedTypeId(type.id);
    setSeatType(type.seatType || 'SEAT');
    setCode(type.code);
    setName(type.name);
    setFloors(type.floors);
    setRows(type.rows);
    setCols(type.cols);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim() || !name.trim()) {
      setFormError('Vui lòng điền mã và tên loại xe.');
      return;
    }

    if (floors < 1 || floors > 2) {
      setFormError('Số tầng chỉ được phép là 1 hoặc 2.');
      return;
    }

    if (rows < 1 || cols < 1) {
      setFormError('Số hàng và số cột phải lớn hơn 0.');
      return;
    }

    const payload = {
      seatType,
      code: code.trim(),
      name: name.trim(),
      floors,
      rows,
      cols
    };

    try {
      if (modalMode === 'create') {
        await createVehicleType(payload);
      } else if (modalMode === 'edit' && selectedTypeId !== null) {
        await updateVehicleType(selectedTypeId, payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra khi lưu loại xe.');
    }
  };

  const handleDelete = (id: number, typeName: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa loại xe "${typeName}" không?`)) {
      deleteVehicleType(id);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-gray-800">
            Quản lý loại xe (Vehicle Types)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập các cấu hình bố cục ghế ngồi cho xe khách trong hệ thống.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-1.5 bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold px-4 py-2 rounded text-xs transition cursor-pointer self-start sm:self-auto uppercase tracking-wider"
        >
          <Plus size={14} />
          <span>Thêm loại xe</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded">
          {error}
        </div>
      )}

      {isLoading && vehicleTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <Loader2 className="animate-spin text-baolau-cyan" size={32} />
          <span className="text-xs text-gray-500">Đang tải danh sách loại xe...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Mã loại xe</th>
                <th className="py-3 px-4">Tên loại xe</th>
                <th className="py-3 px-4 text-center">Loại chỗ</th>
                <th className="py-3 px-4 text-center">Số tầng</th>
                <th className="py-3 px-4 text-center">Bố cục (Hàng x Cột)</th>
                <th className="py-3 px-4 text-center">Tổng số ghế thiết kế</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vehicleTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Không có loại xe nào.
                  </td>
                </tr>
              ) : (
                vehicleTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">{type.code}</td>
                    <td className="py-3 px-4 text-gray-500">{type.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        type.seatType === 'BED' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {type.seatType === 'BED' ? 'Giường nằm' : 'Ghế ngồi'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900 font-medium">{type.floors}</td>
                    <td className="py-3 px-4 text-center text-gray-500">
                      {type.rows} x {type.cols}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-baolau-cyan">
                      {type.floors * type.rows * type.cols} ghế
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(type)}
                        className="inline-flex items-center space-x-1 font-bold px-2 py-1 rounded text-[10px] border bg-white hover:bg-gray-50 text-gray-600 border-gray-200 transition cursor-pointer"
                      >
                        <Edit size={12} />
                        <span>Sửa</span>
                      </button>
                      <button
                        onClick={() => handleDelete(type.id, type.name)}
                        className="inline-flex items-center space-x-1 font-bold px-2 py-1 rounded text-[10px] border bg-red-50 hover:bg-red-100 text-red-600 border-red-200 transition cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Xóa</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-baolau-dark/50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-2xl text-gray-800 flex flex-col max-h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-oswald font-bold text-sm uppercase tracking-wider text-gray-900">
                {modalMode === 'create' ? 'Tạo loại xe mới' : 'Cập nhật loại xe'}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mã loại xe</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow"
                  placeholder="e.g. SLEEPER_2F"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tên loại xe</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow"
                  placeholder="e.g. Xe giường nằm 2 tầng"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Loại chỗ (Seat Type)</label>
                <select
                  value={seatType}
                  onChange={(e) => setSeatType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow"
                  required
                >
                  <option value="SEAT">Ghế ngồi (SEAT)</option>
                  <option value="BED">Giường nằm (BED)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Số tầng</label>
                  <input
                    type="number"
                    min={1}
                    max={2}
                    value={floors}
                    onChange={(e) => setFloors(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Số hàng</label>
                  <input
                    type="number"
                    min={1}
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Số cột</label>
                  <input
                    type="number"
                    min={1}
                    value={cols}
                    onChange={(e) => setCols(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow"
                    required
                  />
                </div>
              </div>

              {/* Info text */}
              <div className="bg-gray-50 p-2.5 rounded border border-gray-100 text-[10px] text-gray-500">
                Tổng số ghế tạo ra: <strong className="text-baolau-cyan">{floors * rows * cols} ghế</strong>. Sơ đồ xe sẽ được sinh tự động dựa trên hàng và cột thiết kế.
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 font-bold rounded text-xs hover:bg-gray-50 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold px-4 py-2 rounded text-xs transition cursor-pointer uppercase tracking-wider"
                >
                  Lưu lại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
