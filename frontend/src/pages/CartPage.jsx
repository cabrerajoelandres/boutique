import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { FiTrash2, FiShoppingBag, FiArrowRight, FiArrowLeft } from 'react-icons/fi';

const CartPage = () => {
  const { cart, loading, updateCartItem, removeCartItem } = useCart();
  const navigate = useNavigate();

  const handleQtyChange = async (itemId, currentQty, amount, stock) => {
    const newQty = currentQty + amount;
    if (newQty < 1) return;
    if (newQty > stock) return;
    await updateCartItem(itemId, newQty);
  };

  if (loading && !cart) {
    return (
      <div className="bg-black text-white min-h-screen pt-28 pb-20 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accentRed border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const items = cart?.items || [];

  return (
    <div className="bg-black text-white min-h-screen pt-28 pb-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        
        {/* Título */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-black tracking-widest uppercase">Tu Carrito</h1>
          <p className="text-xs text-textGray mt-2">Revisa las prendas seleccionadas antes de proceder al pago.</p>
        </div>

        {items.length === 0 ? (
          /* Carrito vacío */
          <div className="text-center py-24 border border-dashed border-borderGray bg-bgCard max-w-2xl mx-auto space-y-6">
            <div className="flex justify-center">
              <FiShoppingBag className="w-12 h-12 text-textGray" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wider">Tu carrito está vacío</h2>
            <p className="text-xs text-textGray font-light max-w-xs mx-auto">
              Parece que aún no has agregado ninguna prenda a tu bolsa de compras.
            </p>
            <Link 
              to="/shop" 
              className="inline-flex items-center space-x-2 bg-white hover:bg-accentRed text-black hover:text-white px-8 py-4 text-xs uppercase tracking-widest font-semibold transition-all duration-300"
            >
              <FiArrowLeft /> <span>Ver Colecciones</span>
            </Link>
          </div>
        ) : (
          /* Carrito con items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Lista de Items (Columna Izquierda) */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => {
                const variant = item.variant_detail;
                const product = variant.product;
                const price = product.offer_price || product.price;

                return (
                  <div 
                    key={item.id} 
                    className="flex flex-col sm:flex-row items-center gap-6 bg-bgCard border border-borderGray p-5 relative"
                  >
                    {/* Imagen */}
                    <div className="w-24 h-32 bg-neutral-950 border border-borderGray shrink-0 overflow-hidden">
                      <img 
                        src={variant.image || product.image_principal} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Detalles */}
                    <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-white truncate">
                        {product.name}
                      </h3>
                      <p className="text-2xs text-textGray uppercase tracking-wider">
                        Color: <span className="text-white font-medium">{variant.color}</span>
                        {variant.size && (
                          <> | Talla: <span className="text-white font-medium">{variant.size}</span></>
                        )}
                      </p>
                      <p className="text-xs text-accentRed font-bold">${parseFloat(price).toFixed(2)}</p>
                    </div>

                    {/* Selector de Cantidad */}
                    <div className="flex items-center border border-borderGray bg-black">
                      <button 
                        onClick={() => handleQtyChange(item.id, item.quantity, -1, variant.stock)}
                        className="px-3 py-1.5 hover:text-accentRed transition-colors"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-semibold w-8 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => handleQtyChange(item.id, item.quantity, 1, variant.stock)}
                        className="px-3 py-1.5 hover:text-accentRed transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal Item */}
                    <div className="text-right min-w-[80px] hidden sm:block">
                      <p className="text-xs text-textGray uppercase tracking-wider">Subtotal</p>
                      <p className="text-sm font-bold text-white mt-1">${(price * item.quantity).toFixed(2)}</p>
                    </div>

                    {/* Botón Eliminar */}
                    <button 
                      onClick={() => removeCartItem(item.id)}
                      className="absolute top-4 right-4 sm:static text-textGray hover:text-accentRed p-2 transition-colors"
                      title="Eliminar del carrito"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>

                  </div>
                );
              })}
            </div>

            {/* Resumen de Compra (Columna Derecha) */}
            <div className="space-y-6">
              <div className="bg-bgCard border border-borderGray p-6 md:p-8 space-y-6">
                <h3 className="text-xs uppercase tracking-widest font-bold text-white border-b border-borderGray pb-4">Resumen del Pedido</h3>
                
                <div className="space-y-3 text-xs uppercase tracking-wider">
                  <div className="flex justify-between text-textGray">
                    <span>Subtotal</span>
                    <span>${parseFloat(cart.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-textGray">
                    <span>Envío</span>
                    <span>$5.00</span>
                  </div>
                  <div className="flex justify-between text-textGray">
                    <span>IVA (12%)</span>
                    <span>${(parseFloat(cart.total) * 0.12).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-3 border-t border-borderGray text-sm">
                    <span>Total</span>
                    <span className="text-accentRed">${(parseFloat(cart.total) * 1.12 + 5.00).toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-accentRed hover:bg-accentRedHover text-white py-4 text-xs uppercase tracking-widest font-bold flex items-center justify-center space-x-2 transition-all duration-300 rounded-none hover:scale-[1.01]"
                >
                  <span>Proceder al Pago</span>
                  <FiArrowRight />
                </button>
              </div>

              <Link 
                to="/shop" 
                className="w-full border border-borderGray hover:border-white text-white text-center py-4 text-xs uppercase tracking-widest font-semibold flex items-center justify-center space-x-2 transition-colors"
              >
                <FiArrowLeft />
                <span>Seguir Comprando</span>
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CartPage;
