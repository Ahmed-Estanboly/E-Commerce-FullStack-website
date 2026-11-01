import { CartProvider } from './store'
import { AppRouter } from './Router'

function App() {
  return (
    <CartProvider>
      <AppRouter />
    </CartProvider>
  )
}

export default App