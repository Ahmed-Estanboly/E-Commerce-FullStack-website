import { CartProvider } from './store'
import { AppRouter } from './Router'
import { BranchProvider } from './store/branch-provider'

function App() {
  return (
    <BranchProvider>
      <CartProvider>
        <AppRouter />
      </CartProvider>
    </BranchProvider>
  )
}

export default App