// MUI Imports
import Grid from '@mui/material/Grid2'

// Context Imports
import { ProductFormProvider } from '@/contexts/ProductFormContext'

// Component Imports
import ProductEditHeader from '@/views/apps/tokoku/products/edit/ProductEditHeader'
import ProductInformation from '@/views/apps/tokoku/products/edit/ProductInformation'
import ProductImage from '@/views/apps/tokoku/products/edit/ProductImage'
import ProductPricing from '@/views/apps/tokoku/products/edit/ProductPricing'
import ProductOrganize from '@/views/apps/tokoku/products/edit/ProductOrganize'

interface ProductEditPageProps {
  params: Promise<{ uuid: string }>
}

const ProductEditPage = async ({ params }: ProductEditPageProps) => {
  const { uuid } = await params

  return (
    <ProductFormProvider productUuid={uuid} isEdit={true}>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12 }}>
          <ProductEditHeader />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Grid container spacing={6}>
            <Grid size={{ xs: 12 }}>
              <ProductInformation />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <ProductImage />
            </Grid>
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

export default ProductEditPage