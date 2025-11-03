// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import TambahKaryawan from './TambahKaryawan'


const KaryawanTab = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <TambahKaryawan />
      </Grid>

    </Grid>
  )
}

export default KaryawanTab
