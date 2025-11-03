'use client'

// React Imports
import { useState,useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid'
import FormHelperText from '@mui/material/FormHelperText'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'

// Validation Schema
const schema = yup.object().shape({
  storeName: yup.string().required('Nama toko wajib diisi').min(3, 'Nama toko minimal 3 karakter'),
  subdomain: yup
    .string()
    .required('Subdomain wajib diisi')
    .min(3, 'Subdomain minimal 3 karakter')
    .matches(/^[a-z0-9-]+$/, 'Subdomain hanya boleh huruf kecil, angka, dan tanda -'),
  phoneNumber: yup.string().required('Nomor HP wajib diisi').min(8, 'Nomor HP minimal 10 digit'),
  category: yup.string().required('Kategori toko wajib dipilih'),
  description: yup.string().required('Deskripsi toko wajib diisi').min(10, 'Deskripsi minimal 10 karakter'),
  province: yup.string().required('Provinsi wajib dipilih'),
  city: yup.string().required('Kota wajib dipilih'),
  district: yup.string().required('Kecamatan wajib dipilih')
})

// Category mapping between UI labels and backend enum slugs
const CATEGORY_LABEL_TO_SLUG: Record<string, string> = {
  'Produk Digital': 'digital',
  'Fashion & Pakaian': 'fashion',
  'Elektronik & Gadget': 'elektronik',
  'Makanan & Minuman': 'makanan',
  'Kesehatan & Kecantikan': 'kesehatan',
  'Rumah & Taman': 'rumah_tangga',
  'Olahraga & Outdoor': 'olahraga',
  'Buku & Alat Tulis': 'buku_media',
  'Mainan & Bayi': 'mainan_hobi',
  'Otomotif': 'otomotif',
  'Jasa': 'jasa',
  'Lainnya': 'lainnya'
}

const CATEGORY_SLUG_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(CATEGORY_LABEL_TO_SLUG).map(([label, slug]) => [slug, label])
)

const categories = Object.keys(CATEGORY_LABEL_TO_SLUG)

// Types
type StoreItem = {
  id: number
  uuid?: string
  name: string
  subdomain: string
  domain?: string
  phone: string
  category: string
  description: string
  province?: string
  city?: string
  district?: string
  url?: string
}

// Extend Window interface to include pendingAddressData
declare global {
  interface Window {
    pendingAddressData?: {
      province: string
      city: string
      district: string
    }
  }
}

// Form values type aligned with form field names
type FormValues = {
  storeName: string
  subdomain: string
  phoneNumber: string
  category: string
  description: string
  province: string
  city: string
  district: string
}

