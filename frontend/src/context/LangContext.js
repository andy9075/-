import { createContext, useContext, useState } from 'react';

const translations = {
  zh: {
    // Common
    save: "保存", cancel: "取消", delete: "删除", edit: "编辑", add: "添加",
    search: "搜索", loading: "加载中...", confirm: "确认", close: "关闭",
    clear: "清空", print: "打印", export: "导出", all: "全部",
    // Auth
    username: "用户名", password: "密码", login: "登录", logout: "退出登录",
    // Admin sidebar
    dashboard: "仪表盘", storeManagement: "门店管理", warehouseManagement: "仓库管理",
    productManagement: "商品管理", transferManagement: "调货管理",
    customerManagement: "客户管理", supplierManagement: "供应商",
    purchaseManagement: "采购管理", salesManagement: "销售管理",
    onlineOrders: "网店订单", reports: "报表统计", exchangeRates: "汇率设置",
    paymentSettings: "支付设置", salesReport: "销售报告",
    // Dashboard
    todaySales: "今日销售", onlineOrderTotal: "网店订单", totalProducts: "商品总数",
    pendingOrders: "待处理订单", recentSales: "最近销售", quickActions: "快捷操作",
    // Products
    productCode: "编码", productName: "商品名称", category: "分类",
    unit: "单位", costPrice: "成本价", margin: "利率",
    price1: "价格1", price2: "价格2", price3Box: "价格3(整箱)",
    boxQuantity: "每箱数量", status: "状态", active: "在售", inactive: "下架",
    addProduct: "添加商品", editProduct: "编辑商品", priceSettings: "价格设置",
    marginFormula: "成本 × (1 + 利率%)",
    // POS
    posTitle: "POS", currency: "币种", shift: "班次",
    startShift: "当班", endShift: "交班", noShift: "未当班",
    shiftSince: "当班开始", salesOrder: "销售单", items: "件",
    products: "商品", quantity: "数量", priceType: "价格类型",
    unitPrice: "单价", amount: "金额", total: "合计",
    checkout: "收款", scanOrSearch: "扫描条码 / 搜索商品名称...",
    box: "整箱", boxes: "箱", pieces: "件",
    paymentMethod: "支付方式", cash: "现金", card: "刷卡",
    received: "收到金额", change: "找零", confirmPayment: "确认收款",
    // Transfer
    newTransfer: "新建调货单", sourceWarehouse: "来源仓库",
    targetWarehouse: "目标仓库", product: "商品", transferConfirm: "确认调货",
    inventoryOverview: "各仓库库存概览", transferHistory: "调货记录",
    stock: "库存", time: "时间", source: "来源", target: "目标",
    searchProduct: "搜索商品名称/编码...",
    // Sales Report
    salesReportTitle: "销售报告", storeFilter: "门店筛选",
    dateFrom: "开始日期", dateTo: "结束日期", generateReport: "生成报告",
    printReport: "打印报告", totalSales: "总销售额", totalOrders: "总订单数",
    totalItems: "总商品数", storeSalesDetail: "分店销售明细",
    productSalesDetail: "商品销售明细", soldQuantity: "售出数量",
    salesAmount: "销售额", noData: "暂无数据",
    // Shop
    shopTitle: "网上商店", myOrders: "我的订单", addToCart: "加入购物车",
    cart: "购物车", checkoutTitle: "结账", orderSuccess: "下单成功",
    orderLookup: "查询订单", orderNumber: "订单号", phone: "电话",
    shippingInfo: "收货信息", paymentInfo: "支付信息",
    // Online/Offline
    online: "联网", offline: "断网", offlineMode: "断网模式",
    pendingSync: "待同步", syncNow: "立即同步", syncSuccess: "同步成功",
    offlineWarning: "当前处于断网模式，数据将在恢复联网后自动同步",
    // Stores/Warehouses
    storeName: "门店名称", location: "地址", type: "类型",
    retail: "零售店", warehouse: "仓库", mainWarehouse: "总仓库",
    // Customers/Suppliers
    name: "名称", contactPhone: "联系电话", email: "邮箱", address: "地址",
    // Purchase
    purchaseOrder: "采购单", supplier: "供应商", totalAmount: "总金额",
    received_status: "已入库", pending: "待处理",
    // Language
    language: "语言", chinese: "中文", english: "English", spanish: "Español",
  },
  en: {
    save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", add: "Add",
    search: "Search", loading: "Loading...", confirm: "Confirm", close: "Close",
    clear: "Clear", print: "Print", export: "Export", all: "All",
    username: "Username", password: "Password", login: "Login", logout: "Logout",
    dashboard: "Dashboard", storeManagement: "Stores", warehouseManagement: "Warehouses",
    productManagement: "Products", transferManagement: "Transfers",
    customerManagement: "Customers", supplierManagement: "Suppliers",
    purchaseManagement: "Purchases", salesManagement: "Sales",
    onlineOrders: "Online Orders", reports: "Reports", exchangeRates: "Exchange Rates",
    paymentSettings: "Payment Settings", salesReport: "Sales Report",
    todaySales: "Today Sales", onlineOrderTotal: "Online Orders", totalProducts: "Products",
    pendingOrders: "Pending Orders", recentSales: "Recent Sales", quickActions: "Quick Actions",
    productCode: "Code", productName: "Product Name", category: "Category",
    unit: "Unit", costPrice: "Cost", margin: "Margin",
    price1: "Price 1", price2: "Price 2", price3Box: "Price 3 (Box)",
    boxQuantity: "Box Qty", status: "Status", active: "Active", inactive: "Inactive",
    addProduct: "Add Product", editProduct: "Edit Product", priceSettings: "Price Settings",
    marginFormula: "Cost × (1 + Margin%)",
    posTitle: "POS", currency: "Currency", shift: "Shift",
    startShift: "Start Shift", endShift: "End Shift", noShift: "No Shift",
    shiftSince: "Shift since", salesOrder: "Sales Order", items: "items",
    products: "Products", quantity: "Qty", priceType: "Price Type",
    unitPrice: "Unit Price", amount: "Amount", total: "Total",
    checkout: "Checkout", scanOrSearch: "Scan barcode / Search product...",
    box: "Box", boxes: "boxes", pieces: "pcs",
    paymentMethod: "Payment Method", cash: "Cash", card: "Card",
    received: "Received", change: "Change", confirmPayment: "Confirm Payment",
    newTransfer: "New Transfer", sourceWarehouse: "Source",
    targetWarehouse: "Destination", product: "Product", transferConfirm: "Confirm Transfer",
    inventoryOverview: "Inventory Overview", transferHistory: "Transfer History",
    stock: "Stock", time: "Time", source: "Source", target: "Target",
    searchProduct: "Search product name/code...",
    salesReportTitle: "Sales Report", storeFilter: "Store Filter",
    dateFrom: "From", dateTo: "To", generateReport: "Generate",
    printReport: "Print Report", totalSales: "Total Sales", totalOrders: "Total Orders",
    totalItems: "Total Items", storeSalesDetail: "Store Sales Detail",
    productSalesDetail: "Product Sales Detail", soldQuantity: "Sold Qty",
    salesAmount: "Sales Amount", noData: "No data",
    shopTitle: "Online Store", myOrders: "My Orders", addToCart: "Add to Cart",
    cart: "Cart", checkoutTitle: "Checkout", orderSuccess: "Order Success",
    orderLookup: "Track Order", orderNumber: "Order No.", phone: "Phone",
    shippingInfo: "Shipping Info", paymentInfo: "Payment Info",
    online: "Online", offline: "Offline", offlineMode: "Offline Mode",
    pendingSync: "Pending Sync", syncNow: "Sync Now", syncSuccess: "Sync Success",
    offlineWarning: "Offline mode - data will sync when connection is restored",
    storeName: "Store Name", location: "Location", type: "Type",
    retail: "Retail", warehouse: "Warehouse", mainWarehouse: "Main Warehouse",
    name: "Name", contactPhone: "Phone", email: "Email", address: "Address",
    purchaseOrder: "Purchase Order", supplier: "Supplier", totalAmount: "Total",
    received_status: "Received", pending: "Pending",
    language: "Language", chinese: "中文", english: "English", spanish: "Español",
  },
  es: {
    save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar", add: "Agregar",
    search: "Buscar", loading: "Cargando...", confirm: "Confirmar", close: "Cerrar",
    clear: "Limpiar", print: "Imprimir", export: "Exportar", all: "Todos",
    username: "Usuario", password: "Contraseña", login: "Iniciar Sesión", logout: "Cerrar Sesión",
    dashboard: "Panel", storeManagement: "Tiendas", warehouseManagement: "Almacenes",
    productManagement: "Productos", transferManagement: "Transferencias",
    customerManagement: "Clientes", supplierManagement: "Proveedores",
    purchaseManagement: "Compras", salesManagement: "Ventas",
    onlineOrders: "Pedidos Online", reports: "Reportes", exchangeRates: "Tipo de Cambio",
    paymentSettings: "Config. Pagos", salesReport: "Reporte de Ventas",
    todaySales: "Ventas Hoy", onlineOrderTotal: "Pedidos Online", totalProducts: "Productos",
    pendingOrders: "Pendientes", recentSales: "Ventas Recientes", quickActions: "Acciones Rápidas",
    productCode: "Código", productName: "Nombre", category: "Categoría",
    unit: "Unidad", costPrice: "Costo", margin: "Margen",
    price1: "Precio 1", price2: "Precio 2", price3Box: "Precio 3 (Caja)",
    boxQuantity: "Cant/Caja", status: "Estado", active: "Activo", inactive: "Inactivo",
    addProduct: "Agregar Producto", editProduct: "Editar Producto", priceSettings: "Precios",
    marginFormula: "Costo × (1 + Margen%)",
    posTitle: "POS", currency: "Moneda", shift: "Turno",
    startShift: "Iniciar Turno", endShift: "Cerrar Turno", noShift: "Sin Turno",
    shiftSince: "Turno desde", salesOrder: "Orden de Venta", items: "artículos",
    products: "Productos", quantity: "Cant.", priceType: "Tipo Precio",
    unitPrice: "P. Unit.", amount: "Monto", total: "Total",
    checkout: "Cobrar", scanOrSearch: "Escanear código / Buscar producto...",
    box: "Caja", boxes: "cajas", pieces: "pzas",
    paymentMethod: "Método de Pago", cash: "Efectivo", card: "Tarjeta",
    received: "Recibido", change: "Cambio", confirmPayment: "Confirmar Pago",
    newTransfer: "Nueva Transferencia", sourceWarehouse: "Origen",
    targetWarehouse: "Destino", product: "Producto", transferConfirm: "Confirmar",
    inventoryOverview: "Inventario por Almacén", transferHistory: "Historial",
    stock: "Stock", time: "Fecha", source: "Origen", target: "Destino",
    searchProduct: "Buscar producto...",
    salesReportTitle: "Reporte de Ventas", storeFilter: "Filtrar Tienda",
    dateFrom: "Desde", dateTo: "Hasta", generateReport: "Generar",
    printReport: "Imprimir Reporte", totalSales: "Ventas Totales", totalOrders: "Total Órdenes",
    totalItems: "Total Artículos", storeSalesDetail: "Detalle por Tienda",
    productSalesDetail: "Detalle por Producto", soldQuantity: "Vendidos",
    salesAmount: "Monto", noData: "Sin datos",
    shopTitle: "Tienda Online", myOrders: "Mis Pedidos", addToCart: "Agregar al Carrito",
    cart: "Carrito", checkoutTitle: "Pagar", orderSuccess: "Pedido Exitoso",
    orderLookup: "Buscar Pedido", orderNumber: "Nº Pedido", phone: "Teléfono",
    shippingInfo: "Envío", paymentInfo: "Pago",
    online: "En Línea", offline: "Sin Conexión", offlineMode: "Modo Sin Conexión",
    pendingSync: "Pendiente", syncNow: "Sincronizar", syncSuccess: "Sincronizado",
    offlineWarning: "Modo sin conexión - los datos se sincronizarán al reconectar",
    storeName: "Nombre", location: "Ubicación", type: "Tipo",
    retail: "Tienda", warehouse: "Almacén", mainWarehouse: "Almacén Principal",
    name: "Nombre", contactPhone: "Teléfono", email: "Correo", address: "Dirección",
    purchaseOrder: "Orden de Compra", supplier: "Proveedor", totalAmount: "Total",
    received_status: "Recibido", pending: "Pendiente",
    language: "Idioma", chinese: "中文", english: "English", spanish: "Español",
  }
};

const LangContext = createContext();

export const LangProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'zh');
  
  const t = (key) => translations[lang]?.[key] || translations['zh'][key] || key;
  
  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  return (
    <LangContext.Provider value={{ lang, t, changeLang }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
export default LangContext;
