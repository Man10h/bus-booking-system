import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Lock, Unlock, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const { 
    users, 
    usersPage, 
    isLoading, 
    error, 
    fetchUsers, 
    toggleUserLock, 
    promoteToOperator 
  } = useAdminStore();

  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchUsers(currentPage, pageSize);
  }, [currentPage]);

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

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
      <div>
        <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-gray-800">
          Quản lý người dùng
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Xem danh sách người dùng, kích hoạt/khóa tài khoản và phân quyền nhà xe (Operator).
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <Loader2 className="animate-spin text-baolau-cyan" size={32} />
          <span className="text-xs text-gray-500">Đang tải danh sách người dùng...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Ngày tạo</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 font-semibold text-gray-900">{user.fullName}</td>
                    <td className="py-3 px-4 text-gray-500">{user.email}</td>
                    <td className="py-3 px-4 text-gray-500">{user.phone}</td>
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
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
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
        <div className="flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
          <span className="text-gray-500">
            Tổng cộng: <strong>{usersPage.totalElements}</strong> người dùng
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0 || isLoading}
              className="px-3 py-1.5 border border-gray-200 rounded text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
            >
              Trang trước
            </button>
            <span className="font-semibold text-gray-700">
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
