'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'

interface SettingsTabProps {
  expandedAccordion: string
  onAccordionChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void
  pageSettings: any
  onPageSettingsChange: (settings: any) => void
  stores: any[]
  domains: any[]
  pixels: any[]
  loading: any
  errors: string[]
  onPageNameChange: (name: string) => void
  getPreviewUrl: () => string
  getFullPageUrl: () => string
  validateImageFile: (file: File, maxSize?: number) => boolean
  elementOutline: any[]
  renderElementOutline: () => React.ReactNode
  onAddNewSection: () => void
}

export default function SettingsTab({
  expandedAccordion,
  onAccordionChange,
  pageSettings,
  onPageSettingsChange,
  stores,
  domains,
  pixels,
  loading,
  errors,
  onPageNameChange,
  getPreviewUrl,
  getFullPageUrl,
  validateImageFile,
  elementOutline,
  renderElementOutline,
  onAddNewSection
}: SettingsTabProps) {
  return (
    <Box sx={{ mt: 2 }}>
      {/* Website Section - Expanded by default */}
      <Accordion 
        expanded={expandedAccordion === 'website'}
        onChange={onAccordionChange('website')}
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            boxShadow: '0 8px 32px rgba(25, 118, 210, 0.12)'
          }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
          sx={{
            background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(25, 118, 210, 0.02))',
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 64,
            '&.Mui-expanded': {
              minHeight: 64,
              background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08), rgba(25, 118, 210, 0.04))'
            },
            '& .MuiAccordionSummary-content': {
              margin: '16px 0'
            }
          }}
        >
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            color: 'primary.main',
            fontSize: '16px'
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              🌍
            </Box>
            Website Settings
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 5, background: 'rgba(248, 250, 252, 0.5)' }}>
          {/* Error Messages */}
          {errors.length > 0 && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5}}>
            <TextField
              label="Nama Halaman"
              value={pageSettings.pageName}
              onChange={(e) => onPageNameChange(e.target.value)}
              size="small"
              fullWidth
              helperText="Nama akan otomatis membuat slug URL"
              disabled={loading.pageData}
              InputProps={{
                endAdornment: loading.pageData ? <CircularProgress size={20} /> : null
              }}
              sx={{
                mb: 0,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.9)'
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                  }
                },
                '& .MuiFormHelperText-root': {
                  fontSize: '10px',
                  color: 'text.secondary',
                },
              }}
            />
            <Box sx={{ mb: 1 }}>
              <TextField
                label="Slug URL"
                value={pageSettings.slugUrl}
                onChange={(e) => onPageSettingsChange({...pageSettings, slugUrl: e.target.value})}
                size="small"
                fullWidth
                helperText={getPreviewUrl()}
                disabled={loading.pageData}
                InputProps={{
                  endAdornment: loading.pageData ? <CircularProgress size={20} /> : null
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    background: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.9)'
                    },
                    '&.Mui-focused': {
                      background: 'rgba(255, 255, 255, 1)',
                      boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                    }
                  },
                  '& .MuiFormHelperText-root': {
                    fontSize: '10px',
                    color: 'text.secondary',
                  },
                }}
              />
            </Box>
            <FormControl fullWidth size="small" sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                }
              }
            }}>
              <InputLabel>Pilih Toko</InputLabel>
              <Select
                value={pageSettings.selectedStore}
                onChange={(e) => {
                  const storeUuid = e.target.value
                  onPageSettingsChange({...pageSettings, selectedStore: storeUuid, selectedDomain: ''})
                }}
                label="Pilih Toko"
                disabled={loading.stores}
                startAdornment={loading.stores ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
                sx={{ mb: 1 }}
              >
                <MenuItem value="">
                  <em>{loading.stores ? 'Loading stores...' : 'Pilih Toko'}</em>
                </MenuItem>
                {stores.map((store) => (
                  <MenuItem key={store.uuid} value={store.uuid}>
                    {store.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                }
              }
            }}>
              <InputLabel>Pilih Domain</InputLabel>
              <Select
                value={pageSettings.selectedDomain}
                onChange={(e) => onPageSettingsChange({...pageSettings, selectedDomain: e.target.value})}
                label="Pilih Domain"
                disabled={!pageSettings.selectedStore || loading.domains}
                startAdornment={loading.domains ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              >
                <MenuItem value="">
                  <em>{loading.domains ? 'Loading domains...' : (!pageSettings.selectedStore ? 'Pilih toko terlebih dahulu' : 'Pilih Domain')}</em>
                </MenuItem>
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {domain.domain ? '🌐 ' + domain.domain : '🔗 ' + domain.subdomain + '.aidareu.com'}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              mt: 3,
              mb: 2
            }}>
              <Box sx={{
                p: 4,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.02), rgba(25, 118, 210, 0.01))',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                minHeight: 200,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                '&:hover': {
                  borderColor: 'primary.main',
                  background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05), rgba(25, 118, 210, 0.02))',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 20px rgba(25, 118, 210, 0.15)'
                }
              }}>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  🎨 Upload Favicon
                </Typography>
                <Button 
                  variant="outlined" 
                  component="label" 
                  size="small" 
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    py: 1.5,
                    background: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 1)',
                      borderColor: 'primary.main',
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  Choose Favicon
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && validateImageFile(file, 1)) {
                        onPageSettingsChange({...pageSettings, favicon: file})
                      }
                    }}
                  />
                </Button>
                {pageSettings.favicon && (
                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }}>
                      <img 
                        src={URL.createObjectURL(pageSettings.favicon)}
                        alt="Favicon Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    <Chip 
                      label={pageSettings.favicon.name} 
                      size="small" 
                      sx={{ 
                        background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                        color: 'primary.dark',
                        fontWeight: 500,
                        '& .MuiChip-label': {
                          fontSize: '11px'
                        }
                      }} 
                    />
                  </Box>
                )}
              </Box>
              <Box sx={{
                p: 4,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.02), rgba(76, 175, 80, 0.01))',
                textAlign: 'center',
                transition: 'all 0.3s ease',
                minHeight: 200,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                '&:hover': {
                  borderColor: 'success.main',
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(76, 175, 80, 0.02))',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 20px rgba(76, 175, 80, 0.15)'
                }
              }}>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  🎨 Upload Logo
                </Typography>
                <Button 
                  variant="outlined" 
                  component="label" 
                  size="small" 
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    py: 1.5,
                    borderColor: 'success.main',
                    color: 'success.main',
                    background: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 1)',
                      borderColor: 'success.dark',
                      transform: 'scale(1.02)'
                    }
                  }}
                >
                  Choose Logo
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file && validateImageFile(file, 5)) {
                        onPageSettingsChange({...pageSettings, logo: file})
                      }
                    }}
                  />
                </Button>
                {pageSettings.logo && (
                  <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Box sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: 'success.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.9)'
                    }}>
                      <img 
                        src={URL.createObjectURL(pageSettings.logo)}
                        alt="Logo Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                    <Chip 
                      label={pageSettings.logo.name} 
                      size="small" 
                      sx={{ 
                        background: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
                        color: 'success.dark',
                        fontWeight: 500,
                        '& .MuiChip-label': {
                          fontSize: '11px'
                        }
                      }} 
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      {/* SEO Section - Collapsed by default */}
      <Accordion 
        expanded={expandedAccordion === 'seo'}
        onChange={onAccordionChange('seo')}
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            boxShadow: '0 8px 32px rgba(156, 39, 176, 0.12)'
          }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: 'secondary.main' }} />}
          sx={{
            background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05), rgba(156, 39, 176, 0.02))',
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 64,
            '&.Mui-expanded': {
              minHeight: 64,
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.08), rgba(156, 39, 176, 0.04))'
            },
            '& .MuiAccordionSummary-content': {
              margin: '16px 0'
            }
          }}
        >
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            color: 'secondary.main',
            fontSize: '16px'
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              🔍
            </Box>
            SEO Optimization
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, background: 'rgba(248, 250, 252, 0.5)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Judul Tag"
              value={pageSettings.titleTag}
              onChange={(e) =>
                onPageSettingsChange({ ...pageSettings, titleTag: e.target.value })
              }
              size="small"
              fullWidth
              helperText="Judul yang muncul di google search"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.9)',
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)',
                  },
                },
                '& .MuiFormHelperText-root': {
                  fontSize: '10px',
                  color: 'text.secondary',
                },
              }}
            />

            <TextField
              label="Meta Description"
              value={pageSettings.metaDescription}
              onChange={(e) => onPageSettingsChange({...pageSettings, metaDescription: e.target.value})}
              size="small"
              fullWidth
              multiline
              rows={3}
              helperText="Deskripsi yang akan muncul di hasil pencarian"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.9)'
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                  }
                },
                '& .MuiFormHelperText-root': {
                  fontSize: '10px',
                  color: 'text.secondary',
                },
              }}
            />
            <TextField
              label="Keyword Website"
              value={pageSettings.keywords}
              onChange={(e) => onPageSettingsChange({...pageSettings, keywords: e.target.value})}
              size="small"
              fullWidth
              helperText="Pisahkan dengan koma untuk multiple keywords"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.9)'
                  },
                  '&.Mui-focused': {
                    background: 'rgba(255, 255, 255, 1)',
                    boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                  }
                },
                '& .MuiFormHelperText-root': {
                  fontSize: '10px',
                  color: 'text.secondary',
                },
              }}
            />
            
            {/* Meta Image Upload */}
            <Box sx={{
              p: 4,
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.02), rgba(156, 39, 176, 0.01))',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              minHeight: 200,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              '&:hover': {
                borderColor: 'secondary.main',
                background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.05), rgba(156, 39, 176, 0.02))',
                transform: 'translateY(-3px)',
                boxShadow: '0 6px 20px rgba(156, 39, 176, 0.15)'
              }
            }}>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                🖼️ Upload Meta Gambar
              </Typography>
              <Button 
                variant="outlined" 
                component="label" 
                size="small" 
                fullWidth
                sx={{
                  borderRadius: 2,
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  py: 1.5,
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  background: 'rgba(255, 255, 255, 0.8)',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 1)',
                    borderColor: 'secondary.dark',
                    transform: 'scale(1.02)'
                  }
                }}
              >
                Choose Meta Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && validateImageFile(file, 5)) {
                      onPageSettingsChange({...pageSettings, metaImage: file})
                    }
                  }}
                />
              </Button>
              <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary' }}>
                jpg, jpeg, png, webp (Max 5MB)
              </Typography>
              {pageSettings.metaImage && (
                <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 120,
                    height: 80,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'secondary.light',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    <img 
                      src={URL.createObjectURL(pageSettings.metaImage)}
                      alt="Meta Image Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                  <Chip 
                    label={pageSettings.metaImage.name} 
                    size="small" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
                      color: 'secondary.dark',
                      fontWeight: 500,
                      '& .MuiChip-label': {
                        fontSize: '11px'
                      }
                    }} 
                  />
                </Box>
              )}
            </Box>

            {/* Google Search Preview */}
            <Box
              sx={{
                mt: 4,
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              {/* Header Google Search */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  component="img"
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/36px-Google_%22G%22_logo.svg.png"
                  alt="Google"
                  sx={{ width: 18, height: 18, mr: 1 }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: 'text.primary',
                    fontSize: '14px',
                  }}
                >
                  Google Search
                </Typography>
              </Box>

              {/* Preview Box */}
              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  background: '#ffffff',
                }}
              >
                <Typography
                  variant="h6"
                  component="a"
                  sx={{
                    color: '#1a0dab',
                    textDecoration: 'none',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {pageSettings.titleTag || pageSettings.pageName || 'Judul Halaman'}
                </Typography>

                <Typography
                  variant="body2"
                  color="inherit"
                  sx={{ color: 'rgb(5, 107, 171)', fontSize: '11px', mt: 0.5 }}
                >
                  {getFullPageUrl()}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: '#545454', fontSize: '11px', lineHeight: 1.4 }}
                >
                  {pageSettings.metaDescription || 'Deskripsi halaman akan muncul di sini...'}
                </Typography>
              </Box>
            </Box>

            {/* Social Media Preview */}
            <Box
              sx={{
                mt: 3,
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              {/* Header Social Media */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  component="img"
                  src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
                  alt="WhatsApp"
                  sx={{ width: 18, height: 18, mr: 1 }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: 'text.primary', fontSize: '14px' }}
                >
                  Social Media
                </Typography>
              </Box>

              {/* Preview Card */}
              <Box
                sx={{
                  display: 'flex',
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  overflow: 'hidden',
                  background: '#ffffff',
                  maxWidth: 400,
                }}
              >
                {pageSettings.metaImage && (
                  <Box sx={{ width: 120, height: 80, flexShrink: 0 }}>
                    <img
                      src={URL.createObjectURL(pageSettings.metaImage)}
                      alt="Social Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  </Box>
                )}

                <Box
                  sx={{
                    p: 2,
                    flex: 1,
                    minHeight: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '12px',
                      mb: 0.5,
                      lineHeight: 1.2,
                    }}
                  >
                    {pageSettings.titleTag || pageSettings.pageName || 'Judul Halaman'}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontSize: '11px', lineHeight: 1.3 }}
                  >
                    {pageSettings.metaDescription ||
                      'Deskripsi halaman akan muncul di sini...'}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ color: '#00000', fontSize: '11px', mt: 0.5 }}
                  >
                    {getFullPageUrl().replace('https://', '')}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <FormControl fullWidth size="small" sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                }
              }
            }}>
              <InputLabel>Facebook Pixel</InputLabel>
              <Select
                value={pageSettings.facebookPixel}
                onChange={(e) => onPageSettingsChange({...pageSettings, facebookPixel: e.target.value})}
                label="Facebook Pixel"
                disabled={!pageSettings.selectedStore || loading.pixels}
                startAdornment={loading.pixels ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              >
                <MenuItem value="">
                  <em>{loading.pixels ? 'Loading pixels...' : 'Pilih Facebook Pixel'}</em>
                </MenuItem>
                {pixels.filter(p => p.pixel_type === 'facebook_pixel').map((pixel) => (
                  <MenuItem key={pixel.uuid} value={pixel.uuid}>
                    {pixel.nama_pixel || 'Facebook Pixel'} - {pixel.pixel_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                }
              }
            }}>
              <InputLabel>TikTok Pixel</InputLabel>
              <Select
                value={pageSettings.tiktokPixel}
                onChange={(e) => onPageSettingsChange({...pageSettings, tiktokPixel: e.target.value})}
                label="TikTok Pixel"
                disabled={!pageSettings.selectedStore || loading.pixels}
                startAdornment={loading.pixels ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              >
                <MenuItem value="">
                  <em>{loading.pixels ? 'Loading pixels...' : 'Pilih TikTok Pixel'}</em>
                </MenuItem>
                {pixels.filter(p => p.pixel_type === 'tiktok_pixel').map((pixel) => (
                  <MenuItem key={pixel.uuid} value={pixel.uuid}>
                    {pixel.nama_pixel || 'TikTok Pixel'} - {pixel.pixel_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.9)'
                },
                '&.Mui-focused': {
                  background: 'rgba(255, 255, 255, 1)',
                  boxShadow: '0 0 0 3px rgba(156, 39, 176, 0.1)'
                }
              }
            }}>
              <InputLabel>Google Tag Manager</InputLabel>
              <Select
                value={pageSettings.googleTagManager}
                onChange={(e) => onPageSettingsChange({...pageSettings, googleTagManager: e.target.value})}
                label="Google Tag Manager"
                disabled={!pageSettings.selectedStore || loading.pixels}
                startAdornment={loading.pixels ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
              >
                <MenuItem value="">
                  <em>{loading.pixels ? 'Loading pixels...' : 'Pilih Google Tag Manager'}</em>
                </MenuItem>
                {pixels.filter(p => p.pixel_type === 'google_tag_manager').map((pixel) => (
                  <MenuItem key={pixel.uuid} value={pixel.uuid}>
                    {pixel.nama_pixel || 'Google Tag Manager'} - {pixel.pixel_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      {/* Element Outline Section - Collapsed by default */}
      <Accordion 
        expanded={expandedAccordion === 'element'}
        onChange={onAccordionChange('element')}
        sx={{ 
          mb: 3, 
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          '&:before': { display: 'none' },
          '&.Mui-expanded': {
            boxShadow: '0 8px 32px rgba(255, 152, 0, 0.12)'
          }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon sx={{ color: 'warning.main' }} />}
          sx={{
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(255, 152, 0, 0.02))',
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 64,
            '&.Mui-expanded': {
              minHeight: 64,
              background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.08), rgba(255, 152, 0, 0.04))'
            },
            '& .MuiAccordionSummary-content': {
              margin: '16px 0'
            }
          }}
        >
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 700, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5,
            color: 'warning.main',
            fontSize: '16px'
          }}>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}>
              📋
            </Box>
            Element Outline
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3, background: 'rgba(248, 250, 252, 0.5)' }}>
          <Typography variant="body2" sx={{ 
            color: 'text.secondary', 
            mb: 3,
            fontSize: '13px',
            fontStyle: 'italic',
            textAlign: 'center',
            p: 2,
            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05), rgba(255, 152, 0, 0.02))',
            borderRadius: 2,
            border: '1px dashed',
            borderColor: 'warning.light'
          }}>
            🔄 Drag elements to reorder within or between sections
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1, 
            maxHeight: '140vh', 
            overflow: 'auto',
            p: 1,
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider'
          }}>
            {renderElementOutline()}
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              variant="contained"
              size="medium"
              onClick={onAddNewSection}
              sx={{
                background: 'linear-gradient(135deg, #ff9800, #ffb74d)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f57c00, #ff9800)',
                  boxShadow: '0 6px 20px rgba(255, 152, 0, 0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              ➕ Add New Section
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}