import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
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
      // TODO
      const currentCart = cart.find( c => c.id === productId);

      if(!currentCart) {

        const response = await api.get(`products/${productId}`);
    
        const newCart = { ...response.data, amount: 1}
        
        setCart([...cart, newCart]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        
        
      } else {

        const response = await api.get(`stock/${productId}`)

        const { data } = response;
        
        if(currentCart.amount < data.amount) {

          currentCart.amount += 1;

          setCart([...cart.filter(c => c.id !== currentCart.id), currentCart]);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));

        } else {

          toast.error('Quantidade solicitada fora de estoque');
        }
  
      }

    } catch {

      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      
      setCart([...cart.filter(c => c.id !== productId)] )

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
        
        return;
      
      } else {

        api.get(`stock/${productId}`).then(response => {

          const { data } = response;
          
          
          if(amount <= data.amount) {
            
            const cartProduct = cart.find(c => c.id == productId);

            // cartProduct.amount = amount;

            // setCart([...cart.filter(c => c.id !== cartProduct.id), cartProduct]);
          }
          
        })
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
