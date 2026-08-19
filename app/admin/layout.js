import AdminPortalNav from '../../components/AdminPortalNav'

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminPortalNav />
      {children}
    </>
  )
}
