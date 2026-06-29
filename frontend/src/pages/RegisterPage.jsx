import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import Swal from 'sweetalert2';

const RegisterPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const password = watch("password");

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
      // Manejar errores de validación devueltos por el backend (por ejemplo, si el email ya existe)
      const errorMsg = result.error.email 
        ? "Este correo electrónico ya está registrado." 
        : (result.error.detail || "Error al completar el registro.");

      Swal.fire({
        title: 'Error de Registro',
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
      <div className="w-full max-w-lg bg-bgCard border border-borderGray p-8 md:p-10 space-y-8">
        
        {/* Encabezado */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-widest uppercase">Crear Cuenta</h2>
          <p className="text-xs text-textGray font-light">Únete a nuestra boutique para comprar y gestionar tus pedidos.</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Nombre</label>
              <input 
                type="text"
                placeholder="Ej: Carlos"
                {...register("first_name", { required: "El nombre es obligatorio" })}
                className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3.5 focus:outline-none focus:border-accentRed rounded-none"
              />
              {errors.first_name && (
                <p className="text-red-500 text-2xs uppercase tracking-wide">{errors.first_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Apellido</label>
              <input 
                type="text"
                placeholder="Ej: Mendoza"
                {...register("last_name", { required: "El apellido es obligatorio" })}
                className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3.5 focus:outline-none focus:border-accentRed rounded-none"
              />
              {errors.last_name && (
                <p className="text-red-500 text-2xs uppercase tracking-wide">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Correo Electrónico</label>
            <input 
              type="email"
              placeholder="carlos@correo.com"
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
            <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Contraseña</label>
            <input 
              type="password"
              placeholder="Mínimo 8 caracteres"
              {...register("password", { 
                required: "La contraseña es obligatoria",
                minLength: {
                  value: 8,
                  message: "Debe tener al menos 8 caracteres"
                }
              })}
              className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3.5 focus:outline-none focus:border-accentRed rounded-none"
            />
            {errors.password && (
              <p className="text-red-500 text-2xs uppercase tracking-wide">{errors.password.message}</p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="space-y-2">
            <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Confirmar Contraseña</label>
            <input 
              type="password"
              placeholder="Repite la contraseña"
              {...register("password_confirm", { 
                required: "Confirmar la contraseña es obligatorio",
                validate: value => value === password || "Las contraseñas no coinciden"
              })}
              className="w-full bg-black border border-borderGray text-white text-xs px-4 py-3.5 focus:outline-none focus:border-accentRed rounded-none"
            />
            {errors.password_confirm && (
              <p className="text-red-500 text-2xs uppercase tracking-wide">{errors.password_confirm.message}</p>
            )}
          </div>

          {/* Botón de envío */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-accentRed hover:bg-accentRedHover disabled:bg-red-950 text-white py-4 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded-none hover:scale-[1.01] pt-4"
          >
            {loading ? "Creando Cuenta..." : "Registrarse"}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center text-xs text-textGray font-light border-t border-borderGray pt-6">
          <span>¿Ya tienes una cuenta? </span>
          <Link to="/login" className="text-accentRed hover:text-white font-semibold transition-colors uppercase tracking-wider ml-1">
            Inicia Sesión
          </Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
