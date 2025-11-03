'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid2'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'

// Context Imports
import { useRBAC } from '@/contexts/rbacContext'

const ThemeSettings = ({ tabContentList }: { tabContentList: { [key: string]: ReactElement } }) => {
  // RBAC Context
  const { currentStore } = useRBAC()

  // States
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    console.log('Current Store from RBAC:', currentStore)
  }, [currentStore])

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  const handleViewWebsite = () => {
    // Get subdomain from RBAC context first
    const subdomain = currentStore?.subdomain || currentStore?.nama_toko?.toLowerCase().replace(/\s+/g, '-')

    console.log('Opening store with subdomain:', subdomain)

    if (subdomain) {
      // Open store with subdomain
      window.open(`http://localhost:8080/s/${subdomain}`, '_blank')
    } else {
      // If no subdomain, try to get from localStorage
      const user = localStorage.getItem('user')
      if (user) {
        const userData = JSON.parse(user)
        const fallbackSubdomain = userData.store?.subdomain

        console.log('Fallback subdomain from localStorage:', fallbackSubdomain)

        if (fallbackSubdomain) {
          window.open(`http://localhost:8080/s/${fallbackSubdomain}`, '_blank')
        } else {
          // Last resort - use store name as slug
          const storeName = userData.store?.nama_toko
          if (storeName) {
            const storeSlug = storeName.toLowerCase().replace(/\s+/g, '-')
            console.log('Using store name as slug:', storeSlug)
            window.open(`http://localhost:8080/s/${storeSlug}`, '_blank')
          } else {
            window.open(`http://localhost:8080/store`, '_blank')
          }
        }
      } else {
        window.open(`http://localhost:8080/store`, '_blank')
      }
    }
  }

  return (
    <Box sx={{ px: { xs: 2, sm: 4, md: 6 }, py: 4 }}>
      <Card sx={{ p: 0, overflow: 'visible', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
        <TabContext value={activeTab}>
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Box
                sx={{
                  p: { xs: 4, md: 6 },
                  height: '100%',
                  bgcolor: '#FAFAFA',
                  borderRight: { md: '1px solid #E5E7EB' }
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant='h5' sx={{ fontWeight: 600, color: '#111827', mb: 1 }}>
                    Theme Option
                  </Typography>
                  <Divider
                    sx={{
                      width: 40,
                      height: 3,
                      bgcolor: 'primary.main',
                      borderRadius: 2,
                      mb: 4
                    }}
                  />
                </Box>

                <CustomTabList
                  orientation='vertical'
                  onChange={handleChange}
                  className='is-full'
                  pill='true'
                  sx={{
                    '& .MuiTabs-indicator': {
                      display: 'none'
                    },
                    '& .MuiTab-root': {
                      mb: 1.5,
                      bgcolor: '#EFEFEF',
                      color: '#6B7280',
                      borderRadius: '10px',
                      minHeight: 48,
                      transition: 'all 0.2s ease-in-out',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                      },
                      '&:hover:not(.Mui-selected)': {
                        bgcolor: '#E0E0E0',
                        transform: 'translateX(4px)'
                      }
                    }
                  }}
                >
                  <Tab
                    label='General'
                    icon={<i className='tabler-settings' />}
                    iconPosition='start'
                    value='general'
                    className='flex-row justify-start !min-is-full'
                  />
                  <Tab
                    label='Slide'
                    icon={<i className='tabler-photo' />}
                    iconPosition='start'
                    value='slide'
                    className='flex-row justify-start !min-is-full'
                  />
                  <Tab
                    label='FAQ'
                    icon={<i className='tabler-help' />}
                    iconPosition='start'
                    value='faq'
                    className='flex-row justify-start !min-is-full'
                  />
                  <Tab
                    label='Testimoni'
                    icon={<i className='tabler-message-star' />}
                    iconPosition='start'
                    value='testimoni'
                    className='flex-row justify-start !min-is-full'
                  />
                  <Tab
                    label='SEO'
                    icon={<i className='tabler-chart-line' />}
                    iconPosition='start'
                    value='seo'
                    className='flex-row justify-start !min-is-full'
                  />
                </CustomTabList>

                {/* View Website Button */}
                <Box sx={{ mt: 4 }}>
                  <Button
                    variant='contained'
                    color='success'
                    fullWidth
                    startIcon={<i className='tabler-world' />}
                    onClick={handleViewWebsite}
                    sx={{
                      borderRadius: '10px',
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: 'none',
                      fontSize: '1rem',
                      boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(34, 197, 94, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    View Website
                  </Button>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 9 }}>
              <Box sx={{ p: { xs: 4, md: 6 } }}>
                <TabPanel value={activeTab} className='p-0'>
                  {tabContentList[activeTab]}
                </TabPanel>
              </Box>
            </Grid>
          </Grid>
        </TabContext>
      </Card>
    </Box>
  )
}

export default ThemeSettings
