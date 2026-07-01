import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await registerUser(
      data.email,
      data.password,
      data.password_confirm,
      data.first_name,
      data.last_name
    );
    setLoading(false);

    if (result.success) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Registro exitoso e inicio de sesión automático',
        showConfirmButton: false,
        timer: 2000,
        background: '#0b0b0b',
        color: '#ffffff'
      });
      navigate('/');
    } else {
      const errorMsg = result.error.email
        ? 'Este correo electrónico ya está registrado.'
        : (result.error.detail || 'Error al completar el registro.');

      Swal.fire({
        title: 'Error de registro',
        text: errorMsg,
        icon: 'error',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff',
        customClass: {
          popup: 'border border-borderGray rounded-none',
          confirmButton: 'rounded-none uppercase tracking-wider text-xs px-6 py-3'
        }
      });
    }
  };

  return (
    <div className="bg-black text-white min-h-screen pt-20 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg bg-bgCard border border-borderGray p-8 md:p-10 space-y-8 shadow-2xl shadow-black/40 rounded-2xl">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/5 border border-borderGray flex items-center justify-center text-accentRed">
            <FiUserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-widest capitalize">Crear cuenta</h2>
          <p className="text-xs text-textGray font-light leading-relaxed">
            Únete a nuestra boutique para comprar y gestionar tus pedidos.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-2xs capitalize tracking-widest text-textGray font-semibold">Nombre</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray w-4 h-4" />
                <input
                  type="text"
                  placeholder="Ej: Carlos"
                  {...register('first_name', { required: 'El nombre es obligatorio' })}
                  className="w-full bg-black border border-borderGray text-white text-xs pl-11 pr-4 py-3.5 focus:outline-none focus:border-accentRed rounded-xl transition-all duration-300 hover:border-textGray"
                />
              </div>
              {errors.first_name && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400 leading-none">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="capitalize">{errors.first_name.message}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-2xs capitalize tracking-widest text-textGray font-semibold">Apellido</label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray w-4 h-4" />
                <input
                  type="text"
                  placeholder="Ej: Mendoza"
                  {...register('last_name', { required: 'El apellido es obligatorio' })}
                  className="w-full bg-black border border-borderGray text-white text-xs pl-11 pr-4 py-3.5 focus:outline-none focus:border-accentRed rounded-xl transition-all duration-300 hover:border-textGray"
                />
              </div>
              {errors.last_name && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400 leading-none">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="capitalize">{errors.last_name.message}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-2xs capitalize tracking-widest text-textGray font-semibold">Correo electrónico</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray w-4 h-4" />
              <input
                type="email"
                placeholder="carlos@correo.com"
                {...register('email', {
                  required: 'El correo es obligatorio',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Formato de correo inválido'
                  }
                })}
                className="w-full bg-black border border-borderGray text-white text-xs pl-11 pr-4 py-3.5 focus:outline-none focus:border-accentRed rounded-xl transition-all duration-300 hover:border-textGray"
              />
            </div>
            {errors.email && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400 leading-none">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="capitalize">{errors.email.message}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-2xs capitalize tracking-widest text-textGray font-semibold">Contraseña</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: {
                    value: 8,
                    message: 'Debe tener al menos 8 caracteres'
                  }
                })}
                className="w-full bg-black border border-borderGray text-white text-xs pl-11 pr-12 py-3.5 focus:outline-none focus:border-accentRed rounded-xl transition-all duration-300 hover:border-textGray"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textGray hover:text-white transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400 leading-none">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="capitalize">{errors.password.message}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-2xs capitalize tracking-widest text-textGray font-semibold">Confirmar contraseña</label>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray w-4 h-4" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Repite la contraseña"
                {...register('password_confirm', {
                  required: 'Confirmar la contraseña es obligatorio',
                  validate: value => value === password || 'Las contraseñas no coinciden'
                })}
                className="w-full bg-black border border-borderGray text-white text-xs pl-11 pr-12 py-3.5 focus:outline-none focus:border-accentRed rounded-xl transition-all duration-300 hover:border-textGray"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textGray hover:text-white transition-colors"
                aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password_confirm && (
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-400 leading-none">
                <span className="h-2 w-2 rounded-full bg-red-400" />
                <span className="capitalize">{errors.password_confirm.message}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accentRed hover:bg-accentRedHover disabled:bg-red-950 text-white py-4 text-xs capitalize tracking-widest font-bold transition-all duration-300 rounded-xl hover:scale-[1.01] shadow-lg shadow-accentRed/20"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div className="text-center text-xs text-textGray font-light border-t border-borderGray pt-6">
          <span>¿Ya tienes una cuenta? </span>
          <Link to="/login" className="text-accentRed hover:text-white font-semibold transition-colors capitalize tracking-wider ml-1">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
