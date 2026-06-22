import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export const metadata = {
  title: 'Kiddy Trends – Fun Fashion for Little Ones',
  description: 'Cute & playful kids clothing for newborns to 12 years. Shop the latest Kiddy Trends collections.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
