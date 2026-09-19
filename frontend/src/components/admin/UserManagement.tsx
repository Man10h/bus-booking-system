import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { 
  Lock, 
  Unlock, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2, 
  Search, 
  Filter, 
  RotateCcw, 
  X, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Users
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { 
    users, 
    usersPage, 
    userFilters,
    isLoading, 
    error, 
    fetchUsers, 
    setUserFilters,
    resetUserFilters,
    toggleUserLock, 
    promoteToOperator 
  } = useAdminStore();

  const [currentPage, setCurrentPage] = useState(0);
  const [searchInput, setSearchInput] = useState(userFilters.keyword || '');
  const pageSize = 10;

  // Trigger user fetch when pagination or filters change
  useEffect(() => {
    fetchUsers(currentPage, pageSize, userFilters);
  }, [currentPage, userFilters]);

  // Debounced search input handler
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (userFilters.keyword || '')) {
        setUserFilters({ keyword: searchInput });
        setCurrentPage(0);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setUserFilters({ roleName: val });
    setCurrentPage(0);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    const enabledVal = val === '' ? '' : val === 'true';
    setUserFilters({ enabled: enabledVal });
    setCurrentPage(0);
  };

  const handleSort = (field: string) => {
    const isCurrentField = userFilters.sortBy === field;
    const nextDir = isCurrentField && userFilters.sortDir === 'asc' ? 'desc' : 'asc';
    setUserFilters({ sortBy: field, sortDir: nextDir });
    setCurrentPage(0);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    resetUserFilters();
    setCurrentPage(0);
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < usersPage.totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const hasActiveFilters = Boolean(
    searchInput.trim() || 
    userFilters.roleName || 
    userFilters.enabled !== '' ||
    userFilters.sortBy !== 'createdAt' || 
    userFilters.sortDir !== 'desc'
  );

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-gray-800">
              Quản lý người dùng
            </h2>
            <span className="bg-baolau-cyan/10 text-baolau-cyan font-bold text-xs px-2.5 py-0.5 rounded-full">
              {usersPage.totalElements} người dùng
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tìm kiếm, lọc danh sách tài khoản, kích hoạt/khóa tài khoản và phân quyền nhà xe (Operator).
          </p>
        </div>

        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded transition cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw size={13} />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}
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
            placeholder="Tìm kiếm theo họ tên, email, số điện thoại..."
            className="w-full bg-white border border-gray-200 rounded-md pl-9 pr-8 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-baolau-cyan focus:ring-1 focus:ring-baolau-cyan transition"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('');
                setUserFilters({ keyword: '' });
                setCurrentPage(0);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full transition cursor-pointer"
              title="Xóa từ khóa"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <div className="md:col-span-3">
          <select
            value={userFilters.roleName || ''}
            onChange={handleRoleChange}
            className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-baolau-cyan focus:ring-1 focus:ring-baolau-cyan transition cursor-pointer"
          >
            <option value="">Tất cả vai trò</option>
            <option value="USER">USER (Khách hàng)</option>
            <option value="OPERATOR">OPERATOR (Nhà xe)</option>
            <option value="ADMIN">ADMIN (Quản trị viên)</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-3">
          <select
            value={userFilters.enabled === '' || userFilters.enabled === undefined ? '' : String(userFilters.enabled)}
            onChange={handleStatusChange}
            className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-baolau-cyan focus:ring-1 focus:ring-baolau-cyan transition cursor-pointer"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="true">Hoạt động (Active)</option>
            <option value="false">Đang khóa (Locked)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400 flex items-center gap-1 font-medium">
            <Filter size={12} /> Đang lọc:
          </span>

          {userFilters.keyword && (
            <span className="inline-flex items-center gap-1 bg-baolau-cyan/10 text-baolau-cyan px-2.5 py-1 rounded text-xs font-semibold border border-baolau-cyan/20">
              Từ khóa: "{userFilters.keyword}"
              <button 
                onClick={() => { setSearchInput(''); setUserFilters({ keyword: '' }); setCurrentPage(0); }}
                className="hover:text-red-500 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {userFilters.roleName && (
            <span className="inline-flex items-center gap-1 bg-baolau-yellow/15 text-baolau-yellow px-2.5 py-1 rounded text-xs font-semibold border border-baolau-yellow/30">
              Vai trò: {userFilters.roleName}
              <button 
                onClick={() => { setUserFilters({ roleName: '' }); setCurrentPage(0); }}
                className="hover:text-red-500 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {userFilters.enabled !== '' && userFilters.enabled !== undefined && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold border ${
              userFilters.enabled 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              Trạng thái: {userFilters.enabled ? 'Hoạt động' : 'Đang khóa'}
              <button 
                onClick={() => { setUserFilters({ enabled: '' }); setCurrentPage(0); }}
                className="hover:text-red-500 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}

          {userFilters.sortBy && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs font-semibold border border-gray-200">
              Sắp xếp: {
                userFilters.sortBy === 'fullName' ? 'Họ tên' :
                userFilters.sortBy === 'email' ? 'Email' :
                userFilters.sortBy === 'createdAt' ? 'Ngày tạo' : userFilters.sortBy
              } ({userFilters.sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần'})
              <button 
                onClick={() => { setUserFilters({ sortBy: 'createdAt', sortDir: 'desc' }); setCurrentPage(0); }}
                className="hover:text-red-500 cursor-pointer ml-0.5"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-md">
          {error}
        </div>
      )}

      {/* Loading Indicator or Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <Loader2 className="animate-spin text-baolau-cyan" size={32} />
          <span className="text-xs text-gray-500">Đang tải danh sách người dùng...</span>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider select-none">
                <th 
                  onClick={() => handleSort('fullName')}
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100/70 transition"
                  title="Nhấn để sắp xếp theo họ và tên"
                >
                  <div className="flex items-center space-x-1">
                    <span>Họ và tên</span>
                    {userFilters.sortBy === 'fullName' ? (
                      userFilters.sortDir === 'asc' ? <ArrowUp size={13} className="text-baolau-cyan" /> : <ArrowDown size={13} className="text-baolau-cyan" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-300" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('email')}
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100/70 transition"
                  title="Nhấn để sắp xếp theo email"
                >
                  <div className="flex items-center space-x-1">
                    <span>Email</span>
                    {userFilters.sortBy === 'email' ? (
                      userFilters.sortDir === 'asc' ? <ArrowUp size={13} className="text-baolau-cyan" /> : <ArrowDown size={13} className="text-baolau-cyan" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-300" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th 
                  onClick={() => handleSort('createdAt')}
                  className="py-3 px-4 cursor-pointer hover:bg-gray-100/70 transition"
                  title="Nhấn để sắp xếp theo ngày tạo"
                >
                  <div className="flex items-center space-x-1">
                    <span>Ngày tạo</span>
                    {userFilters.sortBy === 'createdAt' ? (
                      userFilters.sortDir === 'asc' ? <ArrowUp size={13} className="text-baolau-cyan" /> : <ArrowDown size={13} className="text-baolau-cyan" />
                    ) : (
                      <ArrowUpDown size={12} className="text-gray-300" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="p-3 bg-gray-50 rounded-full border border-gray-100">
                        <Users size={24} className="text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-600">Không tìm thấy người dùng nào phù hợp</p>
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
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 font-semibold text-gray-900">{user.fullName}</td>
                    <td className="py-3 px-4 text-gray-500">{user.email}</td>
                    <td className="py-3 px-4 text-gray-500">{user.phone || '—'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        user.role === 'ADMIN' 
                          ? 'bg-red-50 text-red-600 border border-red-100'
                          : user.role === 'OPERATOR'
                          ? 'bg-baolau-yellow/15 text-baolau-yellow border border-baolau-yellow/30'
                          : 'bg-baolau-cyan/15 text-baolau-cyan border border-baolau-cyan/30'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 font-medium ${
                        user.enabled ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {user.enabled ? (
                          <>
                            <ShieldCheck size={14} />
                            <span>Hoạt động</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={14} />
                            <span>Đang khóa</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {user.role === 'USER' && (
                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc chắn muốn nâng cấp ${user.fullName} lên vai trò Nhà xe (OPERATOR)?`)) {
                              promoteToOperator(user.id);
                            }
                          }}
                          className="bg-baolau-yellow/10 hover:bg-baolau-yellow/20 text-baolau-yellow border border-baolau-yellow/20 font-bold px-2.5 py-1 rounded text-[10px] transition cursor-pointer"
                        >
                          Lên Operator
                        </button>
                      )}
                      
                      {user.role !== 'ADMIN' && (
                        <button
                          onClick={() => toggleUserLock(user.id)}
                          className={`inline-flex items-center space-x-1 font-bold px-2.5 py-1 rounded text-[10px] border transition cursor-pointer ${
                            user.enabled
                              ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'
                              : 'bg-green-50 hover:bg-green-100 text-green-600 border-green-200'
                          }`}
                        >
                          {user.enabled ? (
                            <>
                              <Lock size={12} />
                              <span>Khóa</span>
                            </>
                          ) : (
                            <>
                              <Unlock size={12} />
                              <span>Mở khóa</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {usersPage.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 pt-4 text-xs gap-3">
          <span className="text-gray-500">
            Hiển thị trang <strong>{currentPage + 1}</strong> / <strong>{usersPage.totalPages}</strong> (Tổng cộng <strong>{usersPage.totalElements}</strong> kết quả)
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
              Trang {currentPage + 1} / {usersPage.totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === usersPage.totalPages - 1 || isLoading}
              className="px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Trang sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
