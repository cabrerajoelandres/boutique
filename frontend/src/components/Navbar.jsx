import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { FiShoppingBag, FiUser, FiMenu, FiX, FiLogOut, FiLayout } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const { itemCount } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 glass-navbar transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-2xl font-extrabold tracking-[0.25em] text-white font-sans uppercase">
            Boutique<span className="text-accentRed">.</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-10">
          <Link 
            to="/" 
            className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors hover:text-accentRed ${
              isActive('/') ? 'text-accentRed' : 'text-textGray'
            }`}
          >
            Inicio
          </Link>
          <Link 
            to="/shop" 
            className={`text-xs uppercase tracking-[0.2em] font-medium transition-colors hover:text-accentRed ${
              isActive('/shop') ? 'text-accentRed' : 'text-textGray'
            }`}
          >
            Tienda
          </Link>
          {isAdmin && (
            <Link 
              to="/admin" 
              className="text-xs uppercase tracking-[0.2em] font-medium text-accentRed flex items-center space-x-1 hover:text-white transition-colors"
            >
              <FiLayout className="inline-block mr-1" />
              Dashboard
            </Link>
          )}
        </div>

        {/* Action Icons */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Cart Icon - Ocultado para Administradores */}
          {!isAdmin && (
            <Link to="/cart" className="relative p-2 text-white hover:text-accentRed transition-colors">
              <FiShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-0 right-0 bg-accentRed text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-black"
                >
                  {itemCount}
                </motion.span>
              )}
            </Link>
          )}

          {/* User Menu / Dropdown */}
          <div className="relative">
            {isAuthenticated ? (
              <div>
                <button 
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 p-2 text-white hover:text-accentRed transition-colors focus:outline-none"
                >
                  <FiUser className="w-5 h-5" />
                  <span className="text-xs tracking-wider max-w-[120px] truncate">
                    {user.first_name || user.email}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-52 bg-bgCard border border-borderGray shadow-premium py-2 text-sm"
                    >
                      <div className="px-4 py-2 border-b border-borderGray text-xs text-textGray truncate">
                        {user.email}
                      </div>
                      <Link 
                        to="/profile" 
                        onClick={() => setShowDropdown(false)}
                        className="block px-4 py-2 text-xs uppercase tracking-wider text-white hover:bg-bgCardHover hover:text-accentRed transition-all"
                      >
                        Mi Perfil
                      </Link>
                      {!isAdmin && (
                        <Link 
                          to="/profile?tab=orders" 
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-xs uppercase tracking-wider text-white hover:bg-bgCardHover hover:text-accentRed transition-all"
                        >
                          Mis Pedidos
                        </Link>
                      )}
                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={() => setShowDropdown(false)}
                          className="block px-4 py-2 text-xs uppercase tracking-wider text-accentRed hover:bg-bgCardHover transition-all"
                        >
                          Panel Admin
                        </Link>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-xs uppercase tracking-wider text-red-500 hover:bg-bgCardHover flex items-center space-x-2 border-t border-borderGray transition-all"
                      >
                        <FiLogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="border border-white hover:border-accentRed text-white hover:text-accentRed px-5 py-2 text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-300"
              >
                Ingresar
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center space-x-4">
          {/* Cart Icon - Ocultado para Administradores en Mobile */}
          {!isAdmin && (
            <Link to="/cart" className="relative p-2 text-white">
              <FiShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-accentRed text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-black">
                  {itemCount}
                </span>
              )}
            </Link>
          )}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-white hover:text-accentRed p-2 focus:outline-none"
          >
            {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slidedown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black border-b border-borderGray w-full"
          >
            <div className="px-6 py-8 flex flex-col space-y-6">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="text-sm uppercase tracking-wider font-semibold text-white hover:text-accentRed"
              >
                Inicio
              </Link>
              <Link 
                to="/shop" 
                onClick={() => setIsOpen(false)}
                className="text-sm uppercase tracking-wider font-semibold text-white hover:text-accentRed"
              >
                Tienda
              </Link>
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/profile" 
                    onClick={() => setIsOpen(false)}
                    className="text-sm uppercase tracking-wider font-semibold text-white hover:text-accentRed"
                  >
                    Mi Perfil
                  </Link>
                  {!isAdmin && (
                    <Link 
                      to="/profile?tab=orders" 
                      onClick={() => setIsOpen(false)}
                      className="text-sm uppercase tracking-wider font-semibold text-white hover:text-accentRed"
                    >
                      Mis Pedidos
                    </Link>
                  )}
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      onClick={() => setIsOpen(false)}
                      className="text-sm uppercase tracking-wider font-semibold text-accentRed"
                    >
                      Panel Administrador
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      handleLogout();
                    }}
                    className="text-left text-sm uppercase tracking-wider font-semibold text-red-500 flex items-center space-x-2"
                  >
                    <FiLogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  onClick={() => setIsOpen(false)}
                  className="bg-accentRed hover:bg-accentRedHover text-white text-center py-3 text-xs uppercase tracking-widest font-semibold"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
