// MUI Imports
import Grid from '@mui/material/Grid2'

// Type Imports
import type { PricingPlanType } from '@/types/pages/pricingTypes'

// Component Imports
// import CurrentPlan from './CurrentPlan'
import RekeningBank from './RekeningBank'
// import BillingAddress from './BillingAddress'

const BillingPlans = ({ data, storeUuid }: { data?: PricingPlanType[], storeUuid?: string | null }) => {
  return (
    <Grid container spacing={6}>
      {/* <Grid size={{ xs: 12 }}>
        <CurrentPlan data={data} />
      </Grid> */}
      <Grid size={{ xs: 12 }}>
        <RekeningBank storeUuid={storeUuid} />
      </Grid>
      {/* <Grid size={{ xs: 12 }}>
        <BillingAddress />
      </Grid> */}
    </Grid>
  )
}

export default BillingPlans
