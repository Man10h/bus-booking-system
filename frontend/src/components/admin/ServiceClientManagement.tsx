import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { Plus, Edit, X, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';

export const ServiceClientManagement: React.FC = () => {
  const { 
    serviceClients, 
    isLoading, 
    error, 
    fetchServiceClients, 
    createServiceClient, 
    updateServiceClient 
  } = useAdminStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  // Form fields
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [scope, setScope] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceClients();
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setClientId('');
    setClientSecret('');
    setScope('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (client: any) => {
    setModalMode('edit');
    setSelectedClientId(client.id);
    setClientId(client.clientId);
    setClientSecret(''); // Let them type a new secret if needed or leave empty if we don't have it/don't want to show
    setScope(client.scope);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientId.trim() || !scope.trim()) {
      setFormError('Vui lòng nhập đầy đủ thông tin Client ID và Scope.');
      return;
    }

    if (modalMode === 'create' && !clientSecret.trim()) {
      setFormError('Vui lòng nhập Client Secret.');
      return;
    }

    const payload = {
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      scope: scope.trim()
    };

    try {
      if (modalMode === 'create') {
        await createServiceClient(payload);
      } else if (modalMode === 'edit' && selectedClientId !== null) {
        await updateServiceClient(selectedClientId, payload);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Có lỗi xảy ra khi lưu Client.');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-oswald text-xl font-bold uppercase tracking-wider text-gray-800">
            Quản lý Service Clients
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Đăng ký và quản lý các cổng kết nối dịch vụ (Service-to-Service Credentials & Scopes).
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-1.5 bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold px-4 py-2 rounded text-xs transition cursor-pointer self-start sm:self-auto uppercase tracking-wider"
        >
          <Plus size={14} />
          <span>Thêm Service Client</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded">
          {error}
        </div>
      )}

      {isLoading && serviceClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <Loader2 className="animate-spin text-baolau-cyan" size={32} />
          <span className="text-xs text-gray-500">Đang tải danh sách clients...</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4">Scopes</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {serviceClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
                    Không có Service Client nào.
                  </td>
                </tr>
              ) : (
                serviceClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-gray-900">{client.clientId}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1.5">
                        {client.scope.split(' ').map((s, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono text-[10px]">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center space-x-1 font-semibold ${
                        client.active ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {client.active ? (
                          <>
                            <ShieldCheck size={14} />
                            <span>Hoạt động</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert size={14} />
                            <span>Ngưng hoạt động</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openEditModal(client)}
                        className="inline-flex items-center space-x-1 font-bold px-2.5 py-1 rounded text-[10px] border bg-white hover:bg-gray-50 text-gray-600 border-gray-200 transition cursor-pointer"
                      >
                        <Edit size={12} />
                        <span>Sửa</span>
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
                {modalMode === 'create' ? 'Tạo mới Service Client' : 'Cập nhật Service Client'}
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
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client ID</label>
                <input
                  type="text"
                  disabled={modalMode === 'edit'}
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="e.g. payment-service"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Client Secret {modalMode === 'edit' && '(Nhập để đổi)'}
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow"
                  placeholder="Mật khẩu bí mật"
                  required={modalMode === 'create'}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scopes (Ngăn cách bởi dấu cách)</label>
                <input
                  type="text"
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow"
                  placeholder="e.g. payment.read payment.write"
                  required
                />
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
