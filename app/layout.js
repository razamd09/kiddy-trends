import './globals.css'
import { CartProvider } from '../context/CartContext'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import CartDrawer from '../components/CartDrawer'

export const metadata = {
  title: 'Kiddy Trends – Fun Fashion for Little Ones',
  description: 'Cute & playful kids clothing for newborns to 12 years.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <Navbar />
          <CartDrawer />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}