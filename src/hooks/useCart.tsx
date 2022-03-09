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

      const storageCart = cart.find((c: Product) => c.id === productId);


      if(storageCart) {

        const response = await api.get(`stock/${productId}`);

        if(response.data.amount === storageCart.amount) {

          toast.error('Quantidade solicitada fora de estoque');

        } else {

          storageCart.amount += 1;

          setCart([...cart]);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));

        }

      } else {

        const response = await api.get(`products/${productId}`);

        const newStorageCart = {...response.data, amount: 1};

        setCart([...cart, newStorageCart]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newStorageCart]));
      }


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
      
      } else {

        const response = await api.get(`stock/${productId}`)

          const { data } = response;

          if(amount <= data.amount) {
            
            cart.forEach(c => {
            
              if(c.id == productId) {
  
                c.amount = amount;
              }
            });

            setCart([...cart]);

            localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart]));

          } else {

            toast.error('Erro na alteração de quantidade do produto');

            return;
          }
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
