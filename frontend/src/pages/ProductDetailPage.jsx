import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../services/axiosInstance';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { FiShoppingBag, FiArrowLeft, FiCheck } from 'react-icons/fi';
import Swal from 'sweetalert2';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [displayImage, setDisplayImage] = useState('');
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/products/${slug}/`);
        const prod = response.data;
        setProduct(prod);
        setDisplayImage(prod.image_principal);

        // Inicializar con el primer color disponible
        if (prod.variantes && prod.variantes.length > 0) {
          const colors = [...new Set(prod.variantes.map(v => v.color))];
          setSelectedColor(colors[0]);
        }

        // Obtener productos relacionados de la misma categoría
        const relatedRes = await axiosInstance.get(`/products/?category=${prod.category}&limit=4`);
        const relatedList = relatedRes.data.results || relatedRes.data || [];
        setRelatedProducts(relatedList.filter(p => p.id !== prod.id).slice(0, 4));
      } catch (error) {
        console.error("Error al obtener el producto", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen pt-28 pb-20 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-accentRed border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs uppercase tracking-widest text-textGray">Cargando prenda premium...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-black text-white min-h-screen pt-28 pb-20 flex flex-col items-center justify-center px-6">
        <h2 className="text-xl font-bold uppercase tracking-widest text-accentRed">Producto no encontrado</h2>
        <Link to="/shop" className="mt-4 bg-white text-black px-6 py-3 text-xs uppercase tracking-widest font-semibold flex items-center space-x-2">
          <FiArrowLeft /> <span>Volver a la Tienda</span>
        </Link>
      </div>
    );
  }

  // Obtener colores y tallas únicos de las variantes activas
  const activeVariants = product.variantes.filter(v => v.is_active);
  const availableColors = [...new Set(activeVariants.map(v => v.color))];
  
  // Tallas disponibles para el color seleccionado
  const sizesForColor = activeVariants
    .filter(v => v.color === selectedColor)
    .map(v => v.size);

  // Obtener la variante seleccionada (Color + Talla)
  const selectedVariant = activeVariants.find(
    v => v.color === selectedColor && (v.size === selectedSize || (!v.size && !selectedSize))
  );

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    setSelectedSize(''); // Resetear talla al cambiar de color
    
    // Si la variante de color tiene una imagen específica, la mostramos
    const colorVar = activeVariants.find(v => v.color === color);
    if (colorVar && colorVar.image) {
      setDisplayImage(colorVar.image);
    } else {
      setDisplayImage(product.image_principal);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      Swal.fire({
        title: 'Selecciona variante',
        text: 'Por favor selecciona un Color y una Talla.',
        icon: 'warning',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff'
      });
      return;
    }

    if (selectedVariant.stock <= 0) {
      Swal.fire({
        title: 'Agotado',
        text: 'Lo sentimos, esta combinación no tiene stock disponible.',
        icon: 'error',
        confirmButtonColor: '#E50914',
        background: '#0b0b0b',
        color: '#ffffff'
      });
      return;
    }

    await addToCart(selectedVariant.id, quantity);
  };

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Enlace para volver */}
        <Link to="/shop" className="inline-flex items-center space-x-2 text-xs uppercase tracking-wider text-textGray hover:text-white transition-colors mb-8">
          <FiArrowLeft />
          <span>Volver a Colecciones</span>
        </Link>

        {/* Ficha de Producto */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-24">
          
          {/* Columna Izquierda: Galería */}
          <div className="space-y-4">
            <div className="bg-neutral-950 border border-borderGray h-[550px] overflow-hidden">
              <img 
                src={displayImage || 'https://via.placeholder.com/600x700?text=Boutique+Clothing'} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Miniaturas de Galería */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {/* Imagen Principal */}
              <button 
                onClick={() => setDisplayImage(product.image_principal)}
                className={`w-20 h-24 border bg-neutral-950 shrink-0 ${
                  displayImage === product.image_principal ? 'border-accentRed' : 'border-borderGray'
                }`}
              >
                <img src={product.image_principal} alt="" className="w-full h-full object-cover" />
              </button>

              {/* Imágenes Adicionales */}
              {product.imagenes_adicionales?.map((img) => (
                <button 
                  key={img.id}
                  onClick={() => setDisplayImage(img.image)}
                  className={`w-20 h-24 border bg-neutral-950 shrink-0 ${
                    displayImage === img.image ? 'border-accentRed' : 'border-borderGray'
                  }`}
                >
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}

              {/* Imágenes de variantes (colores) */}
              {activeVariants.filter(v => v.image).map((v) => (
                <button 
                  key={v.id}
                  onClick={() => {
                    setDisplayImage(v.image);
                    setSelectedColor(v.color);
                    setSelectedSize(v.size || '');
                  }}
                  className={`w-20 h-24 border bg-neutral-950 shrink-0 ${
                    displayImage === v.image ? 'border-accentRed' : 'border-borderGray'
                  }`}
                >
                  <img src={v.image} alt={v.color} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Información y Compra */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Categoría y Título */}
              <div className="space-y-2">
                <span className="text-xs uppercase text-accentRed tracking-[0.2em] font-bold">
                  {product.category_detail?.name}
                </span>
                <h1 className="text-3xl md:text-4xl font-extrabold uppercase tracking-wide leading-tight">
                  {product.name}
                </h1>
                <p className="text-2xs text-textGray tracking-wider uppercase">SKU: {product.sku}</p>
              </div>

              {/* Precios */}
              <div className="flex items-baseline space-x-3 py-3 border-y border-borderGray">
                {product.offer_price ? (
                  <>
                    <span className="text-2xl font-black text-accentRed">${product.offer_price}</span>
                    <span className="text-sm text-textGray line-through">${product.price}</span>
                    <span className="text-[10px] bg-accentRed/10 border border-accentRed/30 text-accentRed px-2 py-0.5 uppercase font-bold tracking-widest">
                      Ahorra ${(product.price - product.offer_price).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-black text-white">${product.price}</span>
                )}
              </div>

              {/* Descripción */}
              <p className="text-xs text-textGray leading-relaxed font-light font-sans">
                {product.description}
              </p>

              {/* Selector de Colores */}
              {availableColors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-2xs uppercase tracking-widest text-textGray font-bold">Color: <span className="text-white ml-1">{selectedColor}</span></h4>
                  <div className="flex flex-wrap gap-2.5">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorSelect(color)}
                        className={`text-xs uppercase tracking-wider px-5 py-3 border transition-all ${
                          selectedColor === color 
                            ? 'bg-white text-black border-white font-bold' 
                            : 'bg-black text-white border-borderGray hover:border-white'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Selector de Tallas */}
              {sizesForColor.length > 0 && sizesForColor.some(s => s) && (
                <div className="space-y-3">
                  <h4 className="text-2xs uppercase tracking-widest text-textGray font-bold">Talla: <span className="text-white ml-1">{selectedSize || 'Selecciona'}</span></h4>
                  <div className="flex flex-wrap gap-2.5">
                    {sizesForColor.map((size) => {
                      if (!size) return null;
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`w-12 h-12 flex items-center justify-center border text-xs font-semibold uppercase transition-all ${
                            selectedSize === size 
                              ? 'bg-white text-black border-white' 
                              : 'bg-black text-white border-borderGray hover:border-white'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Indicador de Stock */}
              {selectedVariant && (
                <div className="flex items-center space-x-2 pt-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedVariant.stock > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-2xs uppercase tracking-widest font-semibold">
                    {selectedVariant.stock > 0 
                      ? `Disponible (${selectedVariant.stock} unidades)` 
                      : 'Agotado'}
                  </span>
                  {selectedVariant.stock > 0 && selectedVariant.stock <= product.min_stock_alert && (
                    <span className="text-[9px] uppercase tracking-widest bg-red-950 text-red-500 font-bold px-2 py-0.5 border border-red-900/50">
                      ¡Poco Stock!
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Selector de cantidad y botones de compra */}
            <div className="space-y-4 pt-6 border-t border-borderGray">
              
              {!isAdmin && (
                <div className="flex items-center space-x-4">
                  <span className="text-2xs uppercase tracking-widest text-textGray font-bold">Cantidad:</span>
                  <div className="flex items-center border border-borderGray">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 text-white hover:text-accentRed transition-colors"
                    >
                      -
                    </button>
                    <span className="px-4 text-xs font-semibold w-10 text-center">{quantity}</span>
                    <button 
                      onClick={() => {
                        const maxStock = selectedVariant ? selectedVariant.stock : 99;
                        setQuantity(Math.min(maxStock, quantity + 1));
                      }}
                      className="px-4 py-2 text-white hover:text-accentRed transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Botones */}
              {!isAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stock <= 0}
                    className="w-full bg-transparent hover:bg-white text-white hover:text-black border border-white disabled:border-borderGray disabled:text-textGray py-4 text-xs uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all duration-300 rounded-none"
                  >
                    <FiShoppingBag />
                    <span>Agregar al Carrito</span>
                  </button>
                  
                  <button
                    onClick={async () => {
                      if (selectedVariant && selectedVariant.stock > 0) {
                        const res = await addToCart(selectedVariant.id, quantity);
                        if (res.success) navigate('/cart');
                      } else {
                        handleAddToCart();
                      }
                    }}
                    disabled={!selectedVariant || selectedVariant.stock <= 0}
                    className="w-full bg-accentRed hover:bg-accentRedHover disabled:bg-red-950 text-white py-4 text-xs uppercase tracking-widest font-bold transition-all duration-300 rounded-none"
                  >
                    Comprar Ahora
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* 6. Productos Relacionados */}
        {relatedProducts.length > 0 && (
          <div className="space-y-10 border-t border-borderGray pt-20">
            <h3 className="text-xl font-bold uppercase tracking-wider text-center md:text-left">También te puede gustar</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <Link 
                  to={`/product/${p.slug}`} 
                  key={p.id} 
                  className="group bg-bgCard border border-borderGray overflow-hidden flex flex-col glow-on-hover"
                >
                  <div className="relative h-72 bg-neutral-950 overflow-hidden">
                    <img 
                      src={p.image_principal || 'https://via.placeholder.com/400x500?text=Premium+Clothing'} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h4 className="text-xs font-semibold uppercase text-white truncate group-hover:text-accentRed transition-colors">
                      {p.name}
                    </h4>
                    <span className="text-xs font-bold text-white mt-2 block">${p.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProductDetailPage;
