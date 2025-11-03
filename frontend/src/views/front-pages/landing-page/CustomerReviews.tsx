// MUI Imports
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Divider from '@mui/material/Divider'

// Third-party Imports
import { useKeenSlider } from 'keen-slider/react'
import classnames from 'classnames'

// Component Imports
import CustomIconButton from '@core/components/mui/IconButton'
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
import AppKeenSlider from '@/libs/styles/AppKeenSlider'

// SVG Imports (kept for testimonial cards)
import HubSpot from '@assets/svg/front-pages/landing-page/HubSpot'
import Pinterest from '@assets/svg/front-pages/landing-page/Pinterest'
import Dribbble from '@assets/svg/front-pages/landing-page/Dribbble'
import Airbnb from '@assets/svg/front-pages/landing-page/Airbnb'
import Coinbase from '@assets/svg/front-pages/landing-page/Coinbase'
import Netflix from '@assets/svg/front-pages/landing-page/Netflix'

// Client logos data
const clientLogos = [
  { name: 'AyoBerAKSI', src: '/images/client/AyoBerAKSI.png', alt: 'AyoBerAKSI' },
  { name: 'BISA', src: '/images/client/Logo BISA.png', alt: 'BISA' },
  { name: 'Telkom', src: '/images/client/telkom.png', alt: 'Telkom Indonesia' },
  { name: 'Infranexia', src: '/images/client/Infranexia.png', alt: 'Infranexia' },
  { name: 'Danantara', src: '/images/client/Danantara.png', alt: 'Danantara' },
  { name: 'Asahsikecil', src: '/images/client/Asahsikecil.png', alt: 'Asahsikecil' }
]

// Styles Imports
import frontCommonStyles from '@views/front-pages/styles.module.css'
import styles from './styles.module.css'

// React Imports
import { useEffect, useRef } from 'react'

// Hook Imports
import { useIntersection } from '@/hooks/useIntersection'

// Data
const data = [
  {
    desc: 'Dalam 2 bulan, omset toko online saya naik 300%! Platform ini lengkap banget, dari website sampai belajar marketing. Calista AI-nya juga membantu banget kasih ide konten jualan.',
    svg: <Pinterest color='#ee7676' />,
    rating: 5,
    name: 'Ibu Sari Dewi',
    position: 'Pemilik Toko Oleh-oleh Khas Bandung',
    avatarSrc: '/images/avatars/1.png'
  },
  {
    desc: 'Saya yang gaptek IT bisa bikin website toko sendiri dalam 10 menit! Domain gratis, template profesional, dan manajemen order yang mudah. Sekarang saya fokus jualan, bukan pusing urusan teknis.',
    svg: <Netflix color='#d34c4d' />,
    rating: 5,
    name: 'Bapak Andi Wijaya',
    position: 'Pemilik Kedai Kopi "Kopi Nusantara"',
    avatarSrc: '/images/avatars/2.png'
  },
  {
    desc: 'Learning Center-nya keren! Dari nol sampai bisa bikin copywriting yang menjual. Sekarang produk saya laris karena deskripsi produknya menarik. Makasih AiDareU, benar-benar gratis!',
    svg: <Airbnb color='#FF5A60' />,
    rating: 5,
    name: 'Dina Novita',
    position: 'Pemilik Brand Fashion "Dina Hijab"',
    avatarSrc: '/images/avatars/3.png'
  },
  {
    desc: 'Awalnya ragu platform gratis bisa sekualitas ini. Ternyata fiturnya lengkap, ada AI mentor, produk digital gratis untuk dijual, plus komunitasnya supportif banget. Highly recommended!',
    svg: <Coinbase color='#0199ff' />,
    rating: 5,
    name: 'Muhammad Rizki',
    position: 'Reseller Produk Digital',
    avatarSrc: '/images/avatars/4.png'
  },
  {
    desc: 'Dashboard manajemen ordernya real-time dan mudah dipahami. Customer saya juga bilang websitenya profesional. Padahal saya buat sendiri tanpa programmer. Value banget!',
    svg: <Dribbble color='#ea4c89' />,
    rating: 5,
    name: 'Linda Kusuma',
    position: 'Owner Toko Aksesoris Handmade',
    avatarSrc: '/images/avatars/5.png'
  },
  {
    desc: 'Calista AI seperti punya mentor bisnis pribadi 24/7. Setiap kali bingung strategi marketing atau mau bikin promo, tinggal tanya dan langsung dapat solusi. Game changer!',
    svg: <Pinterest color='#ee7676' />,
    rating: 5,
    name: 'Rudi Hartono',
    position: 'Entrepreneur Produk Kesehatan',
    avatarSrc: '/images/avatars/6.png'
  },
  {
    desc: 'Berkat platform ini, UMKM kami bisa go digital tanpa biaya mahal. Website profesional, gratis domain, dan dapat ilmu marketing lengkap. Omset naik 250% dalam 3 bulan!',
    svg: <HubSpot color='#FF5C35' />,
    rating: 5,
    name: 'Hendra Gunawan',
    position: 'Owner Warung Makan Padang "Sederhana"',
    avatarSrc: '/images/avatars/7.png'
  },
  {
    desc: 'Komunitasnya sangat membantu! Setiap ada kendala langsung dapat masukan dari sesama entrepreneur. Plus materinya up-to-date dengan tren marketing terkini.',
    svg: <Airbnb color='#FF5A60' />,
    rating: 5,
    name: 'Fitri Rahmawati',
    position: 'Pemilik Toko Skincare Online',
    avatarSrc: '/images/avatars/8.png'
  },
  {
    desc: 'Platform terlengkap untuk UMKM! Dari bikin website, kelola produk, belajar jualan, sampai dapat produk digital gratis untuk dijual. Semua ada di satu tempat dan 100% gratis!',
    svg: <Coinbase color='#0199ff' />,
    rating: 5,
    name: 'Agus Setiawan',
    position: 'Distributor Produk Pertanian',
    avatarSrc: '/images/avatars/9.png'
  },
  {
    desc: 'Saya kaget domain gratis beneran dikasih! Website juga langsung jadi dan SEO-friendly. Sekarang toko online saya muncul di Google halaman 1. Thanks AiDareU!',
    svg: <Dribbble color='#ea4c89' />,
    rating: 5,
    name: 'Novi Anggraini',
    position: 'Owner Brand Tas Lokal "Nova Bag"',
    avatarSrc: '/images/avatars/10.png'
  }
]

