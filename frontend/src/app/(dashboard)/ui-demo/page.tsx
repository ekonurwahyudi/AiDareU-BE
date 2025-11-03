'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'

// Component Imports
import StoreSetup from '@/components/dialogs/store-setup'
import { RBACProvider } from '@/contexts/rbacContext'

const UIDemoPage = () => {
  // States
  const [showStoreModal, setShowStoreModal] = useState(false)

  return (
    <RBACProvider>
      <Grid container spacing={6}>
        {/* Header */}
        <Grid item xs={12}>
          <Typography variant="h4" className="mb-2">
            🎨 UI Components Demo
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Lihat semua komponen UI yang sudah dibuat untuk sistem AiDareU
          </Typography>
        </Grid>

        {/* Authentication Components */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-4 flex items-center gap-2">
                <i className="tabler-lock text-primary" />
                Authentication Components
              </Typography>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Registration */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-user-plus text-2xl text-success" />
                    <div>
                      <Typography variant="h6">Registration Form</Typography>
                      <Chip label="✅ Completed" color="success" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    Form registrasi lengkap dengan semua field yang diminta:
                    • Nama Lengkap, Email, No HP
                    • Password dengan validasi kompleksitas
                    • Alasan Gabung, Info Dari (dropdown)
                    • Terms & Conditions checkbox
                  </Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    href="/auth/register"
                    target="_blank"
                  >
                    Lihat Registration Form
                  </Button>
                </div>

                {/* Email Verification */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-mail text-2xl text-info" />
                    <div>
                      <Typography variant="h6">Email Verification</Typography>
                      <Chip label="✅ Completed" color="success" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    Verifikasi email dengan 6-digit OTP:
                    • OTP input component yang elegant
                    • Countdown timer untuk resend
                    • Email masking untuk security
                    • Auto-redirect setelah verifikasi
                  </Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    href="/auth/verify-email"
                    target="_blank"
                  >
                    Lihat Email Verification
                  </Button>
                </div>

                {/* Login */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-login text-2xl text-primary" />
                    <div>
                      <Typography variant="h6">Login Form</Typography>
                      <Chip label="✅ Available" color="info" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    Login form yang sudah ada di template:
                    • Email & Password validation
                    • Remember me functionality
                    • Forgot password link
                    • Social login buttons
                  </Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth 
                    href="/login"
                    target="_blank"
                  >
                    Lihat Login Form
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Store Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-4 flex items-center gap-2">
                <i className="tabler-store text-primary" />
                Store Management
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Store Setup Modal */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-building-store text-2xl text-success" />
                    <div>
                      <Typography variant="h6">Store Setup Modal</Typography>
                      <Chip label="✅ Completed" color="success" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    Modal setup toko sesuai design yang Anda berikan:
                    • Nama Toko & Sub Domain
                    • No HP Toko & Kategori
                    • Deskripsi Toko (textarea)
                    • Live URL preview
                    • Auto subdomain generation
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth
                    onClick={() => setShowStoreModal(true)}
                  >
                    Demo Store Setup Modal
                  </Button>
                </div>

                {/* Store List */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-list text-2xl text-info" />
                    <div>
                      <Typography variant="h6">Store Management</Typography>
                      <Chip label="🚧 In Progress" color="warning" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    Interface untuk mengelola stores:
                    • List semua stores dengan pagination
                    • Create, edit, delete stores
                    • Store context switching
                    • User assignment per store
                  </Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    disabled
                  >
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* RBAC Components */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-4 flex items-center gap-2">
                <i className="tabler-shield text-primary" />
                RBAC (Role-Based Access Control)
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* User Management */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-users text-2xl text-primary" />
                    <div>
                      <Typography variant="h6">User Management</Typography>
                      <Chip label="✅ Completed" color="success" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    Complete CRUD interface untuk users:
                    • Create, Edit, Delete users
                    • Role assignment dengan context
                    • Search & pagination
                    • Status toggle (active/inactive)
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    href="/master-data/users"
                    target="_blank"
                  >
                    Lihat User Management
                  </Button>
                </div>

                {/* Role Management */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-shield text-2xl text-success" />
                    <div>
                      <Typography variant="h6">Role Management</Typography>
                      <Chip label="✅ Completed" color="success" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    Kelola roles dan permissions:
                    • Create custom roles
                    • Assign permissions per role
                    • Role hierarchy management
                    • System vs Custom roles
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    href="/master-data/roles"
                    target="_blank"
                  >
                    Lihat Role Management
                  </Button>
                </div>

                {/* Permission Management */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-key text-2xl text-info" />
                    <div>
                      <Typography variant="h6">Permission Management</Typography>
                      <Chip label="✅ Completed" color="success" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    View all system permissions:
                    • Grouped by modules
                    • Search & filter permissions
                    • Permission statistics
                    • Action-based color coding
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    href="/master-data/permissions"
                    target="_blank"
                  >
                    Lihat Permission Management
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Dashboard */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-4 flex items-center gap-2">
                <i className="tabler-dashboard text-primary" />
                Dashboard & Navigation
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-layout-dashboard text-2xl text-success" />
                    <div>
                      <Typography variant="h6">Main Dashboard</Typography>
                      <Chip label="✅ Completed" color="success" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    Dashboard utama dengan:
                    • Statistics cards
                    • Welcome section dengan fitur overview
                    • Quick actions menu
                    • Recent activity feed
                  </Typography>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    href="/dashboard"
                    target="_blank"
                  >
                    Lihat Dashboard
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <i className="tabler-menu text-2xl text-primary" />
                    <div>
                      <Typography variant="h6">Navigation Menu</Typography>
                      <Chip label="✅ Completed" color="success" size="small" />
                    </div>
                  </div>
                  <Typography variant="body2" className="mb-3">
                    Sidebar navigation dengan:
                    • Master Data submenu (Users, Roles, Permissions)
                    • Store Management submenu
                    • Analytics & Tools sections
                    • Collapsible menu structure
                  </Typography>
                  <Button 
                    variant="outlined" 
                    fullWidth
                    disabled
                  >
                    Check Current Sidebar →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Technical Implementation */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h5" className="mb-4 flex items-center gap-2">
                <i className="tabler-code text-primary" />
                Technical Implementation
              </Typography>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <i className="tabler-brand-typescript text-3xl text-blue-500 mb-2" />
                  <Typography variant="h6">TypeScript</Typography>
                  <Typography variant="body2">
                    Full type safety dengan comprehensive interfaces
                  </Typography>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <i className="tabler-database text-3xl text-green-500 mb-2" />
                  <Typography variant="h6">Laravel Backend</Typography>
                  <Typography variant="body2">
                    Complete API dengan RBAC models & controllers
                  </Typography>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <i className="tabler-shield-check text-3xl text-purple-500 mb-2" />
                  <Typography variant="h6">RBAC System</Typography>
                  <Typography variant="body2">
                    Role-based access control yang komprehensif
                  </Typography>
                </div>

                <div className="text-center p-4 border rounded-lg">
                  <i className="tabler-devices text-3xl text-orange-500 mb-2" />
                  <Typography variant="h6">Responsive Design</Typography>
                  <Typography variant="body2">
                    Mobile-first dengan MUI components
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>

        {/* Getting Started */}
        <Grid item xs={12}>
          <Card className="bg-gradient-to-r from-primary-main to-primary-light text-white">
            <CardContent>
              <Typography variant="h5" className="mb-4">
                🚀 Ready to Start?
              </Typography>
              <Typography variant="body1" className="mb-4">
                Semua komponen sudah siap digunakan! Jalankan backend setup dan mulai testing semua fitur.
              </Typography>
              <div className="flex gap-4">
                <Button 
                  variant="contained" 
                  color="secondary"
                  href="/auth/register"
                  target="_blank"
                >
                  Test Registration
                </Button>
                <Button 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'white' }}
                  href="/master-data/users"
                  target="_blank"
                >
                  Test User Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Store Setup Modal */}
      <StoreSetup 
        open={showStoreModal}
        setOpen={setShowStoreModal}
      />
    </RBACProvider>
  )
}

export default UIDemoPage