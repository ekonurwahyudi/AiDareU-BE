// React Imports
import { useEffect, useRef } from 'react'

// MUI Imports
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import { useIntersection } from '@/hooks/useIntersection'

// SVG Imports
import Paper from '@assets/svg/front-pages/landing-page/Paper'
import Check from '@assets/svg/front-pages/landing-page/Check'
import User from '@assets/svg/front-pages/landing-page/User'
import LaptopCharging from '@assets/svg/front-pages/landing-page/LaptopCharging'
import Rocket from '@assets/svg/front-pages/landing-page/Rocket'
import Document from '@assets/svg/front-pages/landing-page/Document'

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'

// Data
const feature = [
  {
    icon: <LaptopCharging color='var(--mui-palette-primary-main)' />,
    title: 'Website Profesional',
    description: 'Toko online siap pakai, responsif di semua device. Setup 5 menit, langsung jual. Bonus domain gratis!'
  },
  {
    icon: <Rocket color='var(--mui-palette-primary-main)' />,
    title: 'Halaman Pertama Google',
    description: 'Website tokomu otomatis SEO-friendly. Tampil di halaman pertama Google dan mudah ditemukan pelanggan.'
  },
  {
    icon: <Check color='var(--mui-palette-primary-main)' />,
    title: 'WhatsApp Report',
    description: 'Notifikasi otomatis via WhatsApp setiap ada transaksi. Kamu dan pelanggan langsung tahu, gratis!'
  },
  {
    icon: <Paper color='var(--mui-palette-primary-main)' />,
    title: 'Multi Payment Gateway',
    description: 'Terima pembayaran dari transfer bank, e-wallet, kartu kredit, QRIS. Pelanggan lebih mudah bayar!'
  },
  {
    icon: <LaptopCharging color='var(--mui-palette-primary-main)' />,
    title: 'Mobile E-Commerce Ready',
    description: 'Website tokomu perfect di semua gadget. Mobile, tablet, desktop—tampilan tetap menarik dan cepat.'
  },
  {
    icon: <Rocket color='var(--mui-palette-primary-main)' />,
    title: 'Ongkir Otomatis',
    description: 'Ongkos kirim JNE, Pos, Wahana, SiCepat, J&T otomatis tersedia hingga area kecamatan. Akurat!'
  },
  {
    icon: <Document color='var(--mui-palette-primary-main)' />,
    title: 'Banyak Pilihan Theme',
    description: 'Berbagai template keren & mobile-friendly. Ganti-ganti sesukamu, gratis! Bikin toko makin menarik.'
  },
  {
    icon: <User color='var(--mui-palette-primary-main)' />,
    title: 'Calista AI Mentor',
    description: 'AI mentor 24/7 bantu strategi jualan, ide konten, tips marketing. Kayak punya konsultan bisnis pribadi!'
  },
  {
    icon: <Document color='var(--mui-palette-primary-main)' />,
    title: 'Learning Center Pro',
    description: 'Materi lengkap: copywriting, ads, design, SEO. Dari newbie sampai pro. Gratis akses selamanya.'
  },
  {
    icon: <Paper color='var(--mui-palette-primary-main)' />,
    title: 'Produk Digital Siap Jual',
    description: 'Belum punya produk? Ambil produk digital berkualitas dari kami. Langsung jual, tanpa modal!'
  },
  {
    icon: <User color='var(--mui-palette-primary-main)' />,
    title: 'Dashboard All-in-One',
    description: 'Kelola order, stok, customer, iklan dalam 1 tempat. Real-time monitoring. Praktis & efisien.'
  },
  {
    icon: <Check color='var(--mui-palette-primary-main)' />,
    title: 'Komunitas Aktif',
    description: 'Ribuan entrepreneur siap bantu, sharing tips & trik. Support system yang bikin bisnis cepat naik kelas.'
  }
]

const UsefulFeature = () => {
  // Refs
  const skipIntersection = useRef(true)
  const ref = useRef<null | HTMLDivElement>(null)

  // Hooks
  const { updateIntersections } = useIntersection()

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (skipIntersection.current) {
          skipIntersection.current = false

          return
        }

        updateIntersections({ [entry.target.id]: entry.isIntersecting })
      },
      { threshold: 0.35 }
    )

    ref.current && observer.observe(ref.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id='features' ref={ref} className='bg-backgroundPaper'>
      <div className={classnames('flex flex-col gap-12 pbs-12 ', frontCommonStyles.layoutSpacing)}>
        <div className='flex flex-col gap-y-4 items-center justify-center'>
          <Chip size='small' variant='tonal' color='primary' label='Lengkap & Gratis' />
          <div className='flex flex-col items-center gap-y-1 justify-center flex-wrap'>
            <div className='flex items-center gap-x-2'>
              <Typography color='text.primary' variant='h4' className='text-center'>
                <span className='relative z-[1] font-extrabold'>
                  Semua Ada,
                  <img
                    src='/images/front-pages/landing-page/bg-shape.png'
                    alt='bg-shape'
                    className='absolute block-end-0 z-[1] bs-[40%] is-[125%] sm:is-[132%] -inline-start-[13%] sm:inline-start-[-19%] block-start-[17px]'
                  />
                </span>{' '}
                Siap Jualan!
              </Typography>
            </div>
            <Typography className='text-center text-lg font-medium'>
              Tools premium untuk scale up bisnis. 100% gratis, 100% powerful.
            </Typography>
          </div>
        </div>
        <div>
          <Grid container spacing={6}>
            {feature.map((item, index) => (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={index}>
                <div className='flex flex-col gap-3 justify-center items-center p-6 bg-white dark:bg-[#2B2C40] rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-lg hover:shadow-2xl hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 h-full hover:scale-[1.02]'>
                  <div className='p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 rounded-xl shadow-sm'>
                    {item.icon}
                  </div>
                  <Typography className='font-extrabold text-center' variant='h6' color='text.primary'>
                    {item.title}
                  </Typography>
                  <Typography className='text-center text-sm leading-relaxed' color='text.secondary'>
                    {item.description}
                  </Typography>
                </div>
              </Grid>
            ))}
          </Grid>
        </div>
      </div>
    </section>
  )
}

export default UsefulFeature
