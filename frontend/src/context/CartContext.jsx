import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useAuth } from './AuthContext';
import Swal from 'sweetalert2';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setCart(null);
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.get('/cart/');
      setCart(response.data);
    } catch (error) {
      console.error("Error al obtener el carrito", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [isAuthenticated]);

  const addToCart = async (variantId, quantity) => {
    if (!isAuthenticated) {
      Swal.fire({
        title: 'Iniciar Sesión',
        text: 'Debes iniciar sesión para agregar productos al carrito y realizar compras.',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Ir a Login',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#E50914',
        cancelButtonColor: '#222222',
        background: '#0b0b0b',
        color: '#ffffff',
        customClass: {
          popup: 'border border-borderGray rounded-none',
          confirmButton: 'rounded-none uppercase tracking-wider text-xs px-6 py-3',
          cancelButton: 'rounded-none uppercase tracking-wider text-xs px-6 py-3'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/login';
        }
      });
      return { success: false, requireLogin: true };
    }

    try {
      const response = await axiosInstance.post('/cart/items/', {
        variant: variantId,
        quantity: quantity
      });
      setCart(response.data);
      
      // Notificación rápida tipo Toast premium
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Producto agregado al carrito',
        showConfirmButton: false,
        timer: 2000,
        background: '#0b0b0b',
        color: '#ffffff',
        customClass: {
          popup: 'border border-borderGray rounded-none'
        }
      });
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.quantity || error.response?.data?.detail || "Error al agregar al carrito";
      Swal.fire({
        title: 'Error',
        text: Array.isArray(msg) ? msg[0] : msg,
        icon: 'error',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff',
        customClass: {
          popup: 'border border-borderGray rounded-none',
          confirmButton: 'rounded-none uppercase tracking-wider text-xs px-6 py-3'
        }
      });
      return { success: false, error: msg };
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      const response = await axiosInstance.put(`/cart/${itemId}/items-update/`, {
        quantity: quantity
      });
      setCart(response.data);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.quantity || "Error al actualizar cantidad";
      Swal.fire({
        title: 'Error',
        text: Array.isArray(msg) ? msg[0] : msg,
        icon: 'error',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff',
        customClass: {
          popup: 'border border-borderGray rounded-none',
          confirmButton: 'rounded-none uppercase tracking-wider text-xs px-6 py-3'
        }
      });
      return { success: false, error: msg };
    }
  };

  const removeCartItem = async (itemId) => {
    try {
      const response = await axiosInstance.delete(`/cart/${itemId}/items-delete/`);
      setCart(response.data);
      return { success: true };
    } catch (error) {
      console.error("Error al eliminar del carrito", error);
      return { success: false };
    }
  };

  const clearCartState = () => {
    setCart(null);
  };

  const value = {
    cart,
    loading,
    fetchCart,
    addToCart,
    updateCartItem,
    removeCartItem,
    clearCartState,
    itemCount: cart ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