const CustomerReviews = () => {
  // Refs
  const skipIntersection = useRef(true)
  const ref = useRef<null | HTMLDivElement>(null)

  // Hooks
  const { updateIntersections } = useIntersection()
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      slides: {
        perView: 3,
        origin: 'auto'
      },
      breakpoints: {
        '(max-width: 1200px)': {
          slides: {
            perView: 2,
            spacing: 10,
            origin: 'auto'
          }
        },
        '(max-width: 900px)': {
          slides: {
            perView: 2,
            spacing: 10
          }
        },
        '(max-width: 600px)': {
          slides: {
            perView: 1,
            spacing: 10,
            origin: 'center'
          }
        }
      }
    },
    [
      slider => {
        let timeout: ReturnType<typeof setTimeout>
        const mouseOver = false

        function clearNextTimeout() {
          clearTimeout(timeout)
        }

        function nextTimeout() {
          clearTimeout(timeout)
          if (mouseOver) return
          timeout = setTimeout(() => {
            slider.next()
          }, 2000)
        }

        slider.on('created', nextTimeout)
        slider.on('dragStarted', clearNextTimeout)
        slider.on('animationEnded', nextTimeout)
        slider.on('updated', nextTimeout)
      }
    ]
  )

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
    <section id='testimonials' ref={ref} className={classnames('flex flex-col gap-8 bg-backgroundDefault', styles.sectionStartRadius)}>
      <div
        className={classnames('flex max-md:flex-col max-sm:flex-wrap is-full gap-6', frontCommonStyles.layoutSpacing)}
      >
        <div className='flex flex-col gap-1 bs-full justify-center items-center lg:items-start is-full md:is-[30%] mlb-auto sm:pbs-2'>
          <Chip label='Success Stories' variant='tonal' color='primary' size='small' className='mbe-3' />
          <div className='flex flex-col gap-y-1 flex-wrap max-lg:text-center '>
            <Typography color='text.primary' variant='h4'>
              <span className='relative z-[1] font-extrabold'>
                Mereka Sukses,
                <img
                  src='/images/front-pages/landing-page/bg-shape.png'
                  alt='bg-shape'
                  className='absolute block-end-0 z-[1] bs-[40%] is-[132%] inline-start-[-8%] block-start-[17px]'
                />
              </span>{' '}
              Giliran Anda!
            </Typography>
            <Typography className='text-lg font-medium'>500+ UMKM naik kelas. Omset naik, bisnis berkembang pesat!</Typography>
          </div>
          <div className='flex gap-x-4 mbs-11'>
            <CustomIconButton color='primary' variant='tonal' onClick={() => instanceRef.current?.prev()}>
              <i className='tabler-chevron-left' />
            </CustomIconButton>
            <CustomIconButton color='primary' variant='tonal' onClick={() => instanceRef.current?.next()}>
              <i className='tabler-chevron-right' />
            </CustomIconButton>
          </div>
        </div>
        <div className='is-full md:is-[70%]'>
          <AppKeenSlider>
            <div ref={sliderRef} className='keen-slider mbe-6'>
              {data.map((item, index) => (
                <div key={index} className='keen-slider__slide flex p-4 sm:p-3'>
                  <Card elevation={8} className='flex items-start'>
                    <CardContent className='p-8 items-center mlb-auto'>
                      <div className='flex flex-col gap-4 items-start'>
                        <Typography>{item.desc}</Typography>
                        <Rating value={item.rating} readOnly />
                        <div className='flex items-center gap-x-3'>
                          {/* <CustomAvatar size={32} src={item.avatarSrc} alt={item.name} /> */}
                          <div className='flex flex-col items-start'>
                            <Typography color='text.primary' className='font-medium'>
                              {item.name}
                            </Typography>
                            <Typography variant='body2' color='text.disabled'>
                              {item.position}
                            </Typography>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </AppKeenSlider>
        </div>
      </div>
      <Divider />
      <div className='flex flex-wrap items-center justify-center gap-x-8 sm:gap-x-10 md:gap-x-12 gap-y-6 py-8'>
        {clientLogos.map((client, index) => (
          <div
            key={index}
            className='flex items-center justify-center grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300'
          >
            <img
              src={client.src}
              alt={client.alt}
              className='h-8 sm:h-10 md:h-12 object-contain w-auto'
              style={{ maxWidth: '100px', maxHeight: '48px' }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default CustomerReviews
