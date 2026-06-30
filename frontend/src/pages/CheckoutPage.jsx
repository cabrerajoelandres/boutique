import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../services/axiosInstance';
import { useForm } from 'react-hook-form';
import { FiCopy, FiUpload, FiArrowLeft, FiUser, FiPhone, FiMapPin, FiHome, FiShoppingCart } from 'react-icons/fi';
import Swal from 'sweetalert2';

const TRANSFER_DATA = {
  bank: 'Banco Pichincha',
  accountType: 'Corriente',
  accountNumber: '2201234567',
  owner: 'Boutique',
};

const CheckoutPage = () => {
  const { cart, fetchCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    trigger,
    watch,
    getValues,
    formState: { errors },
    setValue,
  } = useForm();

  const formValues = watch();

  useEffect(() => {
    if (user) {
      setValue('full_name', `${user.first_name || ''} ${user.last_name || ''}`.trim());
      setValue('phone', user.perfil?.phone || '');
      setValue('backup_phone', user.perfil?.backup_phone || '');
      setValue('province', user.perfil?.province || user.perfil?.state || '');
      setValue('city', user.perfil?.city || '');
      setValue('address', user.perfil?.address_line1 || '');
    }
  }, [user, setValue]);

  const totals = useMemo(() => {
    const subtotal = cart ? parseFloat(cart.total || 0) : 0;
    const shipping = 5.0;
    const tax = subtotal * 0.12;
    return {
      subtotal,
      shipping,
      tax,
      total: subtotal + shipping + tax,
    };
  }, [cart]);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-black text-white min-h-screen pt-28 pb-20 flex flex-col items-center justify-center px-6">
        <h2 className="text-lg font-bold uppercase tracking-wider text-accentRed">Tu carrito está vacío</h2>
        <button
          onClick={() => navigate('/shop')}
          className="mt-4 bg-white text-black px-6 py-3 text-xs uppercase tracking-widest font-semibold"
        >
          Ir de Compras
        </button>
      </div>
    );
  }

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
      color: '#ffffff',
    });
  };

  const stepFields = ['full_name', 'phone', 'backup_phone', 'province', 'city', 'address'];

  const goNext = async () => {
    if (currentStep === 1) {
      const valid = await trigger(stepFields);
      if (valid) setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!receiptFile) {
        Swal.fire({
          title: 'Falta el comprobante',
          text: 'Sube el comprobante antes de continuar.',
          icon: 'warning',
          confirmButtonColor: '#E50914',
          background: '#0b0b0b',
          color: '#ffffff',
        });
        return;
      }
      setCurrentStep(3);
    }
  };

  const goBack = () => setCurrentStep((prev) => Math.max(1, prev - 1));

  const handleFinalize = async () => {
    const valid = await trigger(stepFields);
    if (!valid) {
      setCurrentStep(1);
      return;
    }

    if (!receiptFile) {
      setCurrentStep(2);
      Swal.fire({
        title: 'Falta el comprobante',
        text: 'No puedes enviar la compra sin subir el comprobante.',
        icon: 'warning',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff',
      });
      return;
    }

    setUploading(true);
    try {
      const data = getValues();
      const payload = {
        shipping_address: {
          full_name: data.full_name,
          phone: data.phone,
          backup_phone: data.backup_phone || '',
          province: data.province,
          city: data.city,
          address: data.address,
        },
      };

      const orderResponse = await axiosInstance.post('/orders/', payload);
      const formData = new FormData();
      formData.append('receipt_image', receiptFile);

      await axiosInstance.post(`/orders/${orderResponse.data.id}/upload-receipt/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await fetchCart();

      Swal.fire({
        title: '¡Compra Exitosa!',
        text: 'Tu pedido fue creado y el comprobante se envió correctamente.',
        icon: 'success',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff',
        customClass: {
          popup: 'border border-borderGray rounded-none',
          confirmButton: 'rounded-none uppercase tracking-wider text-xs px-6 py-3',
        },
      }).then(() => {
        navigate('/profile?tab=orders');
      });
    } catch (error) {
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.receipt_image ||
        'Ocurrió un error al procesar tu compra.';
      Swal.fire({
        title: 'Error',
        text: Array.isArray(msg) ? msg[0] : msg,
        icon: 'error',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff',
      });
    } finally {
      setUploading(false);
    }
  };

  const getStepState = (step) => {
    if (currentStep > step) return 'done';
    if (currentStep === step) return 'active';
    return 'pending';
  };

  const circleClass = (step) => {
    const state = getStepState(step);
    return `w-12 h-12 rounded-full flex items-center justify-center border-2 text-sm font-black transition-all duration-300 shadow-lg ${
      state === 'done'
        ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/30'
        : state === 'active'
          ? 'bg-black border-textGray text-white shadow-white/10 scale-105'
          : 'bg-black border-borderGray text-textGray'
    }`;
  };

  const inputClass =
    'w-full bg-black border border-borderGray text-white text-xs px-4 py-3.5 focus:outline-none focus:border-accentRed focus:ring-1 focus:ring-accentRed/40 rounded-lg transition-all duration-300 hover:border-textGray';

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20 px-6 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-widest uppercase">Proceso de Pago</h1>
          <p className="text-xs text-textGray mt-2">
            Completa los pasos para confirmar tus datos, hacer la transferencia y enviar el comprobante.
          </p>
        </div>

        <div className="mx-auto mb-10 pt-2 max-w-5xl px-4 sm:px-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className={circleClass(1)}>{currentStep > 1 ? '✓' : '1'}</div>
              <span className={`text-sm capitalize tracking-wide ${getStepState(1) === 'active' ? 'text-white' : getStepState(1) === 'done' ? 'text-emerald-400' : 'text-textGray'}`}>Datos</span>
            </div>

            <div className="flex-1 px-4 sm:px-8">
              <div className={`h-1 rounded-full transition-all duration-500 ${currentStep > 1 ? 'bg-emerald-500' : 'bg-borderGray'}`} />
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className={circleClass(2)}>{currentStep > 2 ? '✓' : '2'}</div>
              <span className={`text-sm capitalize tracking-wide ${getStepState(2) === 'active' ? 'text-white' : getStepState(2) === 'done' ? 'text-emerald-400' : 'text-textGray'}`}>Transferencia</span>
            </div>

            <div className="flex-1 px-4 sm:px-8">
              <div className={`h-1 rounded-full transition-all duration-500 ${currentStep > 2 ? 'bg-emerald-500' : 'bg-borderGray'}`} />
            </div>

            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className={circleClass(3)}>
                <FiShoppingCart className="w-4 h-4" />
              </div>
              <span className={`text-sm capitalize tracking-wide ${getStepState(3) === 'active' ? 'text-white' : getStepState(3) === 'done' ? 'text-emerald-400' : 'text-textGray'}`}>Resumen</span>
            </div>
          </div>
        </div>

        <div className="bg-bgCard/95 border border-borderGray rounded-2xl shadow-2xl shadow-black/30 p-6 md:p-8 backdrop-blur-sm">
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <form className="lg:col-span-2 space-y-5">
                <div className="flex items-center justify-between border-b border-borderGray pb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Datos de envío</h3>
                    <p className="text-[10px] text-textGray mt-1">Ingresa la información del comprador y destino.</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-accentRed">Paso 1</span>
                </div>

                <div className="bg-black/60 border border-borderGray rounded-xl p-5 space-y-5 shadow-lg">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-textGray font-semibold">
                      <span className="w-7 h-7 rounded-full bg-white/5 border border-borderGray flex items-center justify-center text-accentRed">
                        <FiUser className="w-3.5 h-3.5" />
                      </span>
                      Nombres y apellidos completos
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: María Fernanda López"
                      {...register('full_name', { required: 'Este campo es obligatorio' })}
                      className={inputClass}
                    />
                    {errors.full_name && <p className="text-red-500 text-2xs">{errors.full_name.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-textGray font-semibold">
                        <span className="w-7 h-7 rounded-full bg-white/5 border border-borderGray flex items-center justify-center text-accentRed">
                          <FiPhone className="w-3.5 h-3.5" />
                        </span>
                        Número telefónico
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 0991234567"
                        {...register('phone', { required: 'Este campo es obligatorio' })}
                        className={inputClass}
                      />
                      {errors.phone && <p className="text-red-500 text-2xs">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-textGray font-semibold">
                        <span className="w-7 h-7 rounded-full bg-white/5 border border-borderGray flex items-center justify-center text-accentRed">
                          <FiPhone className="w-3.5 h-3.5" />
                        </span>
                        Número telefónico de respaldo
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 0987654321"
                        {...register('backup_phone', { required: 'Este campo es obligatorio' })}
                        className={inputClass}
                      />
                      {errors.backup_phone && <p className="text-red-500 text-2xs">{errors.backup_phone.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-textGray font-semibold">
                        <span className="w-7 h-7 rounded-full bg-white/5 border border-borderGray flex items-center justify-center text-accentRed">
                          <FiMapPin className="w-3.5 h-3.5" />
                        </span>
                        Provincia
                      </label>
                      <input
                        type="text"
                        placeholder="Pichincha"
                        {...register('province', { required: 'Este campo es obligatorio' })}
                        className={inputClass}
                      />
                      {errors.province && <p className="text-red-500 text-2xs">{errors.province.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-xs text-textGray font-semibold">
                        <span className="w-7 h-7 rounded-full bg-white/5 border border-borderGray flex items-center justify-center text-accentRed">
                          <FiMapPin className="w-3.5 h-3.5" />
                        </span>
                        Ciudad
                      </label>
                      <input
                        type="text"
                        placeholder="Quito"
                        {...register('city', { required: 'Este campo es obligatorio' })}
                        className={inputClass}
                      />
                      {errors.city && <p className="text-red-500 text-2xs">{errors.city.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-textGray font-semibold">
                      <span className="w-7 h-7 rounded-full bg-white/5 border border-borderGray flex items-center justify-center text-accentRed">
                        <FiHome className="w-3.5 h-3.5" />
                      </span>
                      Dirección domiciliaria
                    </label>
                    <input
                      type="text"
                      placeholder="Calle principal, número, sector, referencia"
                      {...register('address', { required: 'Este campo es obligatorio' })}
                      className={inputClass}
                    />
                    {errors.address && <p className="text-red-500 text-2xs">{errors.address.message}</p>}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={goNext}
                    className="bg-accentRed hover:bg-accentRedHover text-white px-6 py-3 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded-lg shadow-lg shadow-accentRed/20"
                  >
                    Continuar
                  </button>
                </div>
              </form>

              <div className="bg-black/60 border border-borderGray rounded-xl p-6 h-fit space-y-4 shadow-lg">
                <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white border-b border-borderGray pb-3">
                  Resumen
                </h3>
                <div className="space-y-2 text-xs text-textGray">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3">
                      <span className="truncate max-w-[180px]">{item.variant_detail.product.name}</span>
                      <span>x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-borderGray pt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>${totals.shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA</span>
                    <span>${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-white pt-2 border-t border-borderGray">
                    <span>Total</span>
                    <span className="text-accentRed">${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-borderGray pb-3">
                  <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white">Datos de Transferencia</h3>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-accentRed">Paso 2</span>
                </div>

                <div className="bg-black/60 border border-borderGray rounded-xl p-5 space-y-3.5 text-xs shadow-lg">
                  <div className="flex justify-between">
                    <span className="text-textGray">Banco:</span>
                    <span className="text-white font-semibold">{TRANSFER_DATA.bank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textGray">Tipo de Cuenta:</span>
                    <span className="text-white">{TRANSFER_DATA.accountType}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-textGray">Número de Cuenta:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-mono font-semibold">{TRANSFER_DATA.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(TRANSFER_DATA.accountNumber)}
                        className="text-accentRed hover:text-white p-1"
                        title="Copiar número de cuenta"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textGray">Propietario cuenta:</span>
                    <span className="text-white font-semibold">{TRANSFER_DATA.owner}</span>
                  </div>
                  <div className="flex justify-between border-t border-borderGray pt-3 text-sm font-bold">
                    <span>Monto a transferir:</span>
                    <span className="text-accentRed">${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-borderGray pb-3">
                  <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white">Subir Comprobante</h3>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-accentRed">Paso 2</span>
                </div>

                <div className="border border-dashed border-borderGray hover:border-accentRed bg-black/60 p-8 text-center relative cursor-pointer transition-all duration-300 group rounded-xl shadow-lg hover:shadow-accentRed/10">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-3 flex flex-col items-center">
                    <FiUpload className="w-8 h-8 text-textGray group-hover:text-accentRed transition-colors" />
                    <span className="text-xs text-textGray font-semibold block">
                      {receiptFile ? receiptFile.name : 'Selecciona una imagen del comprobante'}
                    </span>
                    <span className="text-2xs uppercase tracking-[0.25em] text-textGray">
                      Arrastra o haz clic para subir
                    </span>
                  </div>
                </div>

                <div className="bg-black/60 border border-borderGray rounded-xl p-5 text-xs text-textGray leading-relaxed">
                  Sube una captura clara del comprobante antes de continuar al último paso.
                </div>

                <div className="flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={goBack}
                    className="border border-borderGray text-white hover:text-accentRed px-6 py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-lg transition-all duration-300"
                  >
                    <FiArrowLeft />
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="bg-accentRed hover:bg-accentRedHover text-white px-6 py-3 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded-lg shadow-lg shadow-accentRed/20"
                  >
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-borderGray pb-3">
                  <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white">Confirmar Datos</h3>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-accentRed">Paso 3</span>
                </div>

                <div className="bg-black/60 border border-borderGray rounded-xl p-5 space-y-3 text-xs shadow-lg">
                  <div className="flex justify-between gap-4">
                    <span className="text-textGray">Nombre:</span>
                    <span className="text-white text-right">{formValues.full_name || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-textGray">Teléfono:</span>
                    <span className="text-white text-right">{formValues.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-textGray">Respaldo:</span>
                    <span className="text-white text-right">{formValues.backup_phone || '-'}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-textGray">Provincia / Ciudad:</span>
                    <span className="text-white text-right">
                      {formValues.province || '-'} / {formValues.city || '-'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-textGray">Dirección:</span>
                    <span className="text-white text-right max-w-[220px]">{formValues.address || '-'}</span>
                  </div>
                </div>

                <div className="bg-black/60 border border-borderGray rounded-xl p-5 space-y-3 text-xs shadow-lg">
                  <h4 className="uppercase tracking-[0.25em] font-bold text-white">Comprobante</h4>
                  <div className="flex justify-between gap-4">
                    <span className="text-textGray">Archivo:</span>
                    <span className="text-white text-right">{receiptFile ? receiptFile.name : 'No seleccionado'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-borderGray pb-3">
                  <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-white">Resumen Final</h3>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-accentRed">Revisión</span>
                </div>

                <div className="bg-black/60 border border-borderGray rounded-xl p-5 space-y-4 text-xs shadow-lg">
                  {cart.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-4">
                      <span className="text-textGray truncate max-w-[220px]">
                        {item.variant_detail.product.name} x{item.quantity}
                      </span>
                      <span className="text-white">${parseFloat(item.subtotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t border-borderGray pt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-textGray">Subtotal</span>
                      <span className="text-white">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textGray">Envío</span>
                      <span className="text-white">${totals.shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-textGray">IVA</span>
                      <span className="text-white">${totals.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-white pt-2 border-t border-borderGray">
                      <span>Total</span>
                      <span className="text-accentRed">${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between gap-4">
                  <button
                    type="button"
                    onClick={goBack}
                    className="border border-borderGray text-white hover:text-accentRed px-6 py-3 text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-2 rounded-lg transition-all duration-300"
                  >
                    <FiArrowLeft />
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={uploading}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 text-xs uppercase tracking-widest font-black transition-all duration-300 rounded-lg shadow-lg shadow-emerald-500/20 disabled:bg-emerald-950 disabled:text-white"
                  >
                    {uploading ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
