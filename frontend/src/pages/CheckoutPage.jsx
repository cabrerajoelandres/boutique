import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../services/axiosInstance';
import { useForm } from 'react-hook-form';
import { FiCopy, FiCheckCircle, FiUpload, FiArrowLeft } from 'react-icons/fi';
import Swal from 'sweetalert2';

const CheckoutPage = () => {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orderCreated, setOrderCreated] = useState(null); // Almacenará el objeto pedido creado
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  // Precargar dirección si el usuario ya la tiene en su perfil
  useEffect(() => {
    if (user && user.perfil) {
      setValue("address_line1", user.perfil.address_line1 || "");
      setValue("address_line2", user.perfil.address_line2 || "");
      setValue("city", user.perfil.city || "");
      setValue("state", user.perfil.state || "");
      setValue("postal_code", user.perfil.postal_code || "");
      setValue("country", user.perfil.country || "Ecuador");
    }
  }, [user, setValue]);

  // Si el carrito está vacío y no se ha creado un pedido en esta sesión, redirigir
  if ((!cart || cart.items.length === 0) && !orderCreated) {
    return (
      <div className="bg-black text-white min-h-screen pt-28 pb-20 flex flex-col items-center justify-center px-6">
        <h2 className="text-lg font-bold uppercase tracking-wider text-accentRed">Tu carrito está vacío</h2>
        <button onClick={() => navigate('/shop')} className="mt-4 bg-white text-black px-6 py-3 text-xs uppercase tracking-widest font-semibold">
          Ir de Compras
        </button>
      </div>
    );
  }

  // Paso 1: Registrar el pedido en el backend
  const handleCreateOrder = async (data) => {
    try {
      const payload = {
        shipping_address: {
          address_line1: data.address_line1,
          address_line2: data.address_line2 || '',
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: data.country
        }
      };

      const response = await axiosInstance.post('/orders/', payload);
      setOrderCreated(response.data);
      // Actualizar el carrito global (ahora debería estar vacío en el backend)
      fetchCart();
    } catch (error) {
      const msg = error.response?.data?.detail || "Ocurrió un error al registrar tu pedido.";
      Swal.fire({
        title: 'Error',
        text: msg,
        icon: 'error',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff'
      });
    }
  };

  // Paso 2: Subir el comprobante de transferencia bancaria
  const handleUploadReceipt = async (e) => {
    e.preventDefault();
    if (!receiptFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('receipt_image', receiptFile);

    try {
      await axiosInstance.post(`/orders/${orderCreated.id}/upload-receipt/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      Swal.fire({
        title: '¡Compra Exitosa!',
        text: 'Tu comprobante de pago ha sido cargado. Nuestro equipo validará la transferencia en las próximas horas.',
        icon: 'success',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff',
        customClass: {
          popup: 'border border-borderGray rounded-none',
          confirmButton: 'rounded-none uppercase tracking-wider text-xs px-6 py-3'
        }
      }).then(() => {
        navigate('/profile?tab=orders');
      });

    } catch (error) {
      const msg = error.response?.data?.receipt_image || "Error al subir el comprobante.";
      Swal.fire({
        title: 'Error',
        text: Array.isArray(msg) ? msg[0] : msg,
        icon: 'error',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff'
      });
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Número de cuenta copiado',
      showConfirmButton: false,
      timer: 1500,
      background: '#0b0b0b',
      color: '#ffffff'
    });
  };

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20 px-6 lg:px-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabecera */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-widest uppercase">Proceso de Pago</h1>
          <p className="text-xs text-textGray mt-2">
            {!orderCreated 
              ? "Ingresa la dirección para el envío de tus prendas." 
              : "Realiza la transferencia bancaria y sube el comprobante."}
          </p>
        </div>

        {!orderCreated ? (
          /* PASO 1: Formulario de Dirección de Envío */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Formulario */}
            <form onSubmit={handleSubmit(handleCreateOrder)} className="md:col-span-2 space-y-5 bg-bgCard border border-borderGray p-6 md:p-8">
              <h3 className="text-xs uppercase tracking-widest font-bold text-white border-b border-borderGray pb-3">Datos del Envío</h3>
              
              <div className="space-y-2">
                <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Dirección Línea 1</label>
                <input 
                  type="text"
                  placeholder="Calle principal, número de casa/departamento"
                  {...register("address_line1", { required: "Este campo es obligatorio" })}
                  className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                />
                {errors.address_line1 && <p className="text-red-500 text-2xs">{errors.address_line1.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Dirección Línea 2 (Opcional)</label>
                <input 
                  type="text"
                  placeholder="Referencia, piso, conjunto residencial"
                  {...register("address_line2")}
                  className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Ciudad</label>
                  <input 
                    type="text"
                    placeholder="Quito"
                    {...register("city", { required: "Requerido" })}
                    className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                  />
                  {errors.city && <p className="text-red-500 text-2xs">{errors.city.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Provincia / Estado</label>
                  <input 
                    type="text"
                    placeholder="Pichincha"
                    {...register("state", { required: "Requerido" })}
                    className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                  />
                  {errors.state && <p className="text-red-500 text-2xs">{errors.state.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Código Postal</label>
                  <input 
                    type="text"
                    placeholder="170150"
                    {...register("postal_code", { required: "Requerido" })}
                    className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                  />
                  {errors.postal_code && <p className="text-red-500 text-2xs">{errors.postal_code.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">País</label>
                  <input 
                    type="text"
                    placeholder="Ecuador"
                    {...register("country", { required: "Requerido" })}
                    className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
                  />
                  {errors.country && <p className="text-red-500 text-2xs">{errors.country.message}</p>}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-white hover:bg-accentRed text-black hover:text-white py-4 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded-none"
              >
                Confirmar y Crear Pedido
              </button>
            </form>

            {/* Resumen Carrito */}
            <div className="bg-bgCard border border-borderGray p-6 h-fit space-y-4">
              <h3 className="text-xs uppercase tracking-widest font-bold text-white border-b border-borderGray pb-3">Resumen</h3>
              <div className="space-y-2 text-xs text-textGray">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="truncate max-w-[150px]">{item.variant_detail.product.name}</span>
                    <span>x{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-borderGray pt-3 flex justify-between text-xs font-bold">
                <span>Total a Pagar</span>
                <span className="text-accentRed">${(parseFloat(cart.total) * 1.12 + 5.00).toFixed(2)}</span>
              </div>
            </div>

          </div>
        ) : (
          /* PASO 2: Cuenta Bancaria y Carga de Comprobante (Obligatorio) */
          <div className="max-w-2xl mx-auto bg-bgCard border border-borderGray p-8 space-y-8">
            
            {/* Datos Bancarios */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-accentRed">
                <FiCheckCircle className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider">¡Pedido #{orderCreated.id.slice(0,8)} Reservado!</h3>
              </div>
              <p className="text-xs text-textGray font-light leading-relaxed">
                Tu pedido se encuentra en estado **Pendiente de Pago**. Por favor realiza una transferencia bancaria con los siguientes datos:
              </p>

              <div className="bg-black border border-borderGray p-5 space-y-3.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-textGray">Banco:</span>
                  <span className="text-white font-semibold">Banco Pichincha</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-textGray">Número de Cuenta:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono font-semibold">2201234567</span>
                    <button 
                      onClick={() => copyToClipboard('2201234567')}
                      className="text-accentRed hover:text-white p-1"
                      title="Copiar número de cuenta"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-textGray">Tipo de Cuenta:</span>
                  <span className="text-white">Ahorros</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textGray">Titular:</span>
                  <span className="text-white font-semibold">Boutique S.A.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textGray">Identificación (RUC):</span>
                  <span className="text-white">1792345678001</span>
                </div>
                <div className="flex justify-between border-t border-borderGray pt-3 text-sm font-bold">
                  <span>Monto Exacto:</span>
                  <span className="text-accentRed">${parseFloat(orderCreated.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Subida del Comprobante */}
            <form onSubmit={handleUploadReceipt} className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest font-bold text-white">Subir Comprobante de Pago</h4>
                <p className="text-2xs text-textGray leading-relaxed">
                  Toma una captura o fotografía clara del comprobante de transferencia y súbela a continuación. Este paso es obligatorio para procesar el despacho.
                </p>

                <div className="border border-dashed border-borderGray hover:border-accentRed bg-black p-8 text-center relative cursor-pointer transition-colors group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setReceiptFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    required
                  />
                  <div className="space-y-3 flex flex-col items-center">
                    <FiUpload className="w-8 h-8 text-textGray group-hover:text-accentRed transition-colors" />
                    <span className="text-xs text-textGray font-semibold block">
                      {receiptFile ? receiptFile.name : "Selecciona una imagen (.jpg, .png, .gif)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón Finalizar */}
              <button 
                type="submit"
                disabled={!receiptFile || uploading}
                className="w-full bg-accentRed hover:bg-accentRedHover disabled:bg-red-950 text-white py-4 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded-none flex items-center justify-center space-x-2"
              >
                <span>{uploading ? "Subiendo Comprobante..." : "Finalizar Compra"}</span>
              </button>
            </form>

          </div>
        )}

      </div>
    </div>
  );
};

export default CheckoutPage;
