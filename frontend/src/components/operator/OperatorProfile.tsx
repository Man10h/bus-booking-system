import React, { useState, useEffect } from 'react';
import { useOperatorStore } from '../../store/useOperatorStore';
import type { MerchantResponse } from '../../types/operator';
import { 
  Building2, 
  CreditCard, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Loader2,
  X,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Phone,
  Hash,
  Activity,
  AlertTriangle
} from 'lucide-react';

export const OperatorProfile: React.FC = () => {
  const { 
    profile, 
    merchants, 
    merchantsPage,
    providers, 
    updateProfile, 
    setupMerchant, 
    updateMerchant, 
    deleteMerchant, 
    fetchMerchants,
    fetchProviders,
    isLoading 
  } = useOperatorStore();

  // Profile fields state
  const [companyName, setCompanyName] = useState(profile?.companyName || '');
  const [taxCode, setTaxCode] = useState(profile?.taxCode || '');
  const [contactPhone, setContactPhone] = useState(profile?.contactPhone || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Modal & Edit/Delete State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [editingMerchantId, setEditingMerchantId] = useState<string | null>(null);
  const [merchantToDelete, setMerchantToDelete] = useState<MerchantResponse | null>(null);

  // Form states in Modal
  const [modalMerchantCode, setModalMerchantCode] = useState('');
  const [modalSecretKey, setModalSecretKey] = useState('');
  const [modalMerchantActive, setModalMerchantActive] = useState(true);
  const [showSecret, setShowSecret] = useState(false);

  const [merchantSuccessMsg, setMerchantSuccessMsg] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchProviders();
    fetchMerchants(0, 5);
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg('');
    setLocalError(null);
    try {
      await updateProfile({ companyName, taxCode, contactPhone });
      setProfileSuccessMsg('Cập nhật hồ sơ nhà xe thành công!');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (err: any) {
      setLocalError(err.message || 'Lỗi cập nhật hồ sơ');
    }
  };

  const handleOpenAddModal = () => {
    setSelectedProvider(providers[0] || 'VNPAY');
    setEditingMerchantId(null);
    setModalMerchantCode('');
    setModalSecretKey('');
    setModalMerchantActive(true);
    setModalError(null);
    setShowSecret(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (merchant: MerchantResponse) => {
    setSelectedProvider(merchant.provider);
    setEditingMerchantId(merchant.id);
    setModalMerchantCode(merchant.merchantCode);
    setModalSecretKey(merchant.secretKey);
    setModalMerchantActive(merchant.active);
    setModalError(null);
    setShowSecret(false);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = (merchant: MerchantResponse) => {
    setMerchantToDelete(merchant);
    setIsDeleteModalOpen(true);
  };

  const handleSaveMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setMerchantSuccessMsg('');
    try {
      if (editingMerchantId) {
        await updateMerchant(editingMerchantId, {
          merchantCode: modalMerchantCode,
          secretKey: modalSecretKey,
          active: modalMerchantActive
        });
        setMerchantSuccessMsg(`Cập nhật cấu hình ví Merchant ${selectedProvider} thành công!`);
      } else {
        await setupMerchant(selectedProvider, {
          merchantCode: modalMerchantCode,
          secretKey: modalSecretKey
        });
        setMerchantSuccessMsg(`Thiết lập cổng thanh toán ${selectedProvider} thành công!`);
      }
      setIsModalOpen(false);
      setTimeout(() => setMerchantSuccessMsg(''), 3000);
    } catch (err: any) {
      setModalError(err.message || 'Lỗi lưu thông tin ví Merchant');
    }
  };

  const handleDeleteMerchant = async () => {
    if (!merchantToDelete) return;
    setLocalError(null);
    setMerchantSuccessMsg('');
    try {
      await deleteMerchant(merchantToDelete.id);
      setMerchantSuccessMsg(`Đã vô hiệu hóa cổng thanh toán ${merchantToDelete.provider} thành công!`);
      setIsDeleteModalOpen(false);
      setMerchantToDelete(null);
      setTimeout(() => setMerchantSuccessMsg(''), 3000);
    } catch (err: any) {
      setLocalError(err.message || 'Lỗi vô hiệu hóa cấu hình cổng thanh toán');
      setIsDeleteModalOpen(false);
    }
  };

  const handleReactivateMerchant = async (merchant: MerchantResponse) => {
    setLocalError(null);
    setMerchantSuccessMsg('');
    try {
      await updateMerchant(merchant.id, {
        merchantCode: merchant.merchantCode,
        secretKey: merchant.secretKey,
        active: true
      });
      setMerchantSuccessMsg(`Đã tái kích hoạt cổng thanh toán ${merchant.provider} thành công!`);
      setTimeout(() => setMerchantSuccessMsg(''), 3000);
    } catch (err: any) {
      setLocalError(err.message || 'Lỗi tái kích hoạt ví Merchant');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header Section */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="font-oswald text-2xl font-bold uppercase tracking-wider text-baolau-dark">
          HỒ SƠ & QUẢN LÝ VÍ MERCHANT
        </h1>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Quản lý thông tin pháp lý doanh nghiệp vận tải và cấu hình các ví nhận tiền trực tuyến kết nối với hệ thống.
        </p>
      </div>

      {/* Global Alerts */}
      {localError && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs p-4 rounded-none flex items-center space-x-2 shadow-sm">
          <XCircle size={16} className="text-red-500 shrink-0" />
          <span className="font-semibold">{localError}</span>
        </div>
      )}

      {merchantSuccessMsg && (
        <div className="bg-emerald-50 border-l-4 border-baolau-green text-emerald-800 text-xs p-4 rounded-none flex items-center space-x-2 shadow-sm">
          <CheckCircle2 size={16} className="text-baolau-green shrink-0" />
          <span className="font-semibold">{merchantSuccessMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Card 1: Operator Profile - Left (Col-5) */}
        <div className="lg:col-span-5 bg-white border-t-4 border-baolau-cyan border-x border-b border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
              <div className="w-9 h-9 bg-baolau-cyan/10 text-baolau-cyan rounded-full flex items-center justify-center shrink-0">
                <Building2 size={18} />
              </div>
              <div>
                <h2 className="font-oswald text-sm font-bold text-gray-800 uppercase tracking-wider">Thông tin nhà xe</h2>
                <p className="text-[10px] text-gray-400 font-sans">Chi tiết đăng ký thương hiệu vận tải</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tên công ty / Nhà xe</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Building2 size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-none pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan focus:bg-white transition"
                    placeholder="Ví dụ: Hoàng Long Limousine"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mã số thuế</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Hash size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-none pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan focus:bg-white transition"
                    placeholder="Mã số doanh nghiệp"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Số điện thoại liên hệ</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Phone size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-none pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-baolau-cyan focus:bg-white transition"
                    placeholder="Hotline chăm sóc khách hàng"
                  />
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] p-3 rounded-none flex items-center space-x-2">
                  <CheckCircle2 size={14} className="shrink-0 text-baolau-green" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-baolau-cyan hover:bg-baolau-cyan/90 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-none shadow-sm transition flex items-center space-x-2 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>Lưu thay đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Card 2: Merchant Management - Right (Col-7) */}
        <div className="lg:col-span-7 bg-white border-t-4 border-baolau-yellow border-x border-b border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-baolau-yellow/10 text-baolau-yellow rounded-full flex items-center justify-center shrink-0">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h2 className="font-oswald text-sm font-bold text-gray-800 uppercase tracking-wider">Danh sách ví Merchant</h2>
                  <p className="text-[10px] text-gray-400 font-sans">Quản lý kết nối ví nhận tiền trực tuyến</p>
                </div>
              </div>
              
              <button
                onClick={handleOpenAddModal}
                className="px-3 py-1.5 bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark rounded-none font-bold uppercase tracking-wider text-[10px] transition shadow-sm flex items-center space-x-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Thêm cấu hình</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase tracking-wider text-[10px] bg-gray-50">
                    <th className="py-2.5 px-3">Cổng kết nối</th>
                    <th className="py-2.5 px-3">Mã Merchant (TmnCode)</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">Ngày tạo</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {merchants.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-3 font-bold text-gray-700">{m.provider}</td>
                      <td className="py-4 px-3 text-gray-500 font-mono text-[11px]">
                        {m.merchantCode}
                      </td>
                      <td className="py-4 px-3">
                        <span className={`px-2 py-0.5 border text-[9px] font-black uppercase tracking-wider ${
                          m.active 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                        }`}>
                          {m.active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                      </td>
                      <td className="py-4 px-3 text-gray-400 text-[10px]">
                        {m.createAt ? new Date(m.createAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </td>
                      <td className="py-4 px-3 text-right">
                        <div className="inline-flex space-x-1">
                          <button
                            onClick={() => handleOpenEditModal(m)}
                            className="px-2.5 py-1 text-baolau-cyan hover:bg-baolau-cyan/15 rounded-none font-bold uppercase tracking-wider text-[9px] transition border border-baolau-cyan/30 flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit2 size={10} />
                            <span>Sửa</span>
                          </button>
                          {m.active ? (
                            <button
                              onClick={() => handleConfirmDelete(m)}
                              className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-none font-bold uppercase tracking-wider text-[9px] transition border border-red-200 flex items-center space-x-1 cursor-pointer"
                            >
                              <Trash2 size={10} />
                              <span>Gỡ ví</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivateMerchant(m)}
                              className="px-2.5 py-1 text-emerald-600 hover:bg-emerald-50 rounded-none font-bold uppercase tracking-wider text-[9px] transition border border-emerald-200 flex items-center space-x-1 cursor-pointer"
                            >
                              <CheckCircle2 size={10} />
                              <span>Kích hoạt</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {merchants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400 italic">
                        Chưa có cấu hình ví merchant nào được thiết lập.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {merchantsPage.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 font-sans">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Trang {merchantsPage.currentPage + 1} / {merchantsPage.totalPages} ({merchantsPage.totalElements} cấu hình)
                </span>
                <div className="inline-flex space-x-1">
                  <button
                    disabled={merchantsPage.currentPage === 0}
                    onClick={() => fetchMerchants(merchantsPage.currentPage - 1, 5)}
                    className="px-2 py-1 border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition text-xs font-bold uppercase tracking-wider rounded-none"
                  >
                    Trước
                  </button>
                  <button
                    disabled={merchantsPage.currentPage >= merchantsPage.totalPages - 1}
                    onClick={() => fetchMerchants(merchantsPage.currentPage + 1, 5)}
                    className="px-2 py-1 border border-gray-300 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition text-xs font-bold uppercase tracking-wider rounded-none"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Save/Edit Merchant Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-baolau-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-none w-full max-w-md shadow-2xl border-t-4 border-baolau-yellow border-x border-b border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-oswald text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center space-x-2">
                <CreditCard size={16} className="text-baolau-yellow" />
                <span>{editingMerchantId ? 'Chỉnh sửa ví' : 'Kết nối ví mới'}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 focus:outline-none transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveMerchant} className="p-6 space-y-4 font-sans">
              {modalError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 text-xs p-3 rounded-none flex items-center space-x-2">
                  <XCircle size={14} className="shrink-0 text-red-500" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Nhà cung cấp ví</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Activity size={14} />
                  </span>
                  {editingMerchantId ? (
                    <input
                      type="text"
                      disabled
                      value={selectedProvider}
                      className="w-full bg-gray-100 border border-gray-300 rounded-none pl-9 pr-3 py-2 text-xs text-gray-500 font-bold focus:outline-none"
                    />
                  ) : (
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-3 py-2 text-xs font-bold focus:outline-none focus:border-baolau-yellow"
                    >
                      {providers.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mã Merchant (vnp_TmnCode)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Hash size={14} />
                  </span>
                  <input
                    type="text"
                    required
                    value={modalMerchantCode}
                    onChange={(e) => setModalMerchantCode(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-baolau-yellow transition"
                    placeholder="Nhập mã Terminal Code từ VNPay"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">Khóa bí mật (vnp_HashSecret)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Lock size={14} />
                  </span>
                  <input
                    type={showSecret ? 'text' : 'password'}
                    required
                    value={modalSecretKey}
                    onChange={(e) => setModalSecretKey(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-none pl-9 pr-10 py-2 text-xs focus:outline-none focus:border-baolau-yellow transition font-mono"
                    placeholder="Nhập mã Hash Secret bảo mật"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                  >
                    {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2 bg-gray-50 p-2.5 border border-gray-200">
                <input
                  type="checkbox"
                  id="modalMerchantActive"
                  checked={modalMerchantActive}
                  onChange={(e) => setModalMerchantActive(e.target.checked)}
                  className="h-4 w-4 rounded-none border-gray-300 text-baolau-yellow focus:ring-baolau-yellow cursor-pointer"
                />
                <label htmlFor="modalMerchantActive" className="text-[10px] font-bold text-gray-600 uppercase tracking-wider cursor-pointer select-none">
                  Kích hoạt hoạt động ví nhận tiền này
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-600 rounded-none font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-baolau-yellow hover:bg-baolau-yellow/90 text-baolau-dark font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-none shadow-sm transition flex items-center space-x-2 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <Save size={14} />
                  )}
                  <span>Lưu cấu hình</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete/Deactivate Confirmation Modal */}
      {isDeleteModalOpen && merchantToDelete && (
        <div className="fixed inset-0 bg-baolau-dark/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-none w-full max-w-sm shadow-2xl border-t-4 border-red-500 border-x border-b border-gray-200 p-6 space-y-4">
            <h3 className="font-oswald text-sm font-bold uppercase tracking-wider text-red-600 flex items-center space-x-2">
              <AlertTriangle size={18} />
              <span>Xác nhận gỡ cấu hình ví?</span>
            </h3>
            <p className="text-xs text-gray-600 font-sans leading-relaxed">
              Bạn có chắc chắn muốn ngắt kết nối cổng thanh toán <strong className="text-gray-800">{merchantToDelete.provider}</strong>?
              Cấu hình này sẽ bị chuyển thành trạng thái ngưng hoạt động trên hệ thống.
            </p>
            <div className="flex justify-end space-x-2 pt-2 font-sans">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-none font-bold text-xs uppercase tracking-wider hover:bg-gray-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleDeleteMerchant}
                disabled={isLoading}
                className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-none shadow-sm transition flex items-center space-x-2 cursor-pointer"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <span>Đồng ý gỡ ví</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
