'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Divider from '@mui/material/Divider'

// Component Imports
import CustomTextField from '@core/components/mui/TextField'

const TambahKaryawan = () => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [isConfirmPasswordShown, setIsConfirmPasswordShown] = useState(false)

  return (
    <Card>
      <CardHeader
        title="Tambah Karyawan"subheader="Tmbah Karyawan untuk mengelola toko."
        sx={{ pb: 1 }}
      />
      <Divider className="mlb-4" />
      <CardContent className="flex flex-col gap-4">
        <form>
          <Grid container spacing={4}>
            {/* Nama Karyawan */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField fullWidth label="Nama Karyawan" placeholder="John Doe" />
            </Grid>

            {/* No. Handphone */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField fullWidth label="No. Handphone" placeholder="08123456789" />
            </Grid>

            {/* Email Karyawan */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField fullWidth label="Email Karyawan" placeholder="john.doe@email.com" />
            </Grid>

            {/* Role */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField select fullWidth label="Role" defaultValue="">
                <MenuItem value="">-- Pilih Role --</MenuItem>
                <MenuItem value="admintoko">Admin Toko</MenuItem>
              </CustomTextField>
            </Grid>

            {/* Password */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Password"
                type={isPasswordShown ? 'text' : 'password'}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setIsPasswordShown(!isPasswordShown)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <i className={isPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>

            {/* Konfirmasi Password */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <CustomTextField
                fullWidth
                label="Konfirmasi Password"
                type={isConfirmPasswordShown ? 'text' : 'password'}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          onClick={() => setIsConfirmPasswordShown(!isConfirmPasswordShown)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          <i className={isConfirmPasswordShown ? 'tabler-eye-off' : 'tabler-eye'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>

            {/* Tombol Tambah */}
            <Grid size={{ xs: 12 }} className="flex gap-4 justify-end">
              <Button variant="contained" type="submit">
                Tambah Karyawan
              </Button>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default TambahKaryawan
