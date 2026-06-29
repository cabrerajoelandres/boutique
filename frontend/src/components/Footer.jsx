import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiTwitter, FiMapPin, FiMail, FiPhone } from 'react-icons/fi';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-borderGray text-textGray py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Info Marca */}
        <div className="space-y-6">
          <Link to="/" className="text-xl font-bold tracking-[0.25em] text-white uppercase">
            BOUTIQUE<span className="text-accentRed">.</span>
          </Link>
          <p className="text-xs leading-relaxed text-textGray">
            Prendas exclusivas de corte urbano y estilo minimalista premium. Diseñadas para destacar con personalidad y elegancia.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="p-2 border border-borderGray hover:border-accentRed hover:text-white transition-colors">
              <FiInstagram className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 border border-borderGray hover:border-accentRed hover:text-white transition-colors">
              <FiFacebook className="w-4 h-4" />
            </a>
            <a href="#" className="p-2 border border-borderGray hover:border-accentRed hover:text-white transition-colors">
              <FiTwitter className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Enlaces rápidos */}
        <div className="space-y-4">
          <h4 className="text-white text-xs uppercase tracking-widest font-semibold">Enlaces Rápidos</h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <Link to="/" className="hover:text-accentRed transition-colors">Inicio</Link>
            </li>
            <li>
              <Link to="/shop" className="hover:text-accentRed transition-colors">Tienda (Catálogo)</Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-accentRed transition-colors">Mi Cuenta</Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-accentRed transition-colors">Carrito de Compras</Link>
            </li>
          </ul>
        </div>

        {/* Soporte / Políticas */}
        <div className="space-y-4">
          <h4 className="text-white text-xs uppercase tracking-widest font-semibold">Soporte</h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <a href="#" className="hover:text-accentRed transition-colors">Preguntas Frecuentes</a>
            </li>
            <li>
              <a href="#" className="hover:text-accentRed transition-colors">Políticas de Envío</a>
            </li>
            <li>
              <a href="#" className="hover:text-accentRed transition-colors">Políticas de Devolución</a>
            </li>
            <li>
              <a href="#" className="hover:text-accentRed transition-colors">Términos y Condiciones</a>
            </li>
          </ul>
        </div>

        {/* Contacto */}
        <div className="space-y-4">
          <h4 className="text-white text-xs uppercase tracking-widest font-semibold">Contacto</h4>
          <ul className="space-y-3.5 text-xs">
            <li className="flex items-start space-x-3">
              <FiMapPin className="w-4 h-4 text-accentRed shrink-0" />
              <span>Av. de los Granados & Eloy Alfaro, Quito, Ecuador</span>
            </li>
            <li className="flex items-center space-x-3">
              <FiMail className="w-4 h-4 text-accentRed shrink-0" />
              <span>info@boutiquepremium.com</span>
            </li>
            <li className="flex items-center space-x-3">
              <FiPhone className="w-4 h-4 text-accentRed shrink-0" />
              <span>+593 99 999 9999</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mt-12 pt-8 border-t border-borderGray flex flex-col md:flex-row justify-between items-center text-2xs text-textGray">
        <p>© {currentYear} BOUTIQUE. Todos los derechos reservados.</p>
        <p className="mt-2 md:mt-0">Diseño y desarrollo de alta gama.</p>
      </div>
    </footer>
  );
};

export default Footer;
