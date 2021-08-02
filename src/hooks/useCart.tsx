import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
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
    // const storagedCart = Buscar dados do localStorage
  
  const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
    
  });

  useEffect(() => {
    console.log(cart);
  }, [cart]);

    const addProduct = async (productId: number) => {
    try {
      if(cart.some(product => product.id === productId)){ //produto já existe no carrinh
        const product = cart.filter(p => p.id === productId)[0];
        const newAmount = product.amount+1;
        const response = await api.get(`./stock/${productId}`); //Product
        
        if(newAmount>response.data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
        } else{
          product.amount = newAmount;
          setCart([
            ...cart.filter(p => p.id !== productId),
            product,
          ]);
        }
      } else
      { //produto não existe no carrinho
        const response = await api.get(`./products/${productId}`); //Product
        response.data.amount = 1;
        setCart([
          ...cart,
          response.data,
        ]);
      }
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      setCart(cart.filter(p => p.id !== productId))
    } catch {
      toast.error('Erro na remoção do produto');
    }
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      
      // 1 - Consultar na API o estoque através do id do produto
      const response = await api.get(`./stock/${productId}`); // TODO Verificar se existe no estoque a quantidade desejada do produto.
      
      
      if(amount>response.data.amount) {  // 2 - VERIFICAR se o amount recebido > ao amount do estoque
        toast.error('Quantidade solicitada fora de estoque'); // 2.1 Se for maior exibir erro com a mensagem para o cliente
        
      } else{ // 2.2 Se for menor ou igual, atualizar o amount do produto usando o setCart (parecido com o que vc fez no add product) 
        const product = cart.filter(p => p.id === productId)[0];
        product.amount = amount;
        
        setCart([
          ...cart.filter(p => p.id !== productId),
          product,
        ]);
      }
      console.log(response.data.amount);
      
    } catch {
      
     //Capturar utilizando trycatch os erros que ocorrerem ao longo do método
      toast.error('Erro na alteração de quantidade do produto');
    }
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
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
