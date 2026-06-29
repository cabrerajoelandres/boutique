import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Redireccionar al origen de la ruta protegida o a la página principal
  const from = location.state?.from?.pathname || "/";

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
      // Si el rol es Admin, podemos redirigir a /admin
      navigate(from);
    } else {
      Swal.fire({
        title: 'Error de Acceso',
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
    <div className="bg-black text-white min-h-screen pt-20 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-bgCard border border-borderGray p-8 md:p-10 space-y-8">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-widest uppercase">Iniciar Sesión</h2>
          <p className="text-xs text-textGray font-light">Ingresa tus datos para acceder a tu cuenta y carrito.</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Email */}
          <div className="space-y-2">
            <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Correo Electrónico</label>
            <input 
              type="email"
              placeholder="ejemplo@correo.com"
              {...register("email", { 
                required: "El correo es obligatorio",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Formato de correo inválido"
                }
              })}
              className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3.5 focus:outline-none focus:border-accentRed rounded-none"
            />
            {errors.email && (
              <p className="text-red-500 text-2xs uppercase tracking-wide">{errors.email.message}</p>
            )}
          </div>

          {/* Contraseña */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Contraseña</label>
              <Link to="/recover-password" className="text-2xs uppercase tracking-widest text-accentRed hover:text-white transition-colors">
                ¿La olvidaste?
              </Link>
            </div>
            <input 
              type="password"
              placeholder="••••••••"
              {...register("password", { 
                required: "La contraseña es obligatoria",
                minLength: {
                  value: 6,
                  message: "La contraseña debe tener al menos 6 caracteres"
                }
              })}
              className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3.5 focus:outline-none focus:border-accentRed rounded-none"
            />
            {errors.password && (
              <p className="text-red-500 text-2xs uppercase tracking-wide">{errors.password.message}</p>
            )}
          </div>

          {/* Botón de envío */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-accentRed hover:bg-accentRedHover disabled:bg-red-950 text-white py-4 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded-none hover:scale-[1.01]"
          >
            {loading ? "Verificando..." : "Ingresar"}
          </button>
        </form>

        {/* Registro Link */}
        <div className="text-center text-xs text-textGray font-light border-t border-borderGray pt-6">
          <span>¿No tienes cuenta aún? </span>
          <Link to="/register" className="text-accentRed hover:text-white font-semibold transition-colors uppercase tracking-wider ml-1">
            Regístrate aquí
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
