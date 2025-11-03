// MUI Imports
import Grid from '@mui/material/Grid2'

// Context Imports
import { ProductFormProvider } from '@/contexts/ProductFormContext'

// Component Imports
import ProductAddHeader from '@/views/apps/tokoku/products/add/ProductAddHeader'
import ProductInformation from '@/views/apps/tokoku/products/add/ProductInformation'
import ProductImage from '@/views/apps/tokoku/products/add/ProductImage'
import ProductVariants from '@/views/apps/tokoku/products/add/ProductVariants'
import ProductInventory from '@/views/apps/tokoku/products/add/ProductInventory'
import ProductPricing from '@/views/apps/tokoku/products/add/ProductPricing'
import ProductOrganize from '@/views/apps/tokoku/products/add/ProductOrganize'

const eCommerceProductsAdd = () => {
  return (
    <ProductFormProvider>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <ProductAddHeader />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <ProductInformation />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ProductImage />
            </Grid>
            {/* <Grid size={{ xs: 12 }}>
              <ProductVariants />
            </Grid> */}
            {/* <Grid size={{ xs: 12 }}>
              <ProductInventory />
            </Grid> */}
          </Grid>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <ProductPricing />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ProductOrganize />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </ProductFormProvider>
  )
}

export default eCommerceProductsAdd