function TokoSaya({ storeUuid }: { storeUuid?: string | null }) {
  // States
  const [storeData, setStoreData] = useState<Partial<StoreItem>>({})
  const [selectedStoreUuid, setSelectedStoreUuid] = useState<string | null>(null)
  const [initialSubdomain, setInitialSubdomain] = useState<string>('')
  const [loadingStore, setLoadingStore] = useState<boolean>(true)
  const [subdomainChecking, setSubdomainChecking] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [checkTimeout, setCheckTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)

  // Location States
  const [provinces, setProvinces] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingDistricts, setLoadingDistricts] = useState(false)

  // Form
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      storeName: '',
      subdomain: '',
      phoneNumber: '',
      category: '',
      description: '',
      province: '',
      city: '',
      district: ''
    }
  })

  const watchedSubdomain = watch('subdomain')
  const watchedProvince = watch('province')
  const watchedCity = watch('city')

  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }

  // Load provinces on component mount
  useEffect(() => {
    loadProvinces()
  }, [])

  // Process pending address data after provinces are loaded
  useEffect(() => {
    if (provinces.length > 0 && window.pendingAddressData) {
      const addressData = window.pendingAddressData
      loadAddressDataAfterProvinces(addressData)
      delete window.pendingAddressData
    }
  }, [provinces])

  // Load cities when province changes
  useEffect(() => {
    if (watchedProvince) {
      const selectedProvince = provinces.find(p => p.name === watchedProvince)
      if (selectedProvince) {
        loadCities(selectedProvince.id)
        setValue('city', '')
        setValue('district', '')
        setCities([])
        setDistricts([])
      }
    }
  }, [watchedProvince, provinces, setValue])

  // Load districts when city changes
  useEffect(() => {
    if (watchedCity) {
      const selectedCity = cities.find(c => c.name === watchedCity)
      if (selectedCity) {
        loadDistricts(selectedCity.id)
        setValue('district', '')
        setDistricts([])
      }
    }
  }, [watchedCity, cities, setValue])

  // API Functions for location data
  const loadProvinces = async () => {
    setLoadingProvinces(true)
    try {
      const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      const data = await response.json()
      setProvinces(data)
    } catch (error) {
      console.error('Error loading provinces:', error)
    } finally {
      setLoadingProvinces(false)
    }
  }

  const loadCities = async (provinceId: string) => {
    setLoadingCities(true)
    try {
      const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
      const data = await response.json()
      setCities(data)
    } catch (error) {
      console.error('Error loading cities:', error)
    } finally {
      setLoadingCities(false)
    }
  }

  const loadDistricts = async (cityId: string) => {
    setLoadingDistricts(true)
    try {
      const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${cityId}.json`)
      const data = await response.json()
      setDistricts(data)
    } catch (error) {
      console.error('Error loading districts:', error)
    } finally {
      setLoadingDistricts(false)
    }
  }

  // Helper function to load address data after provinces are available
  const loadAddressDataAfterProvinces = async (addressData: { province: string; city: string; district: string }) => {
    if (!addressData.province || provinces.length === 0) {
      return
    }

    const selectedProvince = provinces.find(p => p.name === addressData.province)
    if (selectedProvince) {
      setValue('province', selectedProvince.name)

      try {
        // Load cities
        const citiesResponse = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince.id}.json`)
        const citiesData = await citiesResponse.json()
        setCities(citiesData)

        if (addressData.city) {
          const selectedCity = citiesData.find((c: { id: string; name: string }) => c.name === addressData.city)
          if (selectedCity) {
            setValue('city', selectedCity.name)

            // Load districts
            const districtsResponse = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity.id}.json`)
            const districtsData = await districtsResponse.json()
            setDistricts(districtsData)

            // Find and set the district
            if (addressData.district) {
              const selectedDistrict = districtsData.find((d: { id: string; name: string }) => d.name === addressData.district)
              if (selectedDistrict) {
                setValue('district', selectedDistrict.name)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading address data:', error)
      }
    }
  }

  // Helper to get cities (reusable)
  const getCities = async (provinceId: string) => {
    try {
      const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
      return await response.json()
    } catch (error) {
      console.error('Error getting cities:', error)
      return []
    }
  }

  // Fetch current user's store(s) and prefill form
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoadingStore(true)

        // Use backend URL from environment variable
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

        // Get user data from localStorage to fetch their store
        const storedUserData = localStorage.getItem('user_data')
        const authToken = localStorage.getItem('auth_token')

        if (!storedUserData) {
          console.error('No user data found')
          setLoadingStore(false)
          return
        }

        const user = JSON.parse(storedUserData)

        // Build headers for authentication
        const headers: HeadersInit = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }

        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`
        }

        if (user.uuid) {
          headers['X-User-UUID'] = user.uuid
        }

        if (storeUuid) {
          // Fetch store detail directly using provided storeUuid
          const res = await fetch(`${backendUrl}/api/public/stores/${storeUuid}`, {
            headers,
            credentials: 'include',
            cache: 'no-store'
          })

          const json = await res.json()

          if (res.ok && json.data) {
            const storeFromUser = json.data

            const s: StoreItem = {
              id: 0,
              uuid: storeFromUser.uuid,
              name: storeFromUser.name || '',
              subdomain: storeFromUser.subdomain || '',
              phone: storeFromUser.phone || user.phone || '',
              category: storeFromUser.category || '',
              description: storeFromUser.description || ''
            }
            setStoreData(s)
            setSelectedStoreUuid(s.uuid || null)
            setInitialSubdomain(s.subdomain || '')

            const provinceValue = (s as any).province || (s as any).provinsi || ''
            const cityValue = (s as any).city || (s as any).kota || ''
            const districtValue = (s as any).district || (s as any).kecamatan || ''

            setValue('storeName', s.name || '')
            setValue('subdomain', s.subdomain || '')
            setValue('phoneNumber', s.phone || '')
            setValue('category', CATEGORY_SLUG_TO_LABEL[s.category as string] || CATEGORY_SLUG_TO_LABEL[(s as any).kategori_toko as string] || '')
            setValue('description', s.description || '')
            setValue('province', provinceValue)
            setValue('city', cityValue)
            setValue('district', districtValue)

            if (provinceValue || cityValue || districtValue) {
              window.pendingAddressData = {
                province: provinceValue,
                city: cityValue,
                district: districtValue
              }
            }

            // For existing subdomain, mark as available to avoid false error
            setSubdomainAvailable(true)
          } else {
            console.log('No store found for this user')
          }
        } else {
          // Fallback: existing flow via `/api/users/me`
          const res = await fetch(`${backendUrl}/api/users/me`, {
            headers,
            credentials: 'include',
            cache: 'no-store'
          })

          const json = await res.json()

          if (!res.ok || json.status === 'error') {
            console.error('Failed to fetch user data:', json.message)
            setLoadingStore(false)
            return
          }

          const userData = json.data
          const storeFromUser = userData?.store

          if (storeFromUser) {
            const s: StoreItem = {
              id: 0,
              uuid: storeFromUser.uuid,
              name: storeFromUser.name || '',
              subdomain: storeFromUser.subdomain || '',
              phone: userData.phone || userData.no_hp || '',
              category: '',
              description: storeFromUser.description || ''
            }
            setStoreData(s)
            if ((s as any).uuid) setSelectedStoreUuid((s as any).uuid as string)
            setInitialSubdomain(s.subdomain)

            const provinceValue = (s as any).province || (s as any).provinsi || ''
            const cityValue = (s as any).city || (s as any).kota || ''
            const districtValue = (s as any).district || (s as any).kecamatan || ''

            setValue('storeName', s.name || '')
            setValue('subdomain', s.subdomain || '')
            setValue('phoneNumber', s.phone || '')
            setValue('category', CATEGORY_SLUG_TO_LABEL[s.category as string] || CATEGORY_SLUG_TO_LABEL[(s as any).kategori_toko as string] || '')
            setValue('description', s.description || '')
            setValue('province', provinceValue)
            setValue('city', cityValue)
            setValue('district', districtValue)

            if (provinceValue || cityValue || districtValue) {
              window.pendingAddressData = {
                province: provinceValue,
                city: cityValue,
                district: districtValue
              }
            }

            setSubdomainAvailable(true)
          } else {
            console.log('No store found for this user')
          }
        }
      } catch (err) {
        console.error('Failed to fetch stores:', err)
      } finally {
        setLoadingStore(false)
      }
    }

    fetchStores()
  }, [setValue, storeUuid])

  // Check subdomain availability
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null)
      return
    }

    // If user hasn't changed the original subdomain, consider it valid
    if (initialSubdomain && subdomain === initialSubdomain) {
      setSubdomainAvailable(true)
      return
    }

    setSubdomainChecking(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
      const res = await fetch(`${backendUrl}/api/stores/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`)
      const data = await res.json()
      setSubdomainAvailable(res.ok ? data.available : null)
    } catch (err) {
      console.error(err)
      setSubdomainAvailable(null)
    }
    setSubdomainChecking(false)
  }

  // Debounce check
  useEffect(() => {
    if (checkTimeout) clearTimeout(checkTimeout)
    if (watchedSubdomain) {
      const timeout = setTimeout(() => checkSubdomainAvailability(watchedSubdomain), 800)
      setCheckTimeout(timeout)
    } else {
      setSubdomainAvailable(null)
    }
    return () => {
      if (checkTimeout) clearTimeout(checkTimeout)
    }
  }, [watchedSubdomain])

  // Auto-generate subdomain
  const generateSubdomain = (storeName: string) => {
    return storeName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '')
  }

  // Submit
  const onSubmit = async (values: FormValues) => {
    if (!selectedStoreUuid) {
      return
    }

    try {
      setIsSaving(true)

      // Prevent submit if subdomain invalid or taken
      if (values.subdomain && (!/^[a-z0-9-]+$/.test(values.subdomain) || values.subdomain.length < 3)) {
        toast.error('Subdomain tidak valid')
        setIsSaving(false)
        return
      }
      if (values.subdomain && subdomainAvailable === false && values.subdomain !== initialSubdomain) {
        toast.error('Subdomain sudah digunakan')
        setIsSaving(false)
        return
      }

      const payload: any = {
        nama_toko: values.storeName,
        subdomain: values.subdomain,
        no_hp_toko: values.phoneNumber,
        kategori_toko: CATEGORY_LABEL_TO_SLUG[values.category] || 'lainnya',
        deskripsi_toko: values.description,
        provinsi: values.province,
        kota: values.city,
        kecamatan: values.district
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
      const res = await fetch(`${backendUrl}/api/public/stores/${selectedStoreUuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.message || 'Gagal menyimpan perubahan')
      } else {
        toast.success(data.message || 'Berhasil menyimpan perubahan')
        // Update initial subdomain if changed
        if (values.subdomain) setInitialSubdomain(values.subdomain)
        setIsEditing(false) // Disable edit mode after successful update
      }
    } catch (e) {
      console.error(e)
      toast.error('Terjadi kesalahan server')
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading state
  if (loadingStore) {
    return (
      <Card>
        <CardHeader title="Pengaturan Toko" subheader='Pengaturan Toko agar lebih mudah dikenali.' sx={{ pb: 1 }} />
        <Divider className='mlb-4' />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  // Show empty state if no store
  if (!selectedStoreUuid) {
    return (
      <Card>
        <CardHeader title="Pengaturan Toko" subheader='Pengaturan Toko agar lebih mudah dikenali.' sx={{ pb: 1 }} />
        <Divider className='mlb-4' />
        <CardContent>
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            minHeight={300}
            gap={2}
          >
            <i className="tabler-shopping-bag" style={{ fontSize: '64px', color: '#999' }} />
            <Typography variant="h6" color="text.secondary">
              Toko Belum Ada
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Silakan isi data toko Anda untuk memulai berjualan
            </Typography>
            <Button
              variant="contained"
              onClick={() => setIsEditing(true)}
              startIcon={<i className="tabler-plus" />}
            >
              Buat Toko
            </Button>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader title="Pengaturan Toko" subheader='Pengaturan Toko agar lebih mudah dikenali.' sx={{ pb: 1 }} />
      <Divider className='mlb-4' />
      <CardContent>
        <Box component="form"  onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={7}>
            {/* Nama Toko */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="storeName"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nama Toko"
                    disabled={!isEditing}
                    error={!!errors.storeName}
                    helperText={errors.storeName?.message as string}
                    onChange={(e) => {
                      field.onChange(e)
                      setValue('subdomain', generateSubdomain(e.target.value))
                    }}
                  />
                )}
              />
            </Grid>

            {/* Subdomain */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="subdomain"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Subdomain"
                    disabled={!isEditing}
                    error={!!errors.subdomain || subdomainAvailable === false}
                    helperText={
                      errors.subdomain?.message ||
                      (subdomainAvailable === false
                        ? 'Subdomain sudah digunakan'
                        : subdomainAvailable === true
                        ? 'Subdomain tersedia'
                        : subdomainChecking
                        ? 'Mengecek...'
                        : '')
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">https://</InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          {subdomainChecking ? (
                            <CircularProgress size={20} />
                          ) : subdomainAvailable === true ? (
                            <i className="tabler-check text-success" />
                          ) : subdomainAvailable === false ? (
                            <i className="tabler-x text-error" />
                          ) : null}
                          <span className="ml-2">.aidareu.com</span>
                        </InputAdornment>
                      )
                    }}
                  />
                )}
              />
            </Grid>

            {/* No HP */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="phoneNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="No. Hp Toko"
                    placeholder="08123456789"
                    disabled={!isEditing}
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber?.message as string}
                    // InputProps={{
                    //   startAdornment: <InputAdornment position="start">+62</InputAdornment>
                    // }}
                  />
                )}
              />
            </Grid>

            {/* Kategori */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.category}>
                    <InputLabel>Kategori</InputLabel>
                    <Select {...field} label="Kategori" disabled={!isEditing}>
                      {categories.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.category?.message as string}</FormHelperText>
                  </FormControl>
                )}
              />
            </Grid>

            {/* Deskripsi */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={4}
                    label="Deskripsi Toko"
                    disabled={!isEditing}
                    error={!!errors.description}
                    helperText={errors.description?.message as string}
                  />
                )}
              />
            </Grid>

            {/* Provinsi */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="province"
                control={control}
                render={({ field }) => (
                  isEditing ? (
                    <FormControl fullWidth error={!!errors.province}>
                      <InputLabel>Provinsi</InputLabel>
                      <Select
                        {...field}
                        label="Provinsi"
                        disabled={loadingProvinces}
                      >
                        {provinces.map((province) => (
                          <MenuItem key={province.id} value={province.name}>
                            {province.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {loadingProvinces ? 'Memuat provinsi...' : errors.province?.message as string}
                      </FormHelperText>
                    </FormControl>
                  ) : (
                    <TextField
                      {...field}
                      fullWidth
                      label="Provinsi"
                      disabled
                      error={!!errors.province}
                      helperText={errors.province?.message as string}
                    />
                  )
                )}
              />
            </Grid>

            {/* Kota */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  isEditing ? (
                    <FormControl fullWidth error={!!errors.city}>
                      <InputLabel>Kota/Kabupaten</InputLabel>
                      <Select
                        {...field}
                        label="Kota/Kabupaten"
                        disabled={loadingCities || !watchedProvince}
                      >
                        {cities.map((city) => (
                          <MenuItem key={city.id} value={city.name}>
                            {city.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {loadingCities ? 'Memuat kota...' : errors.city?.message as string}
                      </FormHelperText>
                    </FormControl>
                  ) : (
                    <TextField
                      {...field}
                      fullWidth
                      label="Kota/Kabupaten"
                      disabled
                      error={!!errors.city}
                      helperText={errors.city?.message as string}
                    />
                  )
                )}
              />
            </Grid>

            {/* Kecamatan */}
            <Grid item xs={12} sm={4}>
              <Controller
                name="district"
                control={control}
                render={({ field }) => (
                  isEditing ? (
                    <FormControl fullWidth error={!!errors.district}>
                      <InputLabel>Kecamatan</InputLabel>
                      <Select
                        {...field}
                        label="Kecamatan"
                        disabled={loadingDistricts || !watchedCity}
                      >
                        {districts.map((district) => (
                          <MenuItem key={district.id} value={district.name}>
                            {district.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {loadingDistricts ? 'Memuat kecamatan...' : errors.district?.message as string}
                      </FormHelperText>
                    </FormControl>
                  ) : (
                    <TextField
                      {...field}
                      fullWidth
                      label="Kecamatan"
                      disabled
                      error={!!errors.district}
                      helperText={errors.district?.message as string}
                    />
                  )
                )}
              />
            </Grid>
          </Grid>

          <Box className="flex justify-end gap-4 mt-6">
            {!isEditing ? (
              <Button
                variant="contained"
                onClick={handleEditToggle}
                endIcon={<i className="tabler-edit" />}
              >
                Edit
              </Button>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={handleEditToggle}
                  disabled={isSaving}
                >
                  Batal
                </Button>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={isSaving || subdomainAvailable === false || subdomainChecking}
                  endIcon={<i className="tabler-check" />}
                >
                  {isSaving ? 'Mengupdate...' : 'Update'}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default TokoSaya
