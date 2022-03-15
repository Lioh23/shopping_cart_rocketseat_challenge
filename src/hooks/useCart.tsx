import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { isConstructorDeclaration } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {

  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {

      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);
      const productAmount = productExists ? productExists.amount : 0;

      const { data: stock } =  await api.get(`stock/${productId}`);

      if(productExists) {
        
        if(productAmount < stock.amount) {

          productExists.amount = productAmount + 1;
        } else {

          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      } else {

        const { data: product } = await api.get(`products/${productId}`);

        updatedCart.push({ ...product, amount: 1 });
      }

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {

      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      
      if(cart.find((c: Product) => c.id === productId)) {

        const cartsUpdated = cart.filter(c => c.id !== productId);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartsUpdated));
  
        setCart([...cartsUpdated] );

      } else {

        toast.error('Erro na remoção do produto');
      }

    } catch {
      
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      
      if(amount <= 0) {
        
        toast.error('Erro na alteração de quantidade do produto');
        return;
      
      }

      const { data: stock} = await api.get(`stock/${productId}`);

      console.log(amount, stock.amount);

      if(amount <= stock.amount) {
        

        const updatedCart = [...cart];

        const currentCart = updatedCart.find(product => product.id === productId);

        if(!currentCart) {

          toast.error('Erro na alteração de quantidade do produto');
          return;
        }

        currentCart.amount = amount;

        setCart(updatedCart);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

      } else {

        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      
    } catch {
      
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
