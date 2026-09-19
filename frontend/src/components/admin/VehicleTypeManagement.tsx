import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Loader2, 
  Search, 
  Filter, 
  RotateCcw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Bus 
} from 'lucide-react';

export const VehicleTypeManagement: React.FC = () => {
  const { 
    vehicleTypes, 
    vehicleTypesPage,
    vehicleTypeFilters,
    isLoading, 
    error, 
    fetchVehicleTypes, 
    setVehicleTypeFilters,
    resetVehicleTypeFilters,
    createVehicleType, 
    updateVehicleType, 
    deleteVehicleType 
  } = useAdminStore();

  const [currentPage, setCurrentPage] = useState(0);
  const [searchInput, setSearchInput] = useState(vehicleTypeFilters.keyword || '');
  const pageSize = 10;

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

  // Fetch data on page or filter change
  useEffect(() => {
    fetchVehicleTypes(currentPage, pageSize, vehicleTypeFilters);
  }, [currentPage, vehicleTypeFilters]);

  // Debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (vehicleTypeFilters.keyword || '')) {
        setVehicleTypeFilters({ keyword: searchInput });
        setCurrentPage(0);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSeatTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setVehicleTypeFilters({ seatType: e.target.value });
    setCurrentPage(0);
  };

  const handleFloorsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setVehicleTypeFilters({ floors: val === '' ? '' : Number(val) });
    setCurrentPage(0);
  };

  const handleSort = (field: string) => {
    const isCurrentField = vehicleTypeFilters.sortBy === field;
    const nextDir = isCurrentField && vehicleTypeFilters.sortDir === 'asc' ? 'desc' : 'asc';
    setVehicleTypeFilters({ sortBy: field, sortDir: nextDir });
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    resetVehicleTypeFilters();
    setCurrentPage(0);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < vehicleTypesPage.totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const hasActiveFilters = Boolean(
    searchInput.trim() || 
    vehicleTypeFilters.seatType || 
    vehicleTypeFilters.floors !== '' ||
    vehicleTypeFilters.sortBy !== 'id' || 
    vehicleTypeFilters.sortDir !== 'asc'
  );

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-gray-800">
              Quản lý loại xe (Vehicle Types)
            </h2>
            <span className="bg-baolau-cyan/10 text-baolau-cyan font-bold text-xs px-2.5 py-0.5 rounded-full">
              {vehicleTypesPage.totalElements} loại xe
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Thiết lập các cấu hình bố cục ghế ngồi cho xe khách trong hệ thống.
          </p>
        </div>
        
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-2 rounded transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Đặt lại</span>
            </button>
          )}

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center space-x-1.5 bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold px-4 py-2 rounded text-xs transition cursor-pointer uppercase tracking-wider shadow-sm"
          >
            <Plus size={14} />
            <span>Thêm loại xe</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-gray-50/80 p-3.5 rounded-lg border border-gray-100">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm theo mã loại xe, tên loại xe..."
            className="w-full bg-white border border-gray-200 rounded-md pl-9 pr-8 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-baolau-cyan focus:ring-1 focus:ring-baolau-cyan transition"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setVehicleTypeFilters({ keyword: '' });
                setCurrentPage(0);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full transition cursor-pointer"
              title="Xóa từ khóa"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Seat Type Filter */}
        <div className="md:col-span-3">
          <select
            value={vehicleTypeFilters.seatType || ''}
            onChange={handleSeatTypeChange}
            className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-baolau-cyan focus:ring-1 focus:ring-baolau-cyan transition cursor-pointer"
          >
            <option value="">Tất cả loại chỗ</option>
            <option value="SEAT">Ghế ngồi (SEAT)</option>
            <option value="BED">Giường nằm (BED)</option>
          </select>
        </div>

        {/* Floors Filter */}
        <div className="md:col-span-3">
          <select
            value={vehicleTypeFilters.floors === '' || vehicleTypeFilters.floors === undefined ? '' : String(vehicleTypeFilters.floors)}
            onChange={handleFloorsChange}
            className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-baolau-cyan focus:ring-1 focus:ring-baolau-cyan transition cursor-pointer"
          >
            <option value="">Tất cả số tầng</option>
            <option value="1">1 tầng</option>
            <option value="2">2 tầng</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 flex items-center gap-1 font-medium">
            <Filter size={12} /> Đang lọc:
          </span>

          {vehicleTypeFilters.keyword && (
            <span className="inline-flex items-center gap-1 bg-baolau-cyan/10 text-baolau-cyan px-2.5 py-1 rounded text-xs font-semibold border border-baolau-cyan/20">
              Từ khóa: "{vehicleTypeFilters.keyword}"
              <button 
                onClick={() => { setSearchInput(''); setVehicleTypeFilters({ keyword: '' }); setCurrentPage(0); }}
                className="hover:text-red-500 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {vehicleTypeFilters.seatType && (
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded text-xs font-semibold border border-purple-200">
              Loại chỗ: {vehicleTypeFilters.seatType === 'BED' ? 'Giường nằm (BED)' : 'Ghế ngồi (SEAT)'}
              <button 
                onClick={() => { setVehicleTypeFilters({ seatType: '' }); setCurrentPage(0); }}
                className="hover:text-red-500 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {vehicleTypeFilters.floors !== '' && vehicleTypeFilters.floors !== undefined && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded text-xs font-semibold border border-blue-200">
              Số tầng: {vehicleTypeFilters.floors} tầng
              <button 
                onClick={() => { setVehicleTypeFilters({ floors: '' }); setCurrentPage(0); }}
                className="hover:text-red-500 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {vehicleTypeFilters.sortBy && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs font-semibold border border-gray-200">
              Sắp xếp: {
                vehicleTypeFilters.sortBy === 'code' ? 'Mã loại xe' :
                vehicleTypeFilters.sortBy === 'name' ? 'Tên loại xe' :
                vehicleTypeFilters.sortBy === 'seatType' ? 'Loại chỗ' :
                vehicleTypeFilters.sortBy === 'floors' ? 'Số tầng' : 'Mặc định'
              } ({vehicleTypeFilters.sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần'})
              <button 
                onClick={() => { setVehicleTypeFilters({ sortBy: 'id', sortDir: 'asc' }); setCurrentPage(0); }}
                className="hover:text-red-500 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded">
          {error}
        </div>
      )}

      {/* Loading or Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <Loader2 className="animate-spin text-baolau-cyan" size={32} />
          <span className="text-xs text-gray-500">Đang tải danh sách loại xe...</span>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider select-none">
                <th 
                  onClick={() => handleSort('code')}
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100/70 transition"
                  title="Nhấn để sắp xếp theo mã loại xe"
                >
                  <div className="flex items-center space-x-1">
                    <span>Mã loại xe</span>
                    {vehicleTypeFilters.sortBy === 'code' ? (
                      vehicleTypeFilters.sortDir === 'asc' ? <ArrowUp size={13} className="text-baolau-cyan" /> : <ArrowDown size={13} className="text-baolau-cyan" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-300" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100/70 transition"
                  title="Nhấn để sắp xếp theo tên loại xe"
                >
                  <div className="flex items-center space-x-1">
                    <span>Tên loại xe</span>
                    {vehicleTypeFilters.sortBy === 'name' ? (
                      vehicleTypeFilters.sortDir === 'asc' ? <ArrowUp size={13} className="text-baolau-cyan" /> : <ArrowDown size={13} className="text-baolau-cyan" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-300" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('seatType')}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-gray-100/70 transition"
                  title="Nhấn để sắp xếp theo loại chỗ"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Loại chỗ</span>
                    {vehicleTypeFilters.sortBy === 'seatType' ? (
                      vehicleTypeFilters.sortDir === 'asc' ? <ArrowUp size={13} className="text-baolau-cyan" /> : <ArrowDown size={13} className="text-baolau-cyan" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-300" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('floors')}
                  className="py-3 px-4 text-center cursor-pointer hover:bg-gray-100/70 transition"
                  title="Nhấn để sắp xếp theo số tầng"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Số tầng</span>
                    {vehicleTypeFilters.sortBy === 'floors' ? (
                      vehicleTypeFilters.sortDir === 'asc' ? <ArrowUp size={13} className="text-baolau-cyan" /> : <ArrowDown size={13} className="text-baolau-cyan" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-300" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Bố cục (Hàng x Cột)</th>
                <th className="py-3 px-4 text-center">Tổng số ghế thiết kế</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {vehicleTypes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-gray-50 rounded-full border border-gray-100">
                        <Bus size={24} className="text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-600">Không tìm thấy loại xe nào phù hợp</p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-2 text-xs text-baolau-cyan hover:underline font-semibold cursor-pointer"
                        >
                          Xóa bộ lọc để xem toàn bộ danh sách
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                vehicleTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">{type.code}</td>
                    <td className="py-3 px-4 text-gray-500 font-medium">{type.name}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        type.seatType === 'BED' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {type.seatType === 'BED' ? 'Giường nằm' : 'Ghế ngồi'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900 font-semibold">{type.floors}</td>
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

      {/* Pagination Controls */}
      {vehicleTypesPage.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 pt-4 text-xs gap-3">
          <span className="text-gray-500">
            Hiển thị trang <strong>{currentPage + 1}</strong> / <strong>{vehicleTypesPage.totalPages}</strong> (Tổng cộng <strong>{vehicleTypesPage.totalElements}</strong> kết quả)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0 || isLoading}
              className="px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Trang trước
            </button>
            <span className="font-semibold text-gray-700 px-1">
              Trang {currentPage + 1} / {vehicleTypesPage.totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === vehicleTypesPage.totalPages - 1 || isLoading}
              className="px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Trang sau
            </button>
          </div>
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
