'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import ProductDigitalHeader from './ProductDigitalHeader'
import ProductDigitalCard from './ProductDigitalCard'

// Type Imports
import type { ProductDigital } from './ProductDigitalCard'

type Props = {
  productData?: ProductDigital[]
}

const ProductDigitalList = ({ productData }: Props) => {
  // States
  const [searchValue, setSearchValue] = useState('')

  return (
    <Grid container spacing={6}>
      <Grid size={12}>
        <ProductDigitalHeader searchValue={searchValue} setSearchValue={setSearchValue} />
      </Grid>
      <Grid size={12}>
        <ProductDigitalCard productData={productData} searchValue={searchValue} />
      </Grid>
    </Grid>
  )
}

export default ProductDigitalList
