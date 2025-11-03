'use client'

// React Imports
import { useState } from 'react'
import type { SyntheticEvent, ReactElement } from 'react'

// MUI Imports
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabPanel from '@mui/lab/TabPanel'
import Grid from '@mui/material/Grid2'

// Component Imports
import CustomTabList from '@core/components/mui/TabList'

const UserRight = ({ tabContentList }: { tabContentList: { [key: string]: ReactElement } }) => {
  // States
  const [activeTab, setActiveTab] = useState('overview')

  const handleChange = (event: SyntheticEvent, value: string) => {
    setActiveTab(value)
  }

  return (
    <>
      <TabContext value={activeTab}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <CustomTabList onChange={handleChange} variant='scrollable' pill='true'>
              <Tab icon={<i className='tabler-building-store' />} value='overview' label='Toko Saya' iconPosition='start' />
              <Tab icon={<i className='tabler-credit-card' />} value='billing-plans' label='Rekening bank' iconPosition='start' />
              <Tab icon={<i className='tabler-user-square-rounded' />} value='security' label='Karyawan' iconPosition='start' />
              <Tab icon={<i className='tabler-layers-linked' />} value='connections' label='Sosial Media' iconPosition='start' />
            </CustomTabList>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TabPanel value={activeTab} className='p-0'>
              {tabContentList[activeTab]}
            </TabPanel>
          </Grid>
        </Grid>
      </TabContext>
    </>
  )
}

export default UserRight
