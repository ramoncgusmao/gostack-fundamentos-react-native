import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);
const keyProducts = '@GoMarketPlace:products';
const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const jsonProducts = await AsyncStorage.getItem(keyProducts);
      console.log(jsonProducts);
      if (jsonProducts) {
        const productsAsyns: Product[] = await JSON.parse(jsonProducts);
        console.log('produtos legais', productsAsyns);
        await setProducts([...productsAsyns]);
      }

      console.log('produtos', products);
    }

    loadProducts();
  }, []);

  const atualizarAsyncStorage = useCallback(
    (newProducts: Product[]) => {
      async function writeProductsAsync(): Promise<void> {
        await AsyncStorage.setItem(keyProducts, JSON.stringify(newProducts));
        console.log('chamando async');
      }

      writeProductsAsync();
    },
    [products],
  );

  const findIndex = useCallback(
    (id: string) => {
      return products.findIndex(product => product.id === id);
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const arrayId = findIndex(String(id));
      console.log('id', arrayId);
      if (arrayId > -1) {
        const newProducts = products.map(p =>
          p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
        );
        setProducts(newProducts);
        atualizarAsyncStorage(newProducts);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const arrayId = findIndex(id);
      if (arrayId > -1) {
        const newProducts = products
          .map(p => (p.id === id ? { ...p, quantity: p.quantity - 1 } : p))
          .filter(p => p.quantity > 0);
        setProducts(newProducts);
        atualizarAsyncStorage(newProducts);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const arrayId = findIndex(product.id);

      if (arrayId > -1) {
        increment(product.id);
      } else {
        const newProducts = [...products, { ...product, quantity: 1 }];
        setProducts(newProducts);
        atualizarAsyncStorage(newProducts);
      }
      console.log('addCart', products.length);
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
