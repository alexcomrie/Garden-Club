import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Business, Product, CartItem } from '@shared/schema';

interface CartContextType {
  orders: CartItem[];
  customerName: string;
  deliveryOption: 'pickup' | 'delivery' | 'island_wide';
  deliveryAddress: string;
  pickupTime: string;
  selectedBusiness: Business | null;
  itemCount: number;
  addToCart: (product: Product, business: Business, quantity: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  updateCustomerInfo: (info: {
    customerName?: string;
    deliveryOption?: 'pickup' | 'delivery' | 'island_wide';
    deliveryAddress?: string;
    pickupTime?: string;
  }) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [orders, setOrders] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'pickup' | 'delivery' | 'island_wide'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const itemCount = orders.reduce((count, order) => count + order.quantity, 0);

  // Load saved state from localStorage on mount
  useEffect(() => {
    loadSavedState();
  }, []);

  const loadSavedState = () => {
    try {
      const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]') as any[];
      const loadedOrders: CartItem[] = savedOrders.map(order => ({
        product: order.product as Product,
        quantity: order.quantity as number,
        business: order.business as Business,
      }));
      
      if (loadedOrders.length > 0) {
        setOrders(loadedOrders);
        setSelectedBusiness(loadedOrders[0].business);
      }
      
      setCustomerName(localStorage.getItem('customerName') || '');
      setDeliveryOption((localStorage.getItem('deliveryOption') as any) || 'pickup');
      setDeliveryAddress(localStorage.getItem('deliveryAddress') || '');
      setPickupTime(localStorage.getItem('pickupTime') || '');
    } catch (e) {
      console.warn('Failed to load cart state from localStorage:', e);
    }
  };

  const saveState = () => {
    try {
      const ordersList = orders.map(order => ({
        product: order.product,
        quantity: order.quantity,
        business: order.business,
      }));
      localStorage.setItem('orders', JSON.stringify(ordersList));
      localStorage.setItem('customerName', customerName);
      localStorage.setItem('deliveryOption', deliveryOption);
      localStorage.setItem('deliveryAddress', deliveryAddress);
      localStorage.setItem('pickupTime', pickupTime);
    } catch (e) {
      console.warn('Failed to save cart state to localStorage:', e);
    }
  };

  // Save state whenever it changes
  useEffect(() => {
    saveState();
  }, [orders, customerName, deliveryOption, deliveryAddress, pickupTime]);

  const addToCart = (product: Product, business: Business, quantity: number) => {
    // If adding from a different business, clear the cart first
    if (selectedBusiness && selectedBusiness.id !== business.id) {
      setOrders([]);
      setSelectedBusiness(business);
      setOrders([{ product, quantity, business }]);
      return;
    }
    
    setSelectedBusiness(business);
    setOrders(prev => [...prev, { product, quantity, business }]);
  };

  const removeFromCart = (index: number) => {
    setOrders(prev => {
      const newOrders = prev.filter((_, i) => i !== index);
      if (newOrders.length === 0) {
        setSelectedBusiness(null);
      }
      return newOrders;
    });
  };

  const clearCart = () => {
    setOrders([]);
    setSelectedBusiness(null);
  };

  const updateCustomerInfo = (info: {
    customerName?: string;
    deliveryOption?: 'pickup' | 'delivery' | 'island_wide';
    deliveryAddress?: string;
    pickupTime?: string;
  }) => {
    if (info.customerName !== undefined) setCustomerName(info.customerName);
    if (info.deliveryOption !== undefined) setDeliveryOption(info.deliveryOption);
    if (info.deliveryAddress !== undefined) setDeliveryAddress(info.deliveryAddress);
    if (info.pickupTime !== undefined) setPickupTime(info.pickupTime);
  };

  const value: CartContextType = {
    orders,
    customerName,
    deliveryOption,
    deliveryAddress,
    pickupTime,
    selectedBusiness,
    itemCount,
    addToCart,
    removeFromCart,
    clearCart,
    updateCustomerInfo,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}