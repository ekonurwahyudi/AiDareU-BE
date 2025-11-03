// MUI Imports
import Grid from '@mui/material/Grid2'

// Components Imports
import CongratulationsJohn from '@/views/apps/tokoku/dashboard/Congratulations'
import DashboardContent from '@/views/apps/tokoku/dashboard/DashboardContent'



// Data Imports
import {
  getInvoiceData,
  getUserStoreUuid,
  getUserInfo,
  getDashboardStats,
  getRevenueData,
  getPopularProducts,
  getRecentOrders
} from '@/app/server/actions'

const EcommerceDashboard = async () => {
  try {
    // Get user info and store UUID
    const [userInfo, storeUuid] = await Promise.all([getUserInfo(), getUserStoreUuid()])

    console.log('Dashboard - User Info:', userInfo)
    console.log('Dashboard - Store UUID:', storeUuid)

    // Fetch dashboard data with error handling
    const [invoiceData, dashboardStats, revenueData, popularProducts, recentOrders] = await Promise.allSettled([
      getInvoiceData(),
      getDashboardStats(storeUuid || undefined),
      getRevenueData(storeUuid || undefined, 'month'),
      getPopularProducts(storeUuid || undefined, 5),
      getRecentOrders(storeUuid || undefined, 10)
    ])

    // Extract successful results or use defaults
    const stats = dashboardStats.status === 'fulfilled' ? dashboardStats.value : null
    const revenue = revenueData.status === 'fulfilled' ? revenueData.value : null
    const products = popularProducts.status === 'fulfilled' ? popularProducts.value : null

    // Calculate monthly revenue from stats
    const monthlyRevenue = stats?.total_revenue || 0

    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <CongratulationsJohn
            userName={userInfo?.name || userInfo?.username || null}
            monthlyRevenue={monthlyRevenue}
            storeName={userInfo?.store?.name || null}
          />
        </Grid>
        <DashboardContent dashboardStats={stats} revenueData={revenue} popularProducts={products} />
      </Grid>
    )
  } catch (error) {
    console.error('Error loading dashboard:', error)

    // Return dashboard with default values on error
    return (
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <CongratulationsJohn userName={null} monthlyRevenue={null} storeName={null} />
        </Grid>
        <DashboardContent dashboardStats={null} revenueData={null} popularProducts={null} />
      </Grid>
    )
  }
}

export default EcommerceDashboard
