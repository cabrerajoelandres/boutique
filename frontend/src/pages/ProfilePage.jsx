import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../services/axiosInstance';
import { useForm } from 'react-hook-form';
import { FiUser, FiShoppingBag, FiCheckCircle, FiClock, FiTruck, FiAlertCircle, FiXCircle, FiUpload } from 'react-icons/fi';
import Swal from 'sweetalert2';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Tab activa ("profile" o "orders")
  const activeTab = searchParams.get('tab') || 'profile';

  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  // Cargar datos del usuario en el formulario
  useEffect(() => {
    if (user) {
      setValue("first_name", user.first_name || "");
      setValue("last_name", user.last_name || "");
      if (user.perfil) {
        setValue("phone", user.perfil.phone || "");
        setValue("address_line1", user.perfil.address_line1 || "");
        setValue("address_line2", user.perfil.address_line2 || "");
        setValue("city", user.perfil.city || "");
        setValue("state", user.perfil.state || "");
        setValue("postal_code", user.perfil.postal_code || "");
        setValue("country", user.perfil.country || "Ecuador");
      }
    }
  }, [user, setValue]);

  // Cargar pedidos del usuario
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const response = await axiosInstance.get('/orders/');
      setOrders(response.data.results || response.data || []);
    } catch (error) {
      console.error("Error al obtener pedidos", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (data) => {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      perfil: {
        phone: data.phone,
        address_line1: data.address_line1,
        address_line2: data.address_line2,
        city: data.city,
        state: data.state,
        postal_code: data.postal_code,
        country: data.country
      }
    };

    const result = await updateProfile(payload);
    if (result.success) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Perfil actualizado con éxito',
        showConfirmButton: false,
        timer: 1500,
        background: '#0b0b0b',
        color: '#ffffff'
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo actualizar el perfil.',
        icon: 'error',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff'
      });
    }
  };

  const handleLaterUploadReceipt = async (orderId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('receipt_image', file);

    try {
      await axiosInstance.post(`/orders/${orderId}/upload-receipt/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      Swal.fire({
        title: 'Comprobante subido',
        text: 'El comprobante fue cargado con éxito. Validaremos tu pago a la brevedad.',
        icon: 'success',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff'
      });
      fetchOrders();
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error al subir el comprobante.',
        icon: 'error',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff'
      });
    }
  };

  // Mapeo de iconos y estilos de estado de pedidos
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="flex items-center gap-1.5 text-2xs text-yellow-500 font-bold bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 uppercase tracking-wider">
            <FiClock className="w-3.5 h-3.5" /> Pendiente
          </span>
        );
      case 'PAYMENT_TO_VERIFY':
        return (
          <span className="flex items-center gap-1.5 text-2xs text-blue-400 font-bold bg-blue-400/10 border border-blue-400/20 px-2 py-1 uppercase tracking-wider">
            <FiAlertCircle className="w-3.5 h-3.5" /> Por Verificar
          </span>
        );
      case 'PAYMENT_APPROVED':
        return (
          <span className="flex items-center gap-1.5 text-2xs text-green-500 font-bold bg-green-500/10 border border-green-500/20 px-2 py-1 uppercase tracking-wider">
            <FiCheckCircle className="w-3.5 h-3.5" /> Pago Aprobado
          </span>
        );
      case 'PREPARING':
        return (
          <span className="flex items-center gap-1.5 text-2xs text-indigo-400 font-bold bg-indigo-400/10 border border-indigo-400/20 px-2 py-1 uppercase tracking-wider">
            <FiClock className="w-3.5 h-3.5" /> Preparando
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="flex items-center gap-1.5 text-2xs text-orange-400 font-bold bg-orange-400/10 border border-orange-400/20 px-2 py-1 uppercase tracking-wider">
            <FiTruck className="w-3.5 h-3.5" /> Enviado
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="flex items-center gap-1.5 text-2xs text-green-400 font-bold bg-green-400/10 border border-green-400/20 px-2 py-1 uppercase tracking-wider">
            <FiCheckCircle className="w-3.5 h-3.5" /> Entregado
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center gap-1.5 text-2xs text-red-500 font-bold bg-red-500/10 border border-red-500/20 px-2 py-1 uppercase tracking-wider">
            <FiXCircle className="w-3.5 h-3.5" /> Cancelado
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10">
        
        {/* Sidebar de Navegación del Perfil */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          <div className="bg-bgCard border border-borderGray p-6 text-center space-y-3">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center text-accentRed text-2xl font-bold mx-auto border border-borderGray">
              {user?.first_name ? user.first_name[0] : <FiUser />}
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide">{user?.first_name} {user?.last_name}</h3>
              <span className="text-2xs text-textGray tracking-wider uppercase bg-white/5 px-2 py-0.5 mt-1 inline-block">
                {user?.role === 'Admin' ? 'Administrador' : 'Cliente'}
              </span>
            </div>
          </div>

          <div className="bg-bgCard border border-borderGray p-2 flex flex-col space-y-1 text-xs uppercase tracking-wider font-semibold">
            <button 
              onClick={() => setSearchParams({ tab: 'profile' })}
              className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
                activeTab === 'profile' ? 'bg-accentRed text-white' : 'text-textGray hover:text-white'
              }`}
            >
              <FiUser />
              <span>Mi Perfil</span>
            </button>
            {user?.role !== 'Admin' && (
              <button 
                onClick={() => setSearchParams({ tab: 'orders' })}
                className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
                  activeTab === 'orders' ? 'bg-accentRed text-white' : 'text-textGray hover:text-white'
                }`}
              >
                <FiShoppingBag />
                <span>Mis Pedidos</span>
              </button>
            )}
          </div>
        </aside>

        {/* Contenido de la Tab Activa */}
        <main className="flex-1 bg-bgCard border border-borderGray p-6 md:p-8">
          
          {activeTab === 'profile' || user?.role === 'Admin' ? (
            /* TAB: MI PERFIL */
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-widest border-b border-borderGray pb-3">Información del Perfil</h2>
              
              <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-5">
                
                {/* Datos de contacto básicos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Nombre</label>
                    <input 
                      type="text"
                      {...register("first_name", { required: "Requerido" })}
                      className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Apellido</label>
                    <input 
                      type="text"
                      {...register("last_name", { required: "Requerido" })}
                      className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Teléfono</label>
                  <input 
                    type="text"
                    {...register("phone")}
                    className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                  />
                </div>

                {/* Dirección de Envío */}
                <h3 className="text-xs uppercase tracking-widest font-bold text-white pt-4 border-t border-borderGray">Dirección de Envío Predeterminada</h3>

                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Calle Principal y Número</label>
                  <input 
                    type="text"
                    {...register("address_line1")}
                    className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Referencia / Departamento (Línea 2)</label>
                  <input 
                    type="text"
                    {...register("address_line2")}
                    className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Ciudad</label>
                    <input 
                      type="text"
                      {...register("city")}
                      className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Provincia / Estado</label>
                    <input 
                      type="text"
                      {...register("state")}
                      className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Código Postal</label>
                    <input 
                      type="text"
                      {...register("postal_code")}
                      className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">País</label>
                    <input 
                      type="text"
                      {...register("country")}
                      className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="bg-white hover:bg-accentRed text-black hover:text-white px-8 py-4 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded-none"
                >
                  Guardar Cambios
                </button>

              </form>
            </div>
          ) : (
            /* TAB: MIS PEDIDOS */
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-widest border-b border-borderGray pb-3">Historial de Pedidos</h2>
              
              {loadingOrders ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-accentRed border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-borderGray text-textGray text-xs uppercase tracking-widest">
                  Aún no has realizado ningún pedido.
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-borderGray bg-black p-5 space-y-4">
                      
                      {/* Cabecera del pedido */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-borderGray">
                        <div>
                          <p className="text-xs font-bold text-white uppercase">Pedido #{order.id.slice(0, 8)}</p>
                          <p className="text-[10px] text-textGray font-light mt-0.5">Realizado el: {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusBadge(order.status)}
                          <span className="text-xs font-black text-white ml-2">${parseFloat(order.total).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Lista de productos comprados */}
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-xs">
                            <span className="text-textGray">
                              {item.variant_detail.product.name} (Color: {item.variant_detail.color}
                              {item.variant_detail.size ? `, Talla: ${item.variant_detail.size}` : ''})
                            </span>
                            <span className="text-white font-medium">x{item.quantity} - ${parseFloat(item.price).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Dirección de envío */}
                      <div className="text-2xs text-textGray font-light border-t border-borderGray/50 pt-2">
                        <span className="font-semibold text-white">Dirección de envío:</span>{' '}
                        {order.shipping_address.address_line1},{' '}
                        {order.shipping_address.city}, {order.shipping_address.state},{' '}
                        {order.shipping_address.country}
                      </div>

                      {/* Acciones del pedido (Carga de comprobante tardío si está PENDING) */}
                      {order.status === 'PENDING' && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-bgCard border border-borderGray p-3.5 mt-2">
                          <p className="text-[10px] text-textGray uppercase tracking-wider leading-relaxed">
                            Aún no has subido tu comprobante de pago. Súbelo para iniciar la validación.
                          </p>
                          
                          <div className="relative overflow-hidden border border-white hover:border-accentRed bg-black text-white hover:text-accentRed px-4 py-2 text-2xs uppercase tracking-widest font-bold transition-all cursor-pointer">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => handleLaterUploadReceipt(order.id, e.target.files[0])}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <span className="flex items-center gap-1.5">
                              <FiUpload /> Subir Comprobante
                            </span>
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
};

export default ProfilePage;
