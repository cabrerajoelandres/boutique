import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { FiSearch, FiSliders, FiX, FiCheck } from 'react-icons/fi';

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Obtener parámetros de URL
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const offerParam = searchParams.get('offer') === 'true';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/categories/');
        setCategories(response.data.results || response.data || []);
      } catch (error) {
        console.error("Error al obtener categorías", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `/products/?`;
        if (categoryParam) url += `category=${categoryParam}&`;
        if (searchParam) url += `search=${searchParam}&`;
        if (offerParam) url += `offer=true&`;

        const response = await axiosInstance.get(url);
        setProducts(response.data.results || response.data || []);
      } catch (error) {
        console.error("Error al obtener productos", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryParam, searchParam, offerParam]);

  const handleCategorySelect = (id) => {
    const params = new URLSearchParams(searchParams);
    if (id) {
      params.set('category', id);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  const handleSearchChange = (e) => {
    const params = new URLSearchParams(searchParams);
    if (e.target.value) {
      params.set('search', e.target.value);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleToggleOffer = () => {
    const params = new URLSearchParams(searchParams);
    if (!offerParam) {
      params.set('offer', 'true');
    } else {
      params.delete('offer');
    }
    setSearchParams(params);
  };

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Título de la tienda */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black tracking-widest uppercase">Colecciones</h1>
          <p className="text-xs text-textGray mt-2">Navega por nuestro catálogo exclusivo y encuentra tu estilo premium.</p>
        </div>

        {/* Barra de Búsqueda e Interacciones */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-bgCard border border-borderGray p-4 mb-8">
          
          {/* Input de Búsqueda */}
          <div className="relative w-full md:w-96">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-textGray w-4 h-4" />
            <input 
              type="text"
              placeholder="Buscar prendas..."
              value={searchParam}
              onChange={handleSearchChange}
              className="w-full bg-black border border-borderGray text-white text-xs pl-11 pr-4 py-3 focus:outline-none focus:border-accentRed rounded-none"
            />
          </div>

          {/* Filtros de Escritorio */}
          <div className="flex w-full md:w-auto justify-between md:justify-end items-center gap-4">
            {/* Toggle de Ofertas */}
            <button 
              onClick={handleToggleOffer}
              className={`flex items-center space-x-2 border text-xs px-5 py-3 uppercase tracking-wider transition-all duration-300 ${
                offerParam 
                  ? 'bg-accentRed border-accentRed text-white' 
                  : 'bg-black border-borderGray text-textGray hover:border-white hover:text-white'
              }`}
            >
              {offerParam && <FiCheck className="w-3.5 h-3.5" />}
              <span>En Oferta</span>
            </button>

            {/* Botón Filtros Móviles */}
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center space-x-2 bg-black border border-borderGray text-white text-xs px-5 py-3 uppercase tracking-wider hover:border-white"
            >
              <FiSliders />
              <span>Filtros</span>
            </button>
          </div>
        </div>

        {/* Layout Principal: Sidebar de Filtros + Grid de Productos */}
        <div className="flex gap-10">
          
          {/* Sidebar de Filtros (Escritorio) */}
          <aside className="hidden md:block w-64 shrink-0 space-y-8">
            <div className="border-b border-borderGray pb-4">
              <h3 className="text-xs uppercase tracking-widest font-bold text-white">Categorías</h3>
            </div>
            
            <ul className="space-y-3 text-xs uppercase tracking-wider">
              <li>
                <button 
                  onClick={() => handleCategorySelect('')}
                  className={`w-full text-left transition-colors hover:text-accentRed ${
                    !categoryParam ? 'text-accentRed font-semibold' : 'text-textGray'
                  }`}
                >
                  Ver Todo
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button 
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`w-full text-left transition-colors hover:text-accentRed ${
                      categoryParam === String(cat.id) ? 'text-accentRed font-semibold' : 'text-textGray'
                    }`}
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          {/* Grid de Productos */}
          <main className="flex-1">
            {loading ? (
              /* Skeleton Loading Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="animate-pulse bg-bgCard border border-borderGray p-4 space-y-4 h-[400px]">
                    <div className="bg-neutral-900 h-64 w-full" />
                    <div className="h-4 bg-neutral-900 w-2/3" />
                    <div className="h-3 bg-neutral-900 w-1/3" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              /* No Products Found */
              <div className="text-center py-20 border border-dashed border-borderGray">
                <p className="text-xs uppercase tracking-widest text-textGray">No se encontraron prendas con los filtros seleccionados.</p>
                <button 
                  onClick={() => setSearchParams({})}
                  className="mt-4 bg-white hover:bg-accentRed text-black hover:text-white px-6 py-3 text-2xs uppercase tracking-widest font-bold transition-all"
                >
                  Limpiar Filtros
                </button>
              </div>
            ) : (
              /* Product Grid */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link 
                    to={`/product/${product.slug}`} 
                    key={product.id} 
                    className="group bg-bgCard border border-borderGray overflow-hidden flex flex-col glow-on-hover"
                  >
                    {/* Imagen principal */}
                    <div className="relative h-80 bg-neutral-950 overflow-hidden">
                      <img 
                        src={product.image_principal || 'https://via.placeholder.com/400x500?text=Premium+Clothing'} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      {product.offer_price && (
                        <div className="absolute top-4 left-4 bg-accentRed text-white text-[9px] font-extrabold px-2 py-1 uppercase tracking-widest">
                          Oferta
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase text-textGray tracking-wider font-light">
                          {product.category_detail?.name || 'Prenda'}
                        </span>
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-white mt-1 group-hover:text-accentRed transition-colors truncate">
                          {product.name}
                        </h3>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-baseline space-x-2">
                          {product.offer_price ? (
                            <>
                              <span className="text-sm font-bold text-accentRed">${product.offer_price}</span>
                              <span className="text-xs text-textGray line-through">${product.price}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-white">${product.price}</span>
                          )}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-accentRed">Ver Detalle</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </main>

        </div>
      </div>

      {/* Cajón de Filtros Móviles (Mobile Drawer) */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-80 bg-bgCard border-l border-borderGray p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center border-b border-borderGray pb-4 mb-6">
                <h3 className="text-xs uppercase tracking-widest font-bold text-white">Filtros</h3>
                <button onClick={() => setShowMobileFilters(false)} className="text-white hover:text-accentRed">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Categorías */}
              <div className="space-y-4">
                <h4 className="text-2xs uppercase tracking-widest text-textGray font-bold">Categorías</h4>
                <ul className="space-y-3 text-xs uppercase tracking-wider">
                  <li>
                    <button 
                      onClick={() => {
                        handleCategorySelect('');
                        setShowMobileFilters(false);
                      }}
                      className={`w-full text-left py-1 transition-colors ${
                        !categoryParam ? 'text-accentRed font-semibold' : 'text-textGray'
                      }`}
                    >
                      Ver Todo
                    </button>
                  </li>
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button 
                        onClick={() => {
                          handleCategorySelect(cat.id);
                          setShowMobileFilters(false);
                        }}
                        className={`w-full text-left py-1 transition-colors ${
                          categoryParam === String(cat.id) ? 'text-accentRed font-semibold' : 'text-textGray'
                        }`}
                      >
                        {cat.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button 
              onClick={() => setShowMobileFilters(false)}
              className="w-full bg-white text-black py-4 text-xs uppercase tracking-widest font-bold"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ShopPage;
