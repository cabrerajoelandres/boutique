import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn } from 'react-icons/fi';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await login(data.email, data.password);
    setLoading(false);

    if (result.success) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Sesión iniciada correctamente',
        showConfirmButton: false,
        timer: 1500,
        background: '#0b0b0b',
        color: '#ffffff'
      });
      navigate(from);
    } else {
      Swal.fire({
        title: 'Error de acceso',
        text: result.error,
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
      <div className="w-full max-w-md bg-bgCard border border-borderGray p-8 md:p-10 space-y-8 shadow-2xl shadow-black/40 rounded-2xl">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/5 border border-borderGray flex items-center justify-center text-accentRed">
            <FiLogIn className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-widest capitalize">Iniciar sesión</h2>
          <p className="text-xs text-textGray font-light leading-relaxed">
            Ingresa tus datos para acceder a tu cuenta y carrito.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-2xs capitalize tracking-widest text-textGray font-semibold">Correo electrónico</label>
            <div className="relative">
              <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray w-4 h-4" />
              <input
                type="email"
                placeholder="ejemplo@correo.com"
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
            <div className="flex justify-between items-center">
              <label className="text-2xs capitalize tracking-widest text-textGray font-semibold">Contraseña</label>
              <Link to="/recover-password" className="text-2xs capitalize tracking-widest text-accentRed hover:text-white transition-colors">
                ¿La olvidaste?
              </Link>
            </div>
            <div className="relative">
              <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray w-4 h-4" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password', {
                  required: 'La contraseña es obligatoria',
                  minLength: {
                    value: 6,
                    message: 'La contraseña debe tener al menos 6 caracteres'
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accentRed hover:bg-accentRedHover disabled:bg-red-950 text-white py-4 text-xs capitalize tracking-widest font-bold transition-all duration-300 rounded-xl hover:scale-[1.01] shadow-lg shadow-accentRed/20"
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <div className="text-center text-xs text-textGray font-light border-t border-borderGray pt-6">
          <span>¿No tienes cuenta aún? </span>
          <Link to="/register" className="text-accentRed hover:text-white font-semibold transition-colors capitalize tracking-wider ml-1">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
