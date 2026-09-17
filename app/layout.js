import './globals.css'
import { Fredoka, Nunito } from 'next/font/google'
import { CartProvider } from '../context/CartContext'
import CartDrawer from '../components/CartDrawer'
import Script from 'next/script'
import SiteChrome from '../components/SiteChrome'
import AnalyticsTracker from '../components/AnalyticsTracker'

// The Google Fonts catalog merged the old standalone "Fredoka One" family
// into the variable "Fredoka" family; weight 500 is the closest match to
// how "Fredoka One" originally rendered.
const fredokaOne = Fredoka({
  subsets: ['latin'],
  weight: '500',
  variable: '--font-display',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = {
  title: 'Kiddy Trends – Fun Fashion for Little Ones',
  description: 'Shop cute & affordable kids clothing, bedding, bags and accessories in Pakistan. Newborn to 12 years. Cash on Delivery available across Pakistan.',
  keywords: 'kids clothes pakistan, baby clothes lahore, kids fashion pakistan, affordable kids clothing, newborn clothes pakistan, kids bedding pakistan, school bags pakistan',
  authors: [{ name: 'Kiddy Trends' }],
  creator: 'Kiddy Trends',
  publisher: 'Kiddy Trends',
  metadataBase: new URL('https://thekiddytrends.com'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Kiddy Trends – Fun Fashion for Little Ones',
    description: 'Shop cute & affordable kids clothing, bedding, bags and accessories in Pakistan. Newborn to 12 years.',
    url: 'https://thekiddytrends.com',
    siteName: 'Kiddy Trends',
    images: [{ url: 'https://thekiddytrends.com/logo.jpg', width: 800, height: 800, alt: 'Kiddy Trends Logo' }],
    locale: 'en_PK',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kiddy Trends – Fun Fashion for Little Ones',
    description: 'Shop cute & affordable kids clothing in Pakistan. Newborn to 12 years.',
    images: ['https://thekiddytrends.com/logo.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kiddy Trends',
  url: 'https://thekiddytrends.com',
  logo: 'https://thekiddytrends.com/logo.jpg',
  description: 'Shop cute & affordable kids clothing, bedding, bags and accessories in Pakistan. Newborn to 12 years. Cash on Delivery available across Pakistan.',
  sameAs: [
    'https://instagram.com/trendykids.2020',
    'https://facebook.com/thetrendykidsshop',
    'https://www.tiktok.com/@kiddy.trends',
    'https://youtube.com/@kiddytrends5518',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+92-336-0677340',
    contactType: 'customer service',
    areaServed: 'PK',
    availableLanguage: ['en', 'ur'],
  },
}

export default function RootLayout({ children }) {
  return (
      <html lang="en" className={fredokaOne.variable + ' ' + nunito.variable}>
      <body>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* Google Analytics */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-RWMHQN9PL4" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RWMHQN9PL4', { send_page_view: false });
          `}
      </Script>

      {/* Facebook Pixel */}
      <Script id="facebook-pixel" strategy="afterInteractive">
        {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || '8362200723884208'}');
            fbq('track', 'PageView');
          `}
      </Script>

      <CartProvider>
        <AnalyticsTracker />
        <CartDrawer />
        <SiteChrome>{children}</SiteChrome>
      </CartProvider>
      </body>
      </html>
  )
}