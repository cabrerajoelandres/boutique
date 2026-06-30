import React, { useEffect, useState } from 'react';
import axiosInstance from '../services/axiosInstance';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { 
  FiPackage, FiList, FiTrendingUp, FiShoppingBag, FiUsers, 
  FiAlertTriangle, FiPlus, FiEdit2, FiTrash2, FiEye, FiCheck, FiX, 
  FiChevronDown, FiChevronUp, FiPlusCircle 
} from 'react-icons/fi';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell 
} from 'recharts';
import Swal from 'sweetalert2';

const GENDER_OPTIONS = [
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'HOMBRE', label: 'Hombre' },
  { value: 'MUJER', label: 'Mujer' },
];

const SIZE_OPTIONS = [
  { value: '', label: 'Ninguna / Única' },
  { value: 'XS', label: 'XS - Extra Small' },
  { value: 'S', label: 'S - Small' },
  { value: 'M', label: 'M - Medium' },
  { value: 'L', label: 'L - Large' },
  { value: 'XL', label: 'XL' },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Estados de datos
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [movements, setMovements] = useState([]);
  const [inventoryStats, setInventoryStats] = useState(null);

  // Estados de expansión de filas
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedInvProductId, setExpandedInvProductId] = useState(null);

  // Modales y formularios
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Gestión de Variantes en el Formulario
  const [hasVariants, setHasVariants] = useState(true);
  const [singleVariantId, setSingleVariantId] = useState(null);
  const [deletedVariantIds, setDeletedVariantIds] = useState([]);
  const [productVariants, setProductVariants] = useState([
    { color: '', size: '', stock: 0, image: null }
  ]);

  const { register: regProd, handleSubmit: handleProdSubmit, reset: resetProd, setValue } = useForm();
  const { register: regCat, handleSubmit: handleCatSubmit, reset: resetCat } = useForm();

  // Cargar estadísticas globales del Dashboard
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const res = await axiosInstance.get('/dashboard/stats/');
      setStats(res.data);
    } catch (error) {
      console.error("Error al cargar estadísticas", error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Cargar productos
  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get('/products/?all_products=true');
      setProducts(res.data.results || res.data || []);
    } catch (err) { console.error(err); }
  };

  // Cargar categorías
  const fetchCategories = async () => {
    try {
      const res = await axiosInstance.get('/categories/');
      setCategories(res.data.results || res.data || []);
    } catch (err) { console.error(err); }
  };

  // Cargar pedidos
  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get('/orders/');
      setOrders(res.data.results || res.data || []);
    } catch (err) { console.error(err); }
  };

  // Cargar clientes (desde la base de datos + historial de pedidos)
  const fetchClients = async () => {
    try {
      const resClients = await axiosInstance.get('/auth/clients/');
      const clientsList = resClients.data.results || resClients.data || [];

      const resOrders = await axiosInstance.get('/orders/');
      const ordersList = resOrders.data.results || resOrders.data || [];

      const updatedClients = clientsList.map(c => {
        const userOrders = ordersList.filter(o => o.user === c.email || o.user_email === c.email);
        const totalSpent = userOrders.reduce((sum, o) => {
          if (['PAYMENT_APPROVED', 'PREPARING', 'SHIPPED', 'DELIVERED'].includes(o.status)) {
            return sum + parseFloat(o.total);
          }
          return sum;
        }, 0);
        const lastOrder = userOrders.length > 0 
          ? userOrders.reduce((latest, o) => new Date(o.created_at) > new Date(latest.created_at) ? o : latest) 
          : null;

        return {
          ...c,
          ordersCount: userOrders.length,
          totalSpent: totalSpent,
          lastOrderDate: lastOrder ? lastOrder.created_at : null
        };
      });

      setClients(updatedClients);
    } catch (err) { console.error("Error al cargar clientes", err); }
  };

  // Cargar inventario
  const fetchInventory = async () => {
    try {
      const resStats = await axiosInstance.get('/inventory/status/');
      setInventoryStats(resStats.data);
      const resMov = await axiosInstance.get('/inventory/');
      setMovements(resMov.data.results || resMov.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'categories') fetchCategories();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'clients') fetchClients();
    if (activeTab === 'inventory') {
      fetchInventory();
      fetchProducts();
    }
  }, [activeTab]);

  // CRUD Categorías
  const onCategorySubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('is_active', data.is_active === 'true');
      if (data.image && data.image[0]) {
        formData.append('image', data.image[0]);
      }

      if (editingCategory) {
        await axiosInstance.put(`/categories/${editingCategory.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Éxito', 'Categoría actualizada con éxito.', 'success');
      } else {
        await axiosInstance.post('/categories/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Éxito', 'Categoría creada con éxito.', 'success');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      resetCat();
      fetchCategories();
      fetchDashboardStats();
    } catch (error) {
      Swal.fire('Error', 'Error al guardar la categoría', 'error');
    }
  };

  // CRUD Productos
  const onProductSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('category', data.category);
      
      // Auto-reemplazar comas por puntos en los precios para evitar errores decimales de base de datos
      const cleanPrice = String(data.price).replace(',', '.');
      formData.append('price', cleanPrice);
      
      if (data.offer_price) {
        const cleanOfferPrice = String(data.offer_price).replace(',', '.');
        formData.append('offer_price', cleanOfferPrice);
      }
      
      formData.append('brand', data.brand || 'Boutique');
      formData.append('gender', data.gender || 'UNISEX');
      formData.append('is_active', data.is_active === 'true');
      formData.append('min_stock_alert', data.min_stock_alert || 5);
      
      if (data.image_principal && data.image_principal[0]) {
        formData.append('image_principal', data.image_principal[0]);
      }

      if (!hasVariants) {
        if (singleVariantId) {
          formData.append('variantes[0]id', singleVariantId);
        }
        formData.append('variantes[0]color', 'Único');
        formData.append('variantes[0]size', '');
        formData.append('variantes[0]stock', data.stock_general || 0);
        formData.append('variantes[0]is_active', 'true');
      } else {
        productVariants.forEach((v, index) => {
          if (v.id) {
            formData.append(`variantes[${index}]id`, v.id);
          }
          formData.append(`variantes[${index}]color`, v.color || 'Único');
          formData.append(`variantes[${index}]size`, v.size || '');
          formData.append(`variantes[${index}]stock`, v.stock || 0);
          formData.append(`variantes[${index}]is_active`, 'true');
          if (v.image) {
            formData.append(`variantes[${index}]image`, v.image);
          }
        });
      }

      if (deletedVariantIds.length > 0) {
        formData.append('deleted_variants', JSON.stringify(deletedVariantIds));
      }

      if (editingProduct) {
        await axiosInstance.patch(`/products/${editingProduct.slug}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Éxito', 'Producto actualizado con éxito.', 'success');
      } else {
        await axiosInstance.post('/products/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Éxito', 'Producto creado con éxito.', 'success');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setSingleVariantId(null);
      setDeletedVariantIds([]);
      setProductVariants([{ color: '', size: '', stock: 0, image: null }]);
      resetProd();
      fetchProducts();
      fetchDashboardStats();
    } catch (error) {
      console.error(error);
      const errorData = error.response?.data;
      let errorMsg = 'No se pudo guardar el producto debido a campos inválidos.';

      if (errorData && typeof errorData === 'object') {
        errorMsg = Object.entries(errorData)
          .map(([field, msgs]) => {
            const fieldName = field === 'image_principal' ? 'Imagen principal' : field === 'offer_price' ? 'Precio de oferta' : field === 'price' ? 'Precio' : field;
            return `${fieldName}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`;
          })
          .join('\n');
      }

      Swal.fire({
        title: 'Error de Validación',
        text: errorMsg,
        icon: 'error',
        background: '#0b0b0b',
        color: '#ffffff',
        confirmButtonColor: '#E50914'
      });
    }
  };

  // Agregar variante fila
  const addVariantRow = () => {
    setProductVariants([...productVariants, { color: '', size: '', stock: 0, image: null }]);
  };

  // Quitar variante fila
  const removeVariantRow = (index) => {
    const list = [...productVariants];
    const removedVariant = list[index];
    if (removedVariant?.id) {
      setDeletedVariantIds([...deletedVariantIds, removedVariant.id]);
    }
    list.splice(index, 1);
    setProductVariants(list);
  };

  // Cambiar campo variante
  const handleVariantFieldChange = (index, field, value) => {
    const list = [...productVariants];
    list[index][field] = value;
    setProductVariants(list);
  };

  // Agrupar variantes por color para mostrarlas como bloques más limpios
  const groupedVariants = productVariants.reduce((groups, variant, index) => {
    const colorKey = variant.color || '__empty__';
    if (!groups[colorKey]) {
      groups[colorKey] = [];
    }
    groups[colorKey].push({ ...variant, index });
    return groups;
  }, {});

  const addVariantForColor = (color) => {
    setProductVariants((current) => [
      ...current,
      { color, size: '', stock: 0, image: null }
    ]);
  };

  // Cambiar estado de pedido
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await axiosInstance.patch(`/orders/${orderId}/status/`, { status: newStatus });
      Swal.fire('Éxito', 'Estado del pedido actualizado', 'success');
      fetchOrders();
      fetchDashboardStats();
    } catch (error) {
      Swal.fire('Error', 'No se pudo cambiar el estado del pedido', 'error');
    }
  };

  // Ver comprobante
  const handleViewReceipt = (receiptUrl) => {
    if (!receiptUrl) {
      Swal.fire('Sin comprobante', 'No se ha subido comprobante para este pedido.', 'info');
      return;
    }
    Swal.fire({
      title: 'Comprobante de Pago',
      imageUrl: receiptUrl,
      imageAlt: 'Comprobante de Transferencia',
      confirmButtonText: 'Cerrar',
      confirmButtonColor: '#E50914',
      background: '#0b0b0b',
      color: '#ffffff'
    });
  };

  // Cambiar estatus de actividad del producto rápido
  const handleToggleProductActive = async (product) => {
    try {
      await axiosInstance.patch(`/products/${product.slug}/`, { is_active: !product.is_active });
      fetchProducts();
    } catch (error) {
      Swal.fire('Error', 'No se pudo cambiar el estado del producto', 'error');
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (product) => {
    Swal.fire({
      title: '¿Desactivar Producto?',
      text: `Esta acción desactivará el producto ${product.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E50914',
      cancelButtonColor: '#222222',
      confirmButtonText: 'Desactivar',
      background: '#0b0b0b',
      color: '#ffffff'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosInstance.delete(`/products/${product.slug}/`);
          Swal.fire('Éxito', 'Producto desactivado', 'success');
          fetchProducts();
          fetchDashboardStats();
        } catch (error) {
          Swal.fire('Error', 'No se pudo desactivar el producto', 'error');
        }
      }
    });
  };

  // Ajustar Stock Manualmente
  const handleAdjustStock = (variant) => {
    Swal.fire({
      title: `Ajustar Stock: (${variant.color} - ${variant.size || 'Única'})`,
      background: '#0b0b0b',
      color: '#ffffff',
      html: `
        <div class="flex flex-col space-y-4 text-xs text-left">
          <label class="font-bold text-textGray">TIPO DE AJUSTE</label>
          <select id="adj-type" class="w-full bg-black border border-borderGray text-white p-2.5 outline-none rounded-none">
            <option value="IN">Entrada (Sumar al stock)</option>
            <option value="OUT">Salida (Descontar del stock)</option>
          </select>
          
          <label class="font-bold text-textGray">CANTIDAD (UNIDADES)</label>
          <input id="adj-qty" type="number" min="1" value="5" class="w-full bg-black border border-borderGray text-white p-2.5 outline-none rounded-none" />
          
          <label class="font-bold text-textGray">RAZÓN / MOTIVO</label>
          <input id="adj-reason" type="text" placeholder="Ej: Reabastecimiento" class="w-full bg-black border border-borderGray text-white p-2.5 outline-none rounded-none" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonColor: '#E50914',
      cancelButtonColor: '#222222',
      confirmButtonText: 'Guardar Ajuste',
      preConfirm: () => {
        const type = document.getElementById('adj-type').value;
        const qty = parseInt(document.getElementById('adj-qty').value);
        const reason = document.getElementById('adj-reason').value;
        if (!qty || qty < 1) {
          Swal.showValidationMessage('La cantidad debe ser mayor a 0');
        }
        return { type, qty, reason };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { type, qty, reason } = result.value;
          await axiosInstance.post('/inventory/', {
            variant: variant.id,
            movement_type: type,
            quantity: qty,
            reason: reason || 'Ajuste manual'
          });
          Swal.fire('Éxito', 'El stock se actualizó correctamente.', 'success');
          fetchInventory();
          fetchProducts();
          fetchDashboardStats();
        } catch (error) {
          Swal.fire('Error', 'No se pudo realizar el ajuste de inventario.', 'error');
        }
      }
    });
  };

  const COLORS = ['#E50914', '#ffffff', '#a0a0a0', '#4f4f4f', '#222222'];

  return (
    <div className="bg-black text-white min-h-screen pt-20 flex">
      
      {/* Sidebar Admin */}
      <aside className="w-64 border-r border-borderGray bg-bgCard hidden lg:flex flex-col text-xs uppercase tracking-wider font-semibold">
        <div className="p-6 border-b border-borderGray">
          <span className="text-sm font-black text-white">Boutique Admin</span>
          <p className="text-[10px] text-textGray font-light mt-1 uppercase">Panel de Control</p>
        </div>

        <div className="flex-1 py-4 flex flex-col space-y-1 px-3">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
              activeTab === 'summary' ? 'bg-accentRed text-white' : 'text-textGray hover:text-white'
            }`}
          >
            <FiTrendingUp className="w-4 h-4" />
            <span>Resumen</span>
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
              activeTab === 'products' ? 'bg-accentRed text-white' : 'text-textGray hover:text-white'
            }`}
          >
            <FiPackage className="w-4 h-4" />
            <span>Productos</span>
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
              activeTab === 'categories' ? 'bg-accentRed text-white' : 'text-textGray hover:text-white'
            }`}
          >
            <FiList className="w-4 h-4" />
            <span>Categorías</span>
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
              activeTab === 'orders' ? 'bg-accentRed text-white' : 'text-textGray hover:text-white'
            }`}
          >
            <FiShoppingBag className="w-4 h-4" />
            <span>Pedidos</span>
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
              activeTab === 'inventory' ? 'bg-accentRed text-white' : 'text-textGray hover:text-white'
            }`}
          >
            <FiAlertTriangle className="w-4 h-4" />
            <span>Inventario</span>
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 transition-colors ${
              activeTab === 'clients' ? 'bg-accentRed text-white' : 'text-textGray hover:text-white'
            }`}
          >
            <FiUsers className="w-4 h-4" />
            <span>Clientes</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* TAB: RESUMEN / ESTADÍSTICAS */}
        {activeTab === 'summary' && (
          <div className="space-y-8">
            <div className="border-b border-borderGray pb-3 flex justify-between items-baseline">
              <h2 className="text-lg font-bold uppercase tracking-widest">Resumen del Sistema</h2>
              <p className="text-2xs text-textGray font-light">Rol: {user?.role || 'Admin'}</p>
            </div>

            {loadingStats ? (
              <div className="text-center py-20">
                <div className="w-12 h-12 border-4 border-accentRed border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                {/* Tarjetas KPI tradicionales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-bgCard border border-borderGray p-6 space-y-1">
                    <span className="text-2xs uppercase tracking-widest text-textGray font-bold">Ingresos Totales</span>
                    <p className="text-xl font-black text-white">${stats.summary.total_revenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-bgCard border border-borderGray p-6 space-y-1">
                    <span className="text-2xs uppercase tracking-widest text-textGray font-bold">Ventas del Mes</span>
                    <p className="text-xl font-black text-accentRed">${stats.summary.month_sales.toFixed(2)}</p>
                  </div>
                  <div className="bg-bgCard border border-borderGray p-6 space-y-1">
                    <span className="text-2xs uppercase tracking-widest text-textGray font-bold">Pedidos Pendientes</span>
                    <p className="text-xl font-black text-white">{stats.summary.pending_orders}</p>
                  </div>
                  <div className="bg-bgCard border border-borderGray p-6 space-y-1">
                    <span className="text-2xs uppercase tracking-widest text-textGray font-bold">Clientes Registrados</span>
                    <p className="text-xl font-black text-white">{stats.summary.total_clients}</p>
                  </div>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-bgCard border border-borderGray p-6 lg:col-span-2 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-white">Ventas por Mes</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.sales_by_month}>
                          <XAxis dataKey="month" stroke="#4f4f4f" fontSize={10} />
                          <YAxis stroke="#4f4f4f" fontSize={10} />
                          <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#222222' }} />
                          <Area type="monotone" dataKey="sales" stroke="#E50914" fill="#E50914" fillOpacity={0.15} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-bgCard border border-borderGray p-6 space-y-4">
                    <h3 className="text-xs uppercase tracking-widest font-bold text-white">Pedidos por Estado</h3>
                    <div className="h-80 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.orders_by_status}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="status"
                          >
                            {stats.orders_by_status.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#121212', borderColor: '#222222' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: PRODUCTOS CRUD */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-borderGray pb-3">
              <h2 className="text-lg font-bold uppercase tracking-widest">Gestión de Productos</h2>
              <button 
                onClick={() => {
                  setEditingProduct(null);
                  setHasVariants(true);
                  setSingleVariantId(null);
                  setDeletedVariantIds([]);
                  setProductVariants([{ color: '', size: '', stock: 0, image: null }]);
                  resetProd();
                  setShowProductModal(true);
                }}
                className="bg-accentRed hover:bg-accentRedHover text-white px-4 py-2 text-xs uppercase tracking-widest font-bold flex items-center space-x-2 rounded-none"
              >
                <FiPlus />
                <span>Agregar Producto</span>
              </button>
            </div>

            <div className="bg-bgCard border border-borderGray overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-borderGray bg-black text-textGray uppercase tracking-wider">
                    <th className="p-4 font-semibold">SKU</th>
                    <th className="p-4 font-semibold">Imagen</th>
                    <th className="p-4 font-semibold">Nombre</th>
                    <th className="p-4 font-semibold">Categoría</th>
                    <th className="p-4 font-semibold">Precio</th>
                    <th className="p-4 font-semibold">Oferta</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderGray">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-bgCardHover">
                      <td className="p-4 font-mono">{p.sku}</td>
                      <td className="p-4">
                        {p.image_principal ? (
                          <img
                            src={p.image_principal}
                            alt={p.name}
                            className="w-14 h-14 object-contain border border-borderGray bg-white p-0.5"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-neutral-900 border border-borderGray flex items-center justify-center text-textGray text-[9px] uppercase font-bold">
                            Sin Foto
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-semibold text-white">{p.name}</td>
                      <td className="p-4 text-textGray">{p.category_detail?.name}</td>
                      <td className="p-4 font-bold">${parseFloat(p.price).toFixed(2)}</td>
                      <td className="p-4 text-accentRed font-bold">{p.offer_price ? `$${parseFloat(p.offer_price).toFixed(2)}` : '-'}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleToggleProductActive(p)}
                          className={`px-2.5 py-1 uppercase text-3xs font-bold tracking-wider border ${
                            p.is_active 
                              ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                              : 'text-red-500 bg-red-500/10 border-red-500/20'
                          }`}
                        >
                          {p.is_active ? 'Activo' : 'Inactivo'}
                        </button>
                      </td>
                      <td className="p-4 flex items-center space-x-3">
                        <button 
                          onClick={() => {
                            setEditingProduct(p);
                            setShowProductModal(true);
                            setDeletedVariantIds([]);
                            setValue("name", p.name);
                            setValue("description", p.description);
                            setValue("category", p.category);
                            setValue("price", p.price);
                            setValue("offer_price", p.offer_price || "");
                            setValue("brand", p.brand);
                            setValue("gender", p.gender || "UNISEX");
                            setValue("is_active", String(p.is_active));
                            setValue("min_stock_alert", p.min_stock_alert);

                            if (p.variantes && p.variantes.length > 0) {
                              if (p.variantes.length === 1 && p.variantes[0].color === 'Único') {
                                setHasVariants(false);
                                setSingleVariantId(p.variantes[0].id);
                                setValue("stock_general", p.variantes[0].stock);
                              } else {
                                setHasVariants(true);
                                setSingleVariantId(null);
                                setProductVariants(p.variantes.map(v => ({
                                  id: v.id,
                                  color: v.color,
                                  size: v.size || '',
                                  stock: v.stock,
                                  image_preview: v.image,
                                  image: null
                                })));
                              }
                            } else {
                              setHasVariants(false);
                              setSingleVariantId(null);
                              setProductVariants([]);
                            }
                          }}
                          className="text-textGray hover:text-white p-1"
                          title="Editar"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(p)}
                          className="text-textGray hover:text-accentRed p-1"
                          title="Eliminar"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CATEGORÍAS CRUD */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-borderGray pb-3">
              <h2 className="text-lg font-bold uppercase tracking-widest">Gestión de Categorías</h2>
              <button 
                onClick={() => {
                  setEditingCategory(null);
                  resetCat();
                  setShowCategoryModal(true);
                }}
                className="bg-accentRed hover:bg-accentRedHover text-white px-4 py-2 text-xs uppercase tracking-widest font-bold flex items-center space-x-2 rounded-none"
              >
                <FiPlus />
                <span>Agregar Categoría</span>
              </button>
            </div>

            <div className="bg-bgCard border border-borderGray overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-borderGray bg-black text-textGray uppercase tracking-wider">
                    <th className="p-4 font-semibold">ID</th>
                    <th className="p-4 font-semibold">Nombre</th>
                    <th className="p-4 font-semibold">Slug</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderGray">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-bgCardHover">
                      <td className="p-4 text-white font-mono">{c.id}</td>
                      <td className="p-4 font-semibold text-white">{c.name}</td>
                      <td className="p-4 text-textGray font-mono">{c.slug}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 uppercase text-3xs font-bold border ${
                          c.is_active 
                            ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                            : 'text-red-500 bg-red-500/10 border-red-500/20'
                        }`}>
                          {c.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4 flex items-center space-x-3">
                        <button 
                          onClick={() => {
                            setEditingCategory(c);
                            setShowCategoryModal(true);
                            setValue("name", c.name);
                            setValue("is_active", String(c.is_active));
                          }}
                          className="text-textGray hover:text-white p-1"
                          title="Editar"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PEDIDOS */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold uppercase tracking-widest border-b border-borderGray pb-3">Gestión de Pedidos</h2>
            
            <div className="bg-bgCard border border-borderGray overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-borderGray bg-black text-textGray uppercase tracking-wider">
                    <th className="p-4 font-semibold">Pedido ID</th>
                    <th className="p-4 font-semibold">Cliente</th>
                    <th className="p-4 font-semibold">Fecha</th>
                    <th className="p-4 font-semibold">Total</th>
                    <th className="p-4 font-semibold">Comprobante</th>
                    <th className="p-4 font-semibold">Estado</th>
                    <th className="p-4 font-semibold">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderGray">
                  {orders.map((o) => {
                    const isExpanded = expandedOrderId === o.id;
                    return (
                      <React.Fragment key={o.id}>
                        <tr className="hover:bg-bgCardHover">
                          <td className="p-4 font-mono text-white">#{o.id.slice(0, 8)}</td>
                          <td className="p-4 text-textGray truncate max-w-[150px]">{o.user}</td>
                          <td className="p-4 text-textGray">{new Date(o.created_at).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-white">${parseFloat(o.total).toFixed(2)}</td>
                          <td className="p-4">
                            {o.pago?.receipt_image ? (
                              <button 
                                onClick={() => handleViewReceipt(o.pago.receipt_image)}
                                className="text-accentRed hover:text-white font-semibold flex items-center space-x-1.5"
                              >
                                <FiEye />
                                <span>Ver Recibo</span>
                              </button>
                            ) : (
                              <span className="text-textGray">Sin Comprobante</span>
                            )}
                          </td>
                          <td className="p-4">
                            <select 
                              value={o.status}
                              onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                              className="bg-black border border-borderGray text-white text-xs px-2.5 py-1 focus:outline-none focus:border-accentRed rounded-none"
                            >
                              <option value="PENDING">Pendiente</option>
                              <option value="PAYMENT_TO_VERIFY">Pago por verificar</option>
                              <option value="PAYMENT_APPROVED">Pago aprobado</option>
                              <option value="PREPARING">Preparando pedido</option>
                              <option value="SHIPPED">Enviado</option>
                              <option value="DELIVERED">Entregado</option>
                              <option value="CANCELLED">Cancelar</option>
                            </select>
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => setExpandedOrderId(isExpanded ? null : o.id)}
                              className="text-textGray hover:text-white flex items-center space-x-1"
                            >
                              <span>{isExpanded ? "Ocultar" : "Ver"}</span>
                              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-neutral-950">
                            <td colSpan="7" className="p-6">
                              <div className="space-y-4 max-w-4xl">
                                <div className="grid grid-cols-2 gap-6 text-[11px] text-textGray border-b border-borderGray pb-3">
                                  <div>
                                    <span className="font-bold text-white uppercase block mb-1">Dirección de Envío</span>
                                    <p>{o.shipping_address?.address_line1 || 'No especificada'}</p>
                                    {o.shipping_address?.address_line2 && <p>{o.shipping_address.address_line2}</p>}
                                    <p>{o.shipping_address?.city}, {o.shipping_address?.state} - {o.shipping_address?.postal_code}</p>
                                    <p>{o.shipping_address?.country}</p>
                                  </div>
                                  <div>
                                    <span className="font-bold text-white uppercase block mb-1">Contacto</span>
                                    <p>Usuario: {o.user}</p>
                                    <p>Teléfono: {o.shipping_address?.phone || 'No especificado'}</p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <span className="font-bold text-white uppercase text-2xs block">Prendas Pedidas:</span>
                                  <div className="space-y-1.5">
                                    {o.items?.map((item) => (
                                      <div key={item.id} className="flex justify-between items-center text-xs py-1 border-b border-borderGray/30">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-white font-semibold">{item.variant_detail?.product?.name || 'Prenda'}</span>
                                          <span className="text-[10px] text-textGray">({item.variant_detail?.color} / {item.variant_detail?.size || 'Única'})</span>
                                        </div>
                                        <div className="text-textGray">
                                          <span>${parseFloat(item.price).toFixed(2)} x {item.quantity}</span>
                                          <span className="text-white font-bold ml-4">${parseFloat(item.subtotal).toFixed(2)}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: INVENTARIO (Agrupado por producto con expansión para variantes - Sugerencia del usuario) */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold uppercase tracking-widest border-b border-borderGray pb-3">Control de Inventario</h2>
            
            {inventoryStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-bgCard border border-borderGray p-5">
                  <span className="text-2xs uppercase tracking-widest text-textGray font-bold font-sans">Stock Total Global</span>
                  <p className="text-xl font-black text-white mt-1">{inventoryStats.total_stock} uds</p>
                </div>
                <div className="bg-bgCard border border-borderGray p-5">
                  <span className="text-2xs uppercase tracking-widest text-textGray font-bold font-sans">Variantes Agotadas</span>
                  <p className="text-xl font-black text-red-500 mt-1">{inventoryStats.out_of_stock_count} uds</p>
                </div>
                <div className="bg-bgCard border border-borderGray p-5">
                  <span className="text-2xs uppercase tracking-widest text-textGray font-bold font-sans">Variantes con Bajo Stock</span>
                  <p className="text-xl font-black text-yellow-500 mt-1">{inventoryStats.low_stock_count} uds</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest font-bold text-white">Inventario General por Prenda</h3>
              <div className="bg-bgCard border border-borderGray overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-borderGray bg-black text-textGray uppercase tracking-wider">
                      <th className="p-4 font-semibold">Producto</th>
                      <th className="p-4 font-semibold">SKU Base</th>
                      <th className="p-4 font-semibold">Variantes Registradas</th>
                      <th className="p-4 font-semibold">Stock Total</th>
                      <th className="p-4 font-semibold">Estado</th>
                      <th className="p-4 font-semibold">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderGray">
                    {products.map((p) => {
                      const variantsCount = p.variantes?.length || 0;
                      const totalStock = p.variantes?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                      const isExpanded = expandedInvProductId === p.id;
                      
                      const isOutOfStock = totalStock === 0;
                      const isLowStock = totalStock > 0 && totalStock <= (p.min_stock_alert || 5);

                      return (
                        <React.Fragment key={p.id}>
                          <tr className="hover:bg-bgCardHover">
                            <td className="p-4 font-semibold text-white">
                              <div className="flex items-center space-x-3">
                                {p.image_principal ? (
                                  <img 
                                    src={p.image_principal} 
                                    alt={p.name} 
                                    className="w-14 h-14 object-contain border border-borderGray bg-white p-0.5" 
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-neutral-900 border border-borderGray flex items-center justify-center text-textGray text-[9px] uppercase font-bold">
                                    Sin Foto
                                  </div>
                                )}
                                <span>{p.name}</span>
                              </div>
                            </td>
                            <td className="p-4 font-mono text-textGray">{p.sku}</td>
                            <td className="p-4 font-mono text-white">{variantsCount} variantes</td>
                            <td className="p-4 font-mono font-bold text-white">{totalStock} uds</td>
                            <td className="p-4">
                              {isOutOfStock ? (
                                <span className="px-2 py-0.5 text-3xs font-extrabold uppercase bg-red-500/10 border border-red-500/25 text-red-500">Agotado</span>
                              ) : isLowStock ? (
                                <span className="px-2 py-0.5 text-3xs font-extrabold uppercase bg-yellow-500/10 border border-yellow-500/25 text-yellow-500">Bajo Stock</span>
                              ) : (
                                <span className="px-2 py-0.5 text-3xs font-extrabold uppercase bg-green-500/10 border border-green-500/25 text-green-500">En stock</span>
                              )}
                            </td>
                            <td className="p-4">
                              <button 
                                onClick={() => setExpandedInvProductId(isExpanded ? null : p.id)}
                                className="text-accentRed hover:text-white flex items-center space-x-1 uppercase text-3xs font-extrabold tracking-wider"
                              >
                                <span>{isExpanded ? "Ocultar" : "Ver Variantes"}</span>
                                {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                              </button>
                            </td>
                          </tr>

                          {/* Fila expandida con tabla de variantes específicas por color y talla */}
                          {isExpanded && (
                            <tr className="bg-neutral-950">
                              <td colSpan="6" className="p-5">
                                <div className="space-y-3">
                                  <h4 className="text-[10px] uppercase font-bold text-textGray tracking-wider">Desglose de Stock (Variantes):</h4>
                                  <table className="w-full text-left border-collapse text-[11px] bg-black border border-borderGray">
                                    <thead>
                                      <tr className="border-b border-borderGray bg-neutral-900 text-textGray uppercase font-semibold">
                                        <th className="p-3">Color</th>
                                        <th className="p-3">Talla</th>
                                        <th className="p-3 font-mono">SKU Variante</th>
                                        <th className="p-3">Stock Actual</th>
                                        <th className="p-3 text-right">Ajustar</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-borderGray/30">
                                      {p.variantes?.map(v => {
                                        const isVOutOfStock = v.stock === 0;
                                        const isVLowStock = v.stock > 0 && v.stock <= (p.min_stock_alert || 5);
                                        return (
                                          <tr key={v.id} className="hover:bg-bgCardHover">
                                            <td className="p-3 text-white font-semibold">{v.color}</td>
                                            <td className="p-3 text-textGray">{v.size || 'Única'}</td>
                                            <td className="p-3 font-mono text-textGray">{v.sku_variant}</td>
                                            <td className="p-3">
                                              <span className="font-bold text-white font-mono">{v.stock} uds</span>
                                              {isVOutOfStock ? (
                                                <span className="ml-2 px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-red-500/10 border border-red-500/25 text-red-500">Agotado</span>
                                              ) : isVLowStock ? (
                                                <span className="ml-2 px-1.5 py-0.5 text-[9px] font-extrabold uppercase bg-yellow-500/10 border border-yellow-500/25 text-yellow-500">Bajo Stock</span>
                                              ) : null}
                                            </td>
                                            <td className="p-3 text-right">
                                              <button 
                                                onClick={() => handleAdjustStock({ ...v, skuProduct: p.sku })}
                                                className="text-accentRed hover:text-white inline-flex items-center space-x-1 border border-accentRed/30 px-2 py-1 bg-accentRed/5 uppercase font-bold text-[9px] tracking-wider"
                                              >
                                                <FiPlusCircle />
                                                <span>Ajustar</span>
                                              </button>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Listado de movimientos */}
            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-widest font-bold text-white">Historial Reciente de Movimientos</h3>
              <div className="bg-bgCard border border-borderGray overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-borderGray bg-black text-textGray uppercase tracking-wider">
                      <th className="p-4 font-semibold">Fecha</th>
                      <th className="p-4 font-semibold">SKU Variante</th>
                      <th className="p-4 font-semibold">Tipo</th>
                      <th className="p-4 font-semibold">Cantidad</th>
                      <th className="p-4 font-semibold">Razón</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderGray">
                    {movements.map((m) => (
                      <tr key={m.id} className="hover:bg-bgCardHover">
                        <td className="p-4 text-textGray">{new Date(m.created_at).toLocaleString()}</td>
                        <td className="p-4 text-white font-mono">{m.variant_detail?.sku_variant}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 uppercase text-3xs font-bold border ${
                            m.movement_type === 'IN' 
                              ? 'text-green-500 bg-green-500/10 border-green-500/20' 
                              : 'text-red-500 bg-red-500/10 border-red-500/20'
                          }`}>
                            {m.movement_type === 'IN' ? 'Entrada' : 'Salida'}
                          </span>
                        </td>
                        <td className="p-4 font-bold text-white">{m.quantity} uds</td>
                        <td className="p-4 text-textGray">{m.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CLIENTES */}
        {activeTab === 'clients' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold uppercase tracking-widest border-b border-borderGray pb-3">Gestión de Clientes</h2>
            
            <div className="bg-bgCard border border-borderGray overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-borderGray bg-black text-textGray uppercase tracking-wider">
                    <th className="p-4 font-semibold">Cliente (Email)</th>
                    <th className="p-4 font-semibold">Nombre</th>
                    <th className="p-4 font-semibold">Pedidos Realizados</th>
                    <th className="p-4 font-semibold">Total Gastado</th>
                    <th className="p-4 font-semibold">Último Pedido</th>
                    <th className="p-4 font-semibold">Estado Cuenta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderGray">
                  {clients.map((c, i) => (
                    <tr key={i} className="hover:bg-bgCardHover">
                      <td className="p-4 font-semibold text-white">{c.email}</td>
                      <td className="p-4 text-textGray">{c.first_name || '-'} {c.last_name || ''}</td>
                      <td className="p-4 text-white font-mono">{c.ordersCount}</td>
                      <td className="p-4 font-bold text-accentRed">
                        {c.totalSpent > 0 ? `$${c.totalSpent.toFixed(2)}` : '$0.00'}
                      </td>
                      <td className="p-4 text-textGray">
                        {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString() : 'Sin compras'}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 text-3xs font-bold uppercase tracking-wider text-green-500 bg-green-500/10 border border-green-500/20">
                          Activo
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: REGISTRO / EDICIÓN PRODUCTO */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-bgCard border border-borderGray p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex justify-between items-center border-b border-borderGray pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <button 
                onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                  setSingleVariantId(null);
                  setDeletedVariantIds([]);
                  resetProd();
                }} 
                className="text-white hover:text-accentRed"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProdSubmit(onProductSubmit)} className="space-y-4 text-xs">
              
              <div className="space-y-2">
                <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Nombre del Producto</label>
                <input 
                  type="text"
                  {...regProd("name", { required: true })}
                  className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Descripción</label>
                <textarea 
                  rows="2"
                  {...regProd("description", { required: true })}
                  className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Categoría</label>
                  <select 
                    {...regProd("category", { required: true })}
                    className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                  >
                    <option value="">Selecciona Categoría</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Marca</label>
                  <input 
                    type="text"
                    {...regProd("brand")}
                    className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Género</label>
                  <select 
                    {...regProd("gender", { required: true })}
                    className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                  >
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Precio</label>
                  <input 
                    type="text"
                    {...regProd("price", { required: true })}
                    className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Precio de Oferta (Opcional)</label>
                  <input 
                    type="text"
                    {...regProd("offer_price")}
                    className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Alerta Stock Mínimo</label>
                  <input 
                    type="number"
                    {...regProd("min_stock_alert")}
                    className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Estado</label>
                  <select 
                    {...regProd("is_active")}
                    className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                  >
                    <option value="true">Activo</option>
                    <option value="false">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-2xs uppercase tracking-widest text-textGray font-semibold flex justify-between items-center">
                  <span>Imagen Principal del Producto</span>
                  {editingProduct?.image_principal && (
                    <span className="text-green-500 font-bold uppercase tracking-wider text-[9px]">✓ Imagen guardada en servidor</span>
                  )}
                </label>
                {editingProduct?.image_principal && (
                  <div className="flex items-center space-x-3 bg-black border border-borderGray/30 p-2.5 mb-2">
                    <img 
                      src={editingProduct.image_principal} 
                      alt="Miniatura Principal" 
                      className="w-12 h-12 object-contain bg-white border border-borderGray p-0.5" 
                    />
                    <div>
                      <p className="text-[10px] text-white font-semibold">Imagen actual</p>
                      <p className="text-[9px] text-textGray">Para cambiarla, selecciona un nuevo archivo debajo.</p>
                    </div>
                  </div>
                )}
                <input 
                  type="file"
                  {...regProd("image_principal")}
                  className="w-full bg-black border border-borderGray text-white px-3 py-2 focus:outline-none focus:border-accentRed rounded-none"
                />
              </div>
 
              <div className="border-t border-borderGray pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 text-2xs uppercase tracking-widest font-bold text-white">
                    <input 
                      type="checkbox" 
                      checked={hasVariants}
                      onChange={(e) => setHasVariants(e.target.checked)}
                      className="accent-red-600"
                    />
                    <span>Este producto tiene múltiples variantes (Colores/Tallas)</span>
                  </label>
                </div>
 
                {!hasVariants ? (
                  <div className="space-y-2 bg-black border border-borderGray p-4">
                    <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Stock General Inicial</label>
                    <input 
                      type="number"
                      placeholder="0"
                      {...regProd("stock_general")}
                      className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-4 bg-black border border-borderGray p-4">
                    <div className="flex justify-between items-center mb-1">
                      <div>
                        <h4 className="text-2xs uppercase tracking-widest font-bold text-textGray">Variantes por color</h4>
                        <p className="text-[10px] text-textGray mt-1">Agrega tallas dentro de cada color sin repetir todo el bloque.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addVariantForColor('')}
                        className="text-accentRed hover:text-white uppercase font-bold text-3xs tracking-wider"
                      >
                        + Agregar Color
                      </button>
                    </div>

                    <div className="space-y-4">
                      {Object.entries(groupedVariants).map(([colorKey, variantsInGroup]) => {
                        const representative = variantsInGroup[0];
                        const currentColor = representative.color || '';
                        const imageVariant =
                          variantsInGroup.find((variant) => variant.image_preview || variant.image) || representative;

                        return (
                          <div key={colorKey} className="border border-borderGray bg-bgCard p-4 space-y-3">
                            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr_auto] gap-3 items-end">
                              <div className="space-y-1">
                                <label className="text-[10px] text-textGray uppercase tracking-wider block">Color</label>
                                <input
                                  type="text"
                                  value={currentColor}
                                  onChange={(e) => {
                                    const newColor = e.target.value;
                                    setProductVariants((current) =>
                                      current.map((variant, variantIndex) =>
                                        variantsInGroup.some((groupVariant) => groupVariant.index === variantIndex)
                                          ? { ...variant, color: newColor }
                                          : variant
                                      )
                                    );
                                  }}
                                  placeholder="Negro"
                                  className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none text-xs"
                                  required
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-textGray uppercase tracking-wider block">Imagen del color</label>
                                <div className="flex items-center gap-3">
                                  {imageVariant?.image_preview && !imageVariant?.image && (
                                    <img
                                      src={imageVariant.image_preview}
                                      alt="Miniatura Color"
                                      className="w-12 h-12 object-contain bg-white border border-borderGray p-0.5 shrink-0"
                                    />
                                  )}
                                  {imageVariant?.image && (
                                    <div className="w-12 h-12 border border-green-500 bg-black flex items-center justify-center text-[8px] font-bold text-green-500 shrink-0 uppercase">
                                      Nuevo
                                    </div>
                                  )}
                                  <div className="flex-1 relative overflow-hidden border border-borderGray bg-black text-center py-3 text-3xs font-semibold uppercase hover:border-white transition-colors cursor-pointer">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => handleVariantFieldChange(imageVariant.index, 'image', e.target.files[0])}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <span>{imageVariant?.image ? 'Reemplazar' : imageVariant?.image_preview ? 'Cambiar' : 'Subir imagen'}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => addVariantForColor(currentColor)}
                                className="shrink-0 text-accentRed hover:text-white uppercase font-bold text-3xs tracking-wider lg:justify-self-end"
                              >
                                + Agregar talla
                              </button>
                            </div>

                            <div className="space-y-3 border-t border-borderGray/30 pt-3">
                              {variantsInGroup.map((v) => (
                                <div key={v.id || `${v.color}-${v.size}-${v.index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                                  <div>
                                    <label className="text-[10px] text-textGray uppercase tracking-wider mb-1 block">Talla</label>
                                    <select
                                      value={v.size}
                                      onChange={(e) => handleVariantFieldChange(v.index, 'size', e.target.value)}
                                      className="w-full bg-black border border-borderGray text-white px-2.5 py-2 focus:outline-none focus:border-accentRed rounded-none text-xs"
                                    >
                                      {SIZE_OPTIONS.map((option) => (
                                        <option key={option.value || 'unique'} value={option.value}>
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[10px] text-textGray uppercase tracking-wider mb-1 block">Stock</label>
                                    <input
                                      type="number"
                                      value={v.stock}
                                      onChange={(e) => handleVariantFieldChange(v.index, 'stock', parseInt(e.target.value) || 0)}
                                      className="w-full bg-black border border-borderGray text-white px-2.5 py-2 focus:outline-none focus:border-accentRed rounded-none text-xs"
                                      required
                                    />
                                  </div>
                                  <div className="flex items-center justify-end">
                                    {productVariants.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => removeVariantRow(v.index)}
                                        className="text-red-500 hover:text-white p-2"
                                      >
                                        <FiTrash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                className="w-full bg-accentRed hover:bg-accentRedHover text-white py-3.5 uppercase tracking-widest font-bold transition-all duration-300 rounded-none mt-4"
              >
                Guardar Producto
              </button>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRO / EDICIÓN CATEGORÍA */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-bgCard border border-borderGray p-8 max-w-md w-full space-y-6">
            
            <div className="flex justify-between items-center border-b border-borderGray pb-3">
              <h3 className="text-sm font-bold uppercase tracking-widest">
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </h3>
              <button 
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  resetCat();
                }} 
                className="text-white hover:text-accentRed"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCatSubmit(onCategorySubmit)} className="space-y-4 text-xs">
              
              <div className="space-y-2">
                <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Nombre de la Categoría</label>
                <input 
                  type="text"
                  placeholder="Ej: Abrigos"
                  {...regCat("name", { required: true })}
                  className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Estado</label>
                <select 
                  {...regCat("is_active")}
                  className="w-full bg-black border border-borderGray text-white px-3 py-2.5 focus:outline-none focus:border-accentRed rounded-none"
                >
                  <option value="true">Activa</option>
                  <option value="false">Inactiva</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-2xs uppercase tracking-widest text-textGray font-semibold">Imagen</label>
                <input 
                  type="file"
                  {...regCat("image")}
                  className="w-full bg-black border border-borderGray text-white px-3 py-2 focus:outline-none focus:border-accentRed rounded-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-accentRed hover:bg-accentRedHover text-white py-3.5 uppercase tracking-widest font-bold transition-all duration-300 rounded-none"
              >
                Guardar Categoría
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;





