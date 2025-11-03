'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { useTheme } from '@mui/material/styles'
import { useImageVariant } from '@core/hooks/useImageVariant'
import classnames from 'classnames'
import CustomTextField from '@core/components/mui/TextField'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import AlertTitle from '@mui/material/AlertTitle';

// Types
interface LandingPageData {
	id: string | number
	uuid?: string
	slug: string
	name: string
	updatedAt: string
	thumbnail?: string
	data?: any
}

interface SnackbarState {
	open: boolean
	message: string
	severity: 'success' | 'error' | 'warning' | 'info'
}

const LandingPage = () => {
	// Custom auth state using localStorage
	const [authToken, setAuthToken] = useState<string | null>(null)
	const [userData, setUserData] = useState<any>(null)
	const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
	
	// States
	const [searchValue, setSearchValue] = useState('')
	const [addMenuEl, setAddMenuEl] = useState<null | HTMLElement>(null)
	const [openGen, setOpenGen] = useState(false)
	const [storeName, setStoreName] = useState('')
	const [storeDescription, setStoreDescription] = useState('')
	const [isGenerating, setIsGenerating] = useState(false)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)
	const [landingPages, setLandingPages] = useState<LandingPageData[]>([])
	const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
	const [selectedLandingPage, setSelectedLandingPage] = useState<LandingPageData | null>(null)
	const [snackbar, setSnackbar] = useState<SnackbarState>({
		open: false,
		message: '',
		severity: 'success'
	})
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [loadError, setLoadError] = useState<string | null>(null)
	const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
	const [showLoadingPopup, setShowLoadingPopup] = useState(false)
	const [loadingProgress, setLoadingProgress] = useState(0)

	// Constants
	const lightIllustration = '/images/illustrations/auth/v2-register-light-border.png'
	const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
	const theme = useTheme()
	const leftIllustration = useImageVariant('system', lightIllustration, darkIllustration)

	// Helper function to create thumbnail
	const createThumbnail = (item: any): string => {
		if (item.data?.html) {
			const htmlContent = `
				<!DOCTYPE html>
				<html>
					<head>
						<meta charset="utf-8"/>
						<meta name="viewport" content="width=device-width, initial-scale=1"/>
						<style>
							body { 
								margin: 0; 
								padding: 0; 
								font-family: -apple-system, BlinkMacSystemFont, sans-serif;
								background: #fff;
							}
							${item.data?.css || ''}
						</style>
					</head>
					<body>
						${item.data.html}
					</body>
				</html>
			`
			const blob = new Blob([htmlContent], { type: 'text/html' })
			return URL.createObjectURL(blob)
		} else if (item.data?.sections) {
			const heroSection = item.data.sections.find((s: any) => s.type === 'hero')
			if (heroSection) {
				if (heroSection.image) return heroSection.image
				if (heroSection.title) {
					const colors = ['#ef0e43', '#fa4f24', '#3b82f24', '#10b981', '#f59e0b', '#8b5cf6']
					const colorIndex = heroSection.title.length % colors.length
					return `data:image/svg+xml,${encodeURIComponent(`
						<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
							<rect width="300" height="200" fill="${colors[colorIndex]}"/>
							<text x="150" y="100" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${heroSection.title.substring(0, 20)}</text>
						</svg>
					`)}`
				}
			}
		}
		return '/images/apps/academy/9.png'
	}

	// Helper function to map API response
	const mapLandingPages = (json: any[]): LandingPageData[] => {
		return json.map((item: any) => {
			const heroTitle = item.data?.sections?.find((s: any) => s.type === 'hero')?.title
			return {
				id: item.id,
				uuid: item.uuid,
				slug: item.slug,
				name: heroTitle || item.slug,
				updatedAt: new Date(item.updated_at).toLocaleDateString(),
				thumbnail: createThumbnail(item),
				data: item.data
			}
		})
	}

	// Handlers
	const handleOpenAddMenu = (event: React.MouseEvent<HTMLElement>) => setAddMenuEl(event.currentTarget)
	const handleCloseAddMenu = () => setAddMenuEl(null)
	const handleAddBlank = async () => {
		handleCloseAddMenu()

		try {
			if (!process.env.NEXT_PUBLIC_API_URL) {
				throw new Error('API URL tidak dikonfigurasi')
			}

			const headers: any = {
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
			headers['Authorization'] = `Bearer ${authToken}`

			// Create blank website with default title
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing`, {
				method: 'POST',
				credentials: 'include',
				headers,
				body: JSON.stringify({
					name: 'New Website',
					data: {
						html: '<div style="text-align: center; padding: 40px; color: #6b7280; border: 2px dashed #e0e0e0; border-radius: 8px; margin: 20px;" class="editor-component" data-component-type="container"><h2>Welcome to your new website</h2><p>Start editing by clicking elements or adding components from the sidebar</p></div>',
						css: 'body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }',
						sections: []
					}
				})
			})

			if (!res.ok) {
				throw new Error(`Failed to create blank website (${res.status})`)
			}

			const data = await res.json()

			// Navigate to editor with the new website ID
			window.location.href = `/pages/landing/${data.uuid || data.id}`

		} catch (error: any) {
			console.error('Error creating blank website:', error)
			setSnackbar({
				open: true,
				message: `Gagal membuat website blank: ${error?.message || 'Unknown error'}`,
				severity: 'error'
			})
		}
	}
	const handleAddByAI = () => {
		handleCloseAddMenu()
		setStoreName('')
		setStoreDescription(searchValue)
		setOpenGen(true)
	}

	const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, landingPage: LandingPageData) => {
		setMenuAnchorEl(event.currentTarget)
		setSelectedLandingPage(landingPage)
	}

	const handleCloseMenu = (event?: {} | boolean, reason?: 'backdropClick' | 'escapeKeyDown') => {
		setMenuAnchorEl(null)
		
		// If called with boolean (our custom usage), use that value.
		// If called with event object (from MUI Menu), default to false (do not keep selection).
		const keepSelection = typeof event === 'boolean' ? event : false
		
		if (!keepSelection) {
			setSelectedLandingPage(null)
		}
	}

	const handleDuplicate = () => {
		if (!selectedLandingPage) {
			setSnackbar({
				open: true,
				message: 'Tidak ada landing page yang dipilih',
				severity: 'error'
			})
			return
		}
		setDuplicateDialogOpen(true)
	}

	const handleDelete = () => {
		if (!selectedLandingPage) {
			setSnackbar({
				open: true,
				message: 'Tidak ada landing page yang dipilih',
				severity: 'error'
			})
			return
		}
		setDeleteDialogOpen(true)
	}

	const confirmDuplicate = async () => {
		if (!selectedLandingPage) return
		
		try {
			if (!process.env.NEXT_PUBLIC_API_URL) {
				throw new Error('API URL tidak dikonfigurasi')
			}
			
			const headers: any = { 
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
			headers['Authorization'] = `Bearer ${authToken}`
			
			let res: Response | null = null
			
			// Try UUID endpoint first
			if (selectedLandingPage.uuid) {
				res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing/uuid/${selectedLandingPage.uuid}/duplicate`, {
					method: 'POST',
					credentials: 'include',
					headers
				})
			}
			
			// Fallback to ID endpoint
			if (!res || !res.ok) {
				res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing/${selectedLandingPage.id}/duplicate`, {
					method: 'POST',
					credentials: 'include',
					headers
				})
			}
			
			if (!res.ok) {
				// Create local duplicate as fallback
				const duplicatedPage: LandingPageData = {
					id: `copy-${Date.now()}`,
					slug: `${selectedLandingPage.slug}-copy`,
					name: `${selectedLandingPage.name} (Copy)`,
					updatedAt: new Date().toLocaleDateString(),
					thumbnail: selectedLandingPage.thumbnail,
					data: selectedLandingPage.data
				}
				
				setLandingPages(prev => [duplicatedPage, ...prev])
				setSnackbar({
					open: true,
					message: `Landing page "${selectedLandingPage.name}" berhasil di-duplicate (local copy)!`,
					severity: 'success'
				})
			} else {
				const duplicatedData = await res.json()
				const duplicatedPage: LandingPageData = {
					id: duplicatedData.id || `copy-${Date.now()}`,
					uuid: duplicatedData.uuid,
					slug: duplicatedData.slug || `${selectedLandingPage.slug}-copy`,
					name: `${selectedLandingPage.name} (Copy)`,
					updatedAt: new Date().toLocaleDateString(),
					thumbnail: selectedLandingPage.thumbnail,
					data: duplicatedData.data || selectedLandingPage.data
				}
				
				setLandingPages(prev => [duplicatedPage, ...prev])
				setSnackbar({
					open: true,
					message: `Landing page "${selectedLandingPage.name}" berhasil di-duplicate!`,
					severity: 'success'
				})
			}
			
			setDuplicateDialogOpen(false)
			setSelectedLandingPage(null)
			
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: `Gagal duplicate landing page: ${error?.message || 'Unknown error'}`,
				severity: 'error'
			})
		}
	}

	const confirmDelete = async () => {
		if (!selectedLandingPage) return
		
		try {
			if (!process.env.NEXT_PUBLIC_API_URL) {
				throw new Error('API URL tidak dikonfigurasi')
			}
			
			const headers: any = { 
				'Accept': 'application/json',
				'Content-Type': 'application/json'
			}
			headers['Authorization'] = `Bearer ${authToken}`
			
			let res: Response | null = null
			
			// Try UUID endpoint first
			if (selectedLandingPage.uuid) {
				res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing/uuid/${selectedLandingPage.uuid}`, {
					method: 'DELETE',
					credentials: 'include',
					headers
				})
			}
			
			// Fallback to ID endpoint
			if (!res || !res.ok) {
				res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing/${selectedLandingPage.id}`, {
					method: 'DELETE',
					credentials: 'include',
					headers
				})
			}
			
			// Remove from local state
			setLandingPages(prev => prev.filter(page => (page.uuid || page.id) !== (selectedLandingPage.uuid || selectedLandingPage.id)))
			
			setSnackbar({
				open: true,
				message: `Landing page "${selectedLandingPage.name}" berhasil dihapus!`,
				severity: 'success'
			})
			
			setDeleteDialogOpen(false)
			setSelectedLandingPage(null)
			
		} catch (error: any) {
			setSnackbar({
				open: true,
				message: `Gagal menghapus landing page: ${error?.message || 'Unknown error'}`,
				severity: 'error'
			})
		}
	}

	const handleCloseSnackbar = () => setSnackbar(prev => ({ ...prev, open: false }))

	const handleRefresh = async () => {
		setIsLoading(true)
		setLoadError(null)
		
		try {
			if (!process.env.NEXT_PUBLIC_API_URL) {
				setLoadError('API URL tidak dikonfigurasi')
				return
			}
			
			const headers: any = { 'Accept': 'application/json' }
			headers['Authorization'] = `Bearer ${authToken}`
			
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing`, { 
				credentials: 'include', 
				headers 
			})
			
			if (!res.ok) {
				if (res.status === 401) {
					setLoadError('Sesi Anda telah berakhir. Silakan login kembali.')
				} else {
					setLoadError(`Gagal memuat data (${res.status})`)
				}
				return
			}
			
			const json = await res.json()
			const mapped = mapLandingPages(json)
			
			setLandingPages(mapped)
			setHasLoadedOnce(true)
			
			setSnackbar({
				open: true,
				message: `Berhasil refresh data! ${mapped.length} landing page ditemukan.`,
				severity: 'success'
			})
			
		} catch (error) {
			setLoadError('Gagal refresh data. Silakan coba lagi.')
		} finally {
			setIsLoading(false)
		}
	}

	const handleGenerate = async () => {
		setIsGenerating(true)
		setErrorMsg(null)
		setShowLoadingPopup(true)
		setLoadingProgress(0)
		
		// Simulate loading progress
		const progressInterval = setInterval(() => {
			setLoadingProgress(prev => {
				if (prev >= 90) return prev
				return prev + Math.random() * 15
			})
		}, 800)
		
		try {
			if (!process.env.NEXT_PUBLIC_API_URL) throw new Error('API URL not configured')
			
			const headers: any = { 
				'Content-Type': 'application/json', 
				'Accept': 'application/json',
				'X-Requested-With': 'XMLHttpRequest'
			}
			headers['Authorization'] = `Bearer ${authToken}`
			
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate-landing`, {
				method: 'POST',
				headers,
				credentials: 'include',
				body: JSON.stringify({
					store_name: storeName,
					store_description: storeDescription
				})
			})
			
			if (!res.ok) {
				const j = await res.json().catch(() => ({}))
				throw new Error(j.message || 'Failed to generate')
			}
			
			const data = await res.json()

			// Get UUID from backend
			let generatedUuid: string | undefined
			try {
				const detailsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing/slug/${data.slug}`, {
					credentials: 'include',
					headers
				})
				if (detailsRes.ok) {
					const full = await detailsRes.json()
					generatedUuid = full.uuid
				}
			} catch (_) {}

			// Add to list
			const heroSection = data.data?.sections?.find((s: any) => s.type === 'hero')
			const thumbnail = heroSection?.image || `data:image/svg+xml,${encodeURIComponent(`
				<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
					<rect width="300" height="200" fill="#ef0e43"/>
					<text x="150" y="100" font-family="Arial, sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${heroSection?.title?.substring(0, 20) || 'New Website'}
				</svg>
			`)}`
			
			setLandingPages(prev => [{ 
				id: data.id, 
				uuid: generatedUuid,
				slug: data.slug, 
				name: heroSection?.title || data.slug, 
				updatedAt: new Date().toLocaleDateString(),
				thumbnail,
				data: data.data
			}, ...prev])
			
			// Complete loading
			setLoadingProgress(100)
			clearInterval(progressInterval)
			
			// Show success message briefly before redirecting
			setTimeout(() => {
				setShowLoadingPopup(false)
				setOpenGen(false)
				window.location.href = `/pages/landing/${generatedUuid || data.id}`
			}, 1000)
			
		} catch (err: any) {
			clearInterval(progressInterval)
			setShowLoadingPopup(false)
			setErrorMsg(err?.message || 'Something went wrong')
		} finally {
			setIsGenerating(false)
		}
	}

	// Effects
	useEffect(() => {
		// Load auth data from localStorage
		const token = localStorage.getItem('auth_token')
		const user = localStorage.getItem('user_data')
		
		console.log('Landing Page: Loading auth data', { hasToken: !!token, hasUser: !!user })
		
		if (token && user) {
			try {
				setAuthToken(token)
				setUserData(JSON.parse(user))
				setAuthStatus('authenticated')
				console.log('Landing Page: Auth loaded successfully')
			} catch (error) {
				console.error('Landing Page: Error parsing user data:', error)
				setAuthStatus('unauthenticated')
			}
		} else {
			setAuthStatus('unauthenticated')
		}
	}, [])
	
	useEffect(() => {
		if (deleteDialogOpen || duplicateDialogOpen) {
			handleCloseMenu(true)
		}
	}, [deleteDialogOpen, duplicateDialogOpen])

	useEffect(() => {
		if (authStatus === 'loading') return
		
		if (authStatus === 'authenticated' && authToken && !hasLoadedOnce) {
			const loadList = async () => {
				try {
					setIsLoading(true)
					setLoadError(null)
					
					if (!process.env.NEXT_PUBLIC_API_URL) {
						setLoadError('API URL tidak dikonfigurasi')
						return
					}
					
					const headers: any = { 
						'Accept': 'application/json',
						'Authorization': `Bearer ${authToken}`
					}
					
					const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/landing`, { 
						credentials: 'include', 
						headers 
					})
					
					if (!res.ok) {
						if (res.status === 401) {
							setLoadError('Sesi Anda telah berakhir. Silakan login kembali.')
							setSnackbar({
								open: true,
								message: 'Sesi Anda telah berakhir. Silakan login kembali.',
								severity: 'warning'
							})
						} else {
							setLoadError(`Gagal memuat data (${res.status})`)
						}
						return
					}
					
					const json = await res.json()
					const mapped = mapLandingPages(json)
					
					setLandingPages(mapped)
					setHasLoadedOnce(true)
					
					if (mapped.length > 0) {
						setSnackbar({
							open: true,
							message: `Berhasil memuat ${mapped.length} landing page`,
							severity: 'success'
						})
					}
					
				} catch (error) {
					setLoadError('Gagal memuat landing pages. Silakan refresh halaman.')
					setSnackbar({
						open: true,
						message: 'Gagal memuat landing pages. Silakan refresh halaman.',
						severity: 'error'
					})
				} finally {
					setIsLoading(false)
				}
			}
			
			loadList()
		} else if (authStatus === 'unauthenticated') {
			setIsLoading(false)
			setLoadError('Silakan login untuk melihat landing pages Anda')
			setLandingPages([])
			setHasLoadedOnce(false)
		}
	}, [authStatus, authToken, hasLoadedOnce])

	return (
		<Container maxWidth={false} className='py-8 px-4'>
			{/* Hero Section */}
			<Card
				className='relative overflow-hidden'
				sx={{
					borderRadius: 4,
					border: '1px solid',
					borderColor: 'divider',
					boxShadow: '0 12px 30px rgba(0,0,0,0.08)'
				}}
			>
				<img src={leftIllustration} className='max-md:hidden absolute max-is-[200px] top-9 start-10 opacity-90' />

				<Box className='relative flex flex-col items-center gap-6 p-10 md:p-14'>
					<Chip
						label='✨ AI Website Builder'
						variant='outlined'
						sx={{ borderRadius: 8, fontWeight: 600, color: 'primary.main', borderColor: 'primary.main', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',boxShadow: '0 3px 20px rgba(255, 132, 132, 0.25)' }}
					/>
					<Typography
						variant='h3'
						className='text-center leading-snug'
						sx={{ fontWeight: 800, fontSize: { xs: '1.9rem', md: '2.6rem' } }}
					>
						Buat website tokomu dalam <br/> hitungan menit dengan{' '}
						<Box
							component='span'
							sx={{
								ml: 0.5,
								background: 'linear-gradient(90deg, #ef0e43, #fa4f24)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								textShadow: '0 8px 20px rgba(255, 132, 132, 0.25)',
								zIndex: 0,
								position: 'relative',
							}}
						>
							Calista AI
							<Box sx={{ position: 'absolute', bottom: -6, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #ef0e43, #fa4f24)', opacity: 0.25, borderRadius: 2 }} />
						</Box>
					</Typography>
					<Typography className='text-center text-[0.98rem] text-textSecondary md:is-3/4'>
						Cukup tuliskan deskripsi produk atau ide bisnismu — Calista AI akan otomatis membuat struktur halaman, <br/> teks copywriting, dan elemen visual yang siap dipublikasikan.
					</Typography>
					<Box className='w-full md:is-3/4'>
						<Box className='flex gap-4 w-full max-sm:flex-col items-stretch' sx={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderRadius: 3, p: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
							<CustomTextField
								fullWidth
								placeholder='Tulis Nama Toko + deskripsi singkat (mis. Kedai Kopi Bahagia — kopi susu kekinian, biji roasted sendiri)'
								value={searchValue}
								multiline
								minRows={4}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
								sx={{
									'& .MuiOutlinedInput-root': {
										borderRadius: 2,
										fontSize: '1rem',
										background: 'transparent',
										'& fieldset': { border: 'none' },
										'&.Mui-focused fieldset': { border: '2px solid', borderColor: 'primary.main' },
									},
								}}
							/>
							<Button
								variant='contained'
								size='large'
								className='max-sm:w-full shrink-0 self-start'
								onClick={handleAddByAI}
								disabled={isGenerating}
								sx={{
									fontWeight: 600,
									minHeight: '56px',
									px: 4,
									mt:6,
									py: 1.5,
									background: 'linear-gradient(135deg, #ef0e43, #fa4f24)',
									boxShadow: '0 8px 20px rgba(99, 102, 241, 0.25)',
									transition: 'all 0.2s ease',
									whiteSpace: 'nowrap',
									'&:hover': { background: 'linear-gradient(135deg, #ef0e43, #fa4f24)', transform: 'translateY(-1px)' },
									'&:disabled': { 
										background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
										transform: 'none'
									}
								}}
							>
								{isGenerating ? (
									<>
										<CircularProgress size={20} sx={{ color: 'white', mr: 1 }} />
										Generating...
									</>
								) : (
									'Create with AI ✨'
								)}
							</Button>
						</Box>
						<Box className='flex flex-wrap gap-2 justify-center mt-5'>
							{['⚡ Instant Generation', '🎨 Professional Design', '📱 Mobile Responsive'].map(feature => (
								<Chip key={feature} label={feature} size='small' variant='outlined' sx={{ borderRadius: 6 }} />
							))}
						</Box>
					</Box>
				</Box>
				<img
					src='/images/apps/academy/9.png'
					className={classnames('max-md:hidden absolute max-bs-[180px] bottom-0 end-0', {
						'scale-x-[-1]': theme.direction === 'rtl'
					})}
					style={{ filter: 'drop-shadow(0 12px 22px rgba(0,0,0,0.15))' }}
				/>
			</Card>

			{/* User Landing Pages List */}
			<Box className='mt-8'>
				<Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
					<CardHeader
						title='Landing Pages'
						subheader='Daftar landing page yang telah kamu buat'
						action={
							<>
								<Tooltip title='Refresh data'>
									<span>
										<IconButton 
											color='primary' 
											onClick={handleRefresh}
											disabled={isLoading}
											sx={{ mr: 1 }}
										>
											<i className='tabler-refresh' />
										</IconButton>
									</span>
								</Tooltip>
								<Button 
									variant="contained" 
									color="primary" 
									onClick={handleOpenAddMenu}
									>
									Tambah Website
									</Button>

									<Menu 
									anchorEl={addMenuEl} 
									open={Boolean(addMenuEl)} 
									onClose={handleCloseAddMenu} 
									keepMounted
									>
									<MenuItem onClick={handleAddBlank}>Add Blank</MenuItem>
									<MenuItem onClick={handleAddByAI}>Add by AI</MenuItem>
									</Menu>

							</>
						}
					/>
					<CardContent>
						{isLoading ? (
							<Box className='flex items-center justify-center py-10'>
								<Box sx={{ textAlign: 'center' }}>
									<CircularProgress size={40} sx={{ mb: 2 }} />
									<Typography color='text.secondary'>Memuat landing pages...</Typography>
								</Box>
							</Box>
						) : loadError ? (
							<Box className='flex items-center justify-center py-10'>
								<Box sx={{ textAlign: 'center' }}>
									<i className='tabler-alert-circle' style={{ fontSize: '48px', color: '#ef5350', marginBottom: '16px' }} />
									<Typography color='error.main' sx={{ mb: 1 }}>Gagal Memuat Data</Typography>
									<Typography color='text.secondary' sx={{ mb: 2 }}>{loadError}</Typography>
									<Button 
										variant='outlined' 
										onClick={handleRefresh}
										startIcon={<i className='tabler-refresh' />}
									>
										Refresh Data
									</Button>
								</Box>
							</Box>
						) : landingPages.length === 0 ? (
							<Box className='flex items-center justify-center text-textSecondary py-10'>
								<Box sx={{ textAlign: 'center' }}>
									<i className='tabler-file-text' style={{ fontSize: '48px', color: '#9e9e9e', marginBottom: '16px' }} />
									<Typography variant='h6' color='text.secondary' sx={{ mb: 1 }}>Belum ada landing page</Typography>
									<Typography color='text.secondary'>Mulai buat landing page pertama Anda dengan AI</Typography>
								</Box>
							</Box>
						) : (
							<Grid container spacing={4}>
								{landingPages.map(item => (
									<Grid item xs={12} sm={6} md={4} key={item.id}>
										<Card variant='outlined' sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
											{/* Thumbnail */}
											<Box sx={{ position: 'relative' }}>
												{item.data?.html ? (
													<iframe
														srcDoc={`
															<!DOCTYPE html>
															<html>
																<head>
																	<meta charset="utf-8"/>
																	<meta name="viewport" content="width=device-width, initial-scale=1"/>
																	<style>
																		body { 
																			margin: 0; 
																			padding: 0; 
																			font-family: -apple-system, BlinkMacSystemFont, sans-serif;
																			background: #fff;
																			transform: scale(0.3);
																			transform-origin: top left;
																			width: 333.33%;
																			height: 333.33%;
																		}
																		${item.data?.css || ''}
																	</style>
																</head>
																<body>
																	${item.data.html}
																</body>
															</html>
														`}
														style={{ 
															width: '100%', 
															height: '200px', 
															border: 'none',
															borderRadius: '8px 8px 0 0',
															background: '#fff'
														}}
														title={`Preview of ${item.name}`}
													/>
												) : (
													<img 
														src={item.thumbnail} 
														alt={item.name}
														style={{ 
															width: '100%', 
															height: '200px', 
															objectFit: 'cover',
															borderRadius: '8px 8px 0 0'
														}} 
													/>
												)}
												
												{/* Three dots menu */}
												<IconButton
													sx={{
														position: 'absolute',
														top: 8,
														right: 8,
														backgroundColor: 'rgba(255, 255, 255, 0.9)',
														'&:hover': {
															backgroundColor: 'rgba(255, 255, 255, 1)'
														}
													}}
													onClick={(e) => handleOpenMenu(e, item)}
												>
													<i className='tabler-dots-vertical' />
												</IconButton>
											</Box>
											
											<CardContent sx={{ pb: 1.5, flex: 1 }}>
												<Typography variant='h6' className='mb-1' sx={{ fontSize: '1rem', fontWeight: 600 }}>
													{item.name}
												</Typography>
												<Typography variant='caption' color='text.secondary'>
													Updated {item.updatedAt}
												</Typography>
											</CardContent>
											
											{/* Full width View button */}
											<CardActions sx={{ p: 2, pt: 0 }}>
												<Button 
													fullWidth 
													variant='outlined' 
													component={Link} 
													href={`/pages/landing/${item.uuid || item.id}`}
													sx={{
														borderColor: 'primary.main',
														color: 'primary.main',
														'&:hover': {
															borderColor: 'primary.dark',
															backgroundColor: 'primary.lighterOpacity'
														}
													}}
												>
													View Website
												</Button>
											</CardActions>
										</Card>
									</Grid>
								))}
							</Grid>
						)}
					</CardContent>
				</Card>
			</Box>

			{/* Landing Page Actions Menu */}
			<Menu 
				anchorEl={menuAnchorEl} 
				open={Boolean(menuAnchorEl)} 
				onClose={handleCloseMenu}
				anchorOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'top',
					horizontal: 'right',
				}}
			>
				<MenuItem 
					onClick={() => {
						handleCloseMenu()
						window.location.href = `/pages/landing/${selectedLandingPage?.uuid || selectedLandingPage?.id}`
					}}
				>
					<i className='tabler-edit' style={{ marginRight: '8px' }} />
					Edit
				</MenuItem>
				<MenuItem onClick={handleDuplicate}>
					<i className='tabler-copy' style={{ marginRight: '8px' }} />
					Duplicate
				</MenuItem>
				<MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
					<i className='tabler-trash' style={{ marginRight: '8px' }} />
					Delete
				</MenuItem>
			</Menu>

			{/* Generate via AI Dialog */}
			<Dialog fullWidth maxWidth='sm' open={openGen} onClose={() => setOpenGen(false)}>
				<DialogTitle>Generate Landing Page dengan AI</DialogTitle>
				<DialogContent className='flex flex-col gap-4 pt-4'>
					<TextField 
					label='Nama Toko/Bisnis' 
					placeholder='Contoh: Kedai Kopi Bahagia'
					fullWidth 
					value={storeName} 
					onChange={e => setStoreName(e.target.value)} 
					autoFocus
				/>
					<TextField 
					label='Deskripsi Singkat' 
					placeholder='Tulis deskripsi singkat toko/bisnis (mis. kopi susu kekinian, biji roasted sendiri, suasana cozy)'
					fullWidth 
					multiline
					rows={4}
					value={storeDescription} 
					onChange={e => setStoreDescription(e.target.value)} 
				/>
					{errorMsg ? <Alert severity='error' sx={{ mt: 1 }}>{errorMsg}</Alert> : null}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenGen(false)} disabled={isGenerating}>Batal</Button>
					<Button 
						variant='contained' 
						onClick={handleGenerate} 
						disabled={isGenerating || !storeName.trim() || !storeDescription.trim()} 
						startIcon={isGenerating ? <CircularProgress size={16} /> : undefined}
						sx={{
							background: 'linear-gradient(135deg, #ef0e43, #fa4f24)',
							'&:hover': {
								background: 'linear-gradient(135deg, #ef0e43, #fa4f24)',
								transform: 'translateY(-1px)'
							},
							'&:disabled': { 
								background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
								transform: 'none'
							}
						}}
					>
						{isGenerating ? 'Generating...' : 'Generate'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog 
				open={deleteDialogOpen} 
				onClose={() => setDeleteDialogOpen(false)}
				maxWidth='xs'
				fullWidth
			>
				<DialogTitle sx={{ 
					display: 'flex', 
					alignItems: 'center', 
					gap: 1,
					color: 'error.main',
					fontWeight: 600
				}}>
					<i className='tabler-alert-triangle' style={{ fontSize: '20px' }} />
					Konfirmasi Hapus
				</DialogTitle>
				<DialogContent>
					<Typography>
						Apakah Anda yakin ingin menghapus landing page <strong>"{selectedLandingPage?.name || 'Unknown'}"</strong>?
					</Typography>
					<Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
						Tindakan ini tidak dapat dibatalkan dan semua data akan hilang secara permanen.
					</Typography>
					{process.env.NODE_ENV === 'development' && (
						<Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '12px' }}>
							Debug: ID: {selectedLandingPage?.id}, Name: {selectedLandingPage?.name}
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ p: 2, pt: 1 }}>
					<Button 
						onClick={() => setDeleteDialogOpen(false)}
						variant='outlined'
						sx={{ borderColor: 'divider' }}
					>
						Batal
					</Button>
					<Button 
						onClick={confirmDelete}
						variant='contained'
						color='error'
						sx={{
							background: 'linear-gradient(135deg, #ef0e43, #fa4f24)',
							'&:hover': {
								background: 'linear-gradient(135deg, #ef0e43, #fa4f24)',
								transform: 'translateY(-1px)'
							}
						}}
					>
						Hapus
					</Button>
				</DialogActions>
			</Dialog>

			{/* Duplicate Confirmation Dialog */}
			<Dialog 
				open={duplicateDialogOpen} 
				onClose={() => setDuplicateDialogOpen(false)}
				maxWidth='xs'
				fullWidth
			>
				<DialogTitle sx={{ 
					display: 'flex', 
					alignItems: 'center', 
					gap: 1,
					color: 'info.main',
					fontWeight: 600
				}}>
					<i className='tabler-copy' style={{ fontSize: '20px' }} />
					Duplicate Landing Page
				</DialogTitle>
				<DialogContent>
					<Typography>
						Apakah Anda yakin ingin duplicate landing page <strong>"{selectedLandingPage?.name || 'Unknown'}"</strong>?
					</Typography>
					<Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
						Landing page baru akan dibuat dengan konten yang sama dan dapat diedit secara terpisah.
					</Typography>
					{process.env.NODE_ENV === 'development' && (
						<Box sx={{ mt: 2, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontSize: '12px' }}>
							Debug: ID: {selectedLandingPage?.id}, Name: {selectedLandingPage?.name}
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ p: 2, pt: 1 }}>
					<Button 
						onClick={() => setDuplicateDialogOpen(false)}
						variant='outlined'
						sx={{ borderColor: 'divider' }}
					>
						Batal
					</Button>
					<Button 
						onClick={confirmDuplicate}
						variant='contained'
						color='primary'
						sx={{
							background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
							'&:hover': {
								background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
								transform: 'translateY(-1px)'
							}
						}}
					>
						Duplicate
					</Button>
				</DialogActions>
			</Dialog>

			{/* Loading Popup */}
			<Dialog
				open={showLoadingPopup}
				maxWidth='sm'
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 4,
						background: '#ffffff',
						boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
						border: '1px solid rgba(0,0,0,0.08)'
					}
				}}
			>
				<DialogContent sx={{ p: 4, textAlign: 'center' }}>
					{/* Header */}
					<Box sx={{ mb: 3 }}>
						<Typography 
							variant='h5' 
							sx={{ 
								fontWeight: 700, 
								color: '#374151',
								mb: 1,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 1
							}}
						>
							Websitemu sedang kami buat...
							<span style={{ color: '#ef4444', fontSize: '1.2rem' }}>✨</span>
						</Typography>
						<Alert 
							severity="warning" 
							variant="outlined" 
							sx={{ 
								backgroundColor: '#FEF9C3', 
								borderColor: '#FCD34D', 
								color: '#6b7280',
								borderRadius: '6px'
							}}
							>
							Mohon tunggu 3-5 menit sampai selesai dibuat 😎🚀.
							</Alert>


					</Box>

					{/* Loading Sections */}
					<Box sx={{ mb: 4 }}>
						{[
							'Navbar', 'Hero', 'Features', 'CTA', 'Harga', 
							'Form Order', 'Testimonial', 'Contact', 'Footer'
						].map((section, index) => (
							<Box
								key={section}
								sx={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									p: 2,
									mb: 1,
									background: '#ffffff',
									border: '2px solid #e5e7eb',
									borderRadius: 3,
									transition: 'all 0.3s ease',
									...(loadingProgress >= (index + 1) * 11.11 ? {
										borderColor: '#10b981',
										background: '#f0fdf4'
									} : {})
								}}
							>
								<Typography sx={{ fontWeight: 500, color: '#374151' }}>
									{section}
								</Typography>
								<Box
									sx={{
										width: 20,
										height: 20,
										border: '2px solid #d1d5db',
										borderRadius: '50%',
										position: 'relative',
										transition: 'all 0.3s ease',
										...(loadingProgress >= (index + 1) * 11.11 ? {
											borderColor: '#10b981',
											background: '#10b981'
										} : {})
									}}
								>
									{loadingProgress >= (index + 1) * 11.11 && (
										<Typography
											sx={{
												position: 'absolute',
												top: '50%',
												left: '50%',
												transform: 'translate(-50%, -50%)',
												color: 'white',
												fontSize: '12px',
												fontWeight: 'bold'
											}}
										>
											✓
										</Typography>
									)}
								</Box>
							</Box>
						))}
					</Box>

					{/* Progress Bar */}
					<Box sx={{ mb: 2 }}>
						<Box
							sx={{
								width: '100%',
								height: 6,
								background: '#e5e7eb',
								borderRadius: 3,
								overflow: 'hidden'
							}}
						>
							<Box
								sx={{
									height: '100%',
									background: 'linear-gradient(90deg, #3b82f6, #10b981)',
									borderRadius: 3,
									transition: 'width 0.5s ease',
									width: `${loadingProgress}%`
								}}
							/>
						</Box>
					</Box>

					{/* Progress Text */}
					<Typography variant='body2' sx={{ color: '#6b7280' }}>
						{loadingProgress < 100 ? `Generating... ${Math.round(loadingProgress)}%` : 'Generation Complete! ✓'}
					</Typography>
				</DialogContent>
			</Dialog>

			{/* Notification Snackbar */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert 
					onClose={handleCloseSnackbar} 
					severity={snackbar.severity}
					variant='filled'
					sx={{ 
						width: '100%',
						'& .MuiAlert-icon': {
							fontSize: '20px'
						}
					}}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Container>
	)
}

export default LandingPage
