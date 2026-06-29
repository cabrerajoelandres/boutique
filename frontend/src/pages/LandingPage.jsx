import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { FiArrowRight, FiShield, FiTruck, FiRefreshCw, FiAward } from 'react-icons/fi';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await axiosInstance.get('/products/');
        // Tomar los últimos 4 productos
        setProducts(response.data.results || response.data.slice(0, 4) || []);
      } catch (error) {
        console.error("Error al obtener productos destacados", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedProducts();
  }, []);

  // Animaciones Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 60 } }
  };

  return (
    <div className="bg-black text-white min-h-screen pt-20">
      
      {/* 1. Hero Section (A pantalla completa, premium dark) */}
      <section className="relative h-[90vh] flex items-center justify-center bg-black overflow-hidden px-6 lg:px-12 border-b border-borderGray">
        {/* Imagen de fondo con desenfoque y overlay oscuro */}
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-[2px] opacity-50 z-0"
          style={{ backgroundImage: "url('/static/hero-bg.jpg')" }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90 z-0"></div>

        {/* Efectos de luces de fondo (Glow) */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-red-950/10 blur-[120px] bg-glow-pulse z-0"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-red-800/5 blur-[120px] bg-glow-pulse z-0"></div>

        <div className="relative z-10 text-center max-w-4xl space-y-6">
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-xs uppercase tracking-[0.4em] text-accentRed font-bold"
          >
            Colección Urbana 2026
          </motion.p>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-8xl font-black tracking-tighter uppercase font-sans leading-none"
          >
            Cultura & <br />
            <span className="text-stroke">Exclusividad</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-textGray text-sm md:text-base max-w-xl mx-auto font-light leading-relaxed"
          >
            Prendas de alta gama diseñadas con cortes oversize perfectos y materiales premium. Define tu propio estilo.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6"
          >
            <Link 
              to="/shop" 
              className="w-full sm:w-auto bg-accentRed hover:bg-accentRedHover text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-300 hover:scale-105"
            >
              Ver Colección
            </Link>
            <Link 
              to="/shop?offer=true" 
              className="w-full sm:w-auto border border-white hover:border-accentRed text-white hover:text-accentRed px-8 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-300"
            >
              Ofertas Especiales
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 2. Colecciones Destacadas (Categorías) */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 border-b border-borderGray pb-6">
          <h2 className="text-2xl font-bold tracking-wider uppercase">Nuestras Líneas</h2>
          <Link to="/shop" className="text-xs uppercase tracking-wider text-accentRed hover:text-white flex items-center space-x-2 transition-colors">
            <span>Explorar catálogo</span>
            <FiArrowRight />
          </Link>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Tarjeta 1 - Oversize */}
          <motion.div variants={itemVariants} className="relative group overflow-hidden bg-bgCard border border-borderGray h-[450px]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
            <div className="absolute inset-0 bg-red-950/10 mix-blend-overlay group-hover:bg-red-950/20 transition-all duration-500" />
            
            {/* Visual placeholder en degradé oscuro estilo luxury */}
            <div className="w-full h-full bg-gradient-to-br from-neutral-900 to-black flex items-center justify-center text-8xl font-black text-white/5 uppercase select-none">
              OVS
            </div>

            <div className="absolute bottom-0 left-0 w-full p-8 z-20 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-accentRed font-bold bg-accentRed/10 px-2.5 py-1 border border-accentRed/20">Popular</span>
              <h3 className="text-xl font-bold uppercase tracking-wide text-white">Estilo Oversize</h3>
              <p className="text-xs text-textGray font-light">Camisetas de corte drop-shoulder y buzos pesados.</p>
              <Link to="/shop?category=1" className="inline-flex items-center text-xs uppercase tracking-wider text-white group-hover:text-accentRed font-semibold transition-colors pt-2">
                <span>Comprar</span>
                <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Tarjeta 2 - Accesorios */}
          <motion.div variants={itemVariants} className="relative group overflow-hidden bg-bgCard border border-borderGray h-[450px]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
            
            <div className="w-full h-full bg-gradient-to-tr from-neutral-950 to-neutral-900 flex items-center justify-center text-8xl font-black text-white/5 uppercase select-none">
              ACC
            </div>

            <div className="absolute bottom-0 left-0 w-full p-8 z-20 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-textGray font-bold bg-white/5 px-2.5 py-1 border border-white/10">Esencial</span>
              <h3 className="text-xl font-bold uppercase tracking-wide text-white">Accesorios</h3>
              <p className="text-xs text-textGray font-light">Gorras, bolsos y complementos urbanos.</p>
              <Link to="/shop" className="inline-flex items-center text-xs uppercase tracking-wider text-white group-hover:text-accentRed font-semibold transition-colors pt-2">
                <span>Comprar</span>
                <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* Tarjeta 3 - Abrigos */}
          <motion.div variants={itemVariants} className="relative group overflow-hidden bg-bgCard border border-borderGray h-[450px]">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
            
            <div className="w-full h-full bg-gradient-to-bl from-neutral-900 to-neutral-950 flex items-center justify-center text-8xl font-black text-white/5 uppercase select-none">
              OUT
            </div>

            <div className="absolute bottom-0 left-0 w-full p-8 z-20 space-y-3">
              <span className="text-[10px] uppercase tracking-widest text-accentRed font-bold bg-accentRed/10 px-2.5 py-1 border border-accentRed/20">Nueva Colección</span>
              <h3 className="text-xl font-bold uppercase tracking-wide text-white">Chaquetas & Hoodies</h3>
              <p className="text-xs text-textGray font-light">Abrigos confeccionados con materiales aislantes y cómodos.</p>
              <Link to="/shop" className="inline-flex items-center text-xs uppercase tracking-wider text-white group-hover:text-accentRed font-semibold transition-colors pt-2">
                <span>Comprar</span>
                <FiArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 3. Nuevos Ingresos (Productos del Backend) */}
      <section className="py-24 bg-bgCard border-y border-borderGray">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-wider uppercase">Nuevos Ingresos</h2>
            <p className="text-xs text-textGray mt-2">Nuestros últimos lanzamientos directamente a tu armario.</p>
          </div>

          {loading ? (
            // Skeleton loading
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse space-y-4">
                  <div className="bg-neutral-900 h-80 w-full" />
                  <div className="h-4 bg-neutral-900 w-2/3" />
                  <div className="h-3 bg-neutral-900 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-borderGray">
              <p className="text-xs text-textGray uppercase tracking-widest">No hay productos disponibles en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link 
                  to={`/product/${product.slug}`} 
                  key={product.id} 
                  className="group bg-black border border-borderGray overflow-hidden flex flex-col glow-on-hover"
                >
                  {/* Contenedor de Imagen */}
                  <div className="relative h-80 overflow-hidden bg-neutral-950">
                    <img 
                      src={product.image_principal || 'https://via.placeholder.com/400x500?text=Premium+Clothing'} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.offer_price && (
                      <span className="absolute top-4 left-4 bg-accentRed text-white text-[9px] font-bold px-2 py-1 uppercase tracking-widest">
                        Oferta
                      </span>
                    )}
                  </div>
                  
                  {/* Detalles */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase text-textGray tracking-wider font-light">
                        {product.category_detail?.name || 'Prenda'}
                      </span>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-white mt-1 group-hover:text-accentRed transition-colors truncate">
                        {product.name}
                      </h3>
                    </div>
                    <div className="mt-4 flex items-baseline space-x-2">
                      {product.offer_price ? (
                        <>
                          <span className="text-sm font-bold text-accentRed">${product.offer_price}</span>
                          <span className="text-xs text-textGray line-through">${product.price}</span>
                        </>
                      ) : (
                        <span className="text-sm font-bold text-white">${product.price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Por qué elegirnos (Beneficios) */}
      <section className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="text-center space-y-3 p-6 border border-borderGray bg-bgCard">
            <div className="flex justify-center">
              <FiTruck className="w-8 h-8 text-accentRed" />
            </div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Envíos Rápidos</h4>
            <p className="text-xs text-textGray font-light">Entregas seguras a nivel nacional en 24/48 horas.</p>
          </div>

          <div className="text-center space-y-3 p-6 border border-borderGray bg-bgCard">
            <div className="flex justify-center">
              <FiShield className="w-8 h-8 text-accentRed" />
            </div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Pagos 100% Seguros</h4>
            <p className="text-xs text-textGray font-light">Verificación de transferencias bancarias rápida y transparente.</p>
          </div>

          <div className="text-center space-y-3 p-6 border border-borderGray bg-bgCard">
            <div className="flex justify-center">
              <FiRefreshCw className="w-8 h-8 text-accentRed" />
            </div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Cambios Sencillos</h4>
            <p className="text-xs text-textGray font-light">Tienes hasta 15 días para solicitar cambios de talla.</p>
          </div>

          <div className="text-center space-y-3 p-6 border border-borderGray bg-bgCard">
            <div className="flex justify-center">
              <FiAward className="w-8 h-8 text-accentRed" />
            </div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">Garantía Premium</h4>
            <p className="text-xs text-textGray font-light">Materiales seleccionados de la más alta resistencia.</p>
          </div>

        </div>
      </section>

      {/* 5. Lookbook / Boletín */}
      <section className="py-24 bg-bgCard border-t border-borderGray text-center px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold tracking-wider uppercase text-white">Únete a la Élite</h2>
          <p className="text-xs text-textGray font-light leading-relaxed">
            Suscríbete a nuestro boletín para recibir acceso prioritario a nuevos lanzamientos, ofertas exclusivas y un 10% de descuento en tu primera compra.
          </p>
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3 pt-4">
            <input 
              type="email" 
              placeholder="Tu correo electrónico" 
              className="bg-black border border-borderGray text-white text-xs px-6 py-4 flex-1 focus:outline-none focus:border-accentRed rounded-none"
              required
            />
            <button 
              type="submit" 
              className="bg-white hover:bg-accentRed text-black hover:text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-300 rounded-none"
            >
              Suscribirse
            </button>
          </form>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
