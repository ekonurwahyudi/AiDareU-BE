# Landing Pages Table - New Columns Documentation

## Migration: 2025_08_27_143000_add_page_settings_columns_to_landing_pages_table

### Added Columns

| Column Name | Type | Nullable | Description |
|-------------|------|----------|-------------|
| `store_uuid` | UUID | Yes | UUID of the associated store |
| `nama_halaman` | String | Yes | Page name/title |
| `favicon` | String | Yes | Favicon file path |
| `logo` | String | Yes | Logo file path |
| `subdomain` | String | Yes | Subdomain for the landing page |
| `domain` | String | Yes | Custom domain for the landing page |
| `meta_description` | Text | Yes | Meta description for SEO |
| `keywords` | Text | Yes | Website keywords for SEO |
| `facebook_pixel_uuid` | UUID | Yes | Facebook Pixel UUID |
| `tiktok_pixel_uuid` | UUID | Yes | TikTok Pixel UUID |
| `google_tag_manager_uuid` | UUID | Yes | Google Tag Manager UUID |

### Indexes Added
- `store_uuid` - For efficient store lookups
- `subdomain` - For subdomain routing
- `domain` - For custom domain routing

### Model Relationships Added

#### LandingPage Model (app/Models/LandingPage.php)

1. **Store Relationship**
   ```php
   public function store()
   {
       return $this->belongsTo(Store::class, 'store_uuid', 'uuid');
   }
   ```

2. **Pixel Relationships**
   ```php
   public function facebookPixel()
   {
       return $this->belongsTo(PixelStore::class, 'facebook_pixel_uuid', 'uuid')
                  ->where('pixel_type', 'facebook_pixel');
   }
   
   public function tiktokPixel()
   {
       return $this->belongsTo(PixelStore::class, 'tiktok_pixel_uuid', 'uuid')
                  ->where('pixel_type', 'tiktok_pixel');
   }
   
   public function googleTagManager()
   {
       return $this->belongsTo(PixelStore::class, 'google_tag_manager_uuid', 'uuid')
                  ->where('pixel_type', 'google_tag_manager');
   }
   ```

### Fillable Attributes Updated

The model's `$fillable` array now includes all new columns to allow mass assignment:

```php
protected $fillable = [
    'user_id',
    'slug',
    'data',
    'uuid',
    'store_uuid',
    'nama_halaman',
    'favicon',
    'logo',
    'subdomain',
    'domain',
    'meta_description',
    'keywords',
    'facebook_pixel_uuid',
    'tiktok_pixel_uuid',
    'google_tag_manager_uuid',
];
```

### Usage Examples

#### Creating a Landing Page with New Fields
```php
$landingPage = LandingPage::create([
    'user_id' => auth()->id(),
    'slug' => 'my-landing-page',
    'store_uuid' => $store->uuid,
    'nama_halaman' => 'My Awesome Landing Page',
    'favicon' => 'uploads/favicons/favicon.png',
    'logo' => 'uploads/logos/logo.png',
    'subdomain' => 'mystore',
    'domain' => 'mystore.com',
    'meta_description' => 'This is my awesome landing page',
    'keywords' => 'awesome, landing, page, store',
    'facebook_pixel_uuid' => $facebookPixel->uuid,
    'data' => [/* page content */]
]);
```

#### Accessing Relationships
```php
$landingPage = LandingPage::find(1);

// Get associated store
$store = $landingPage->store;

// Get Facebook pixel settings
$facebookPixel = $landingPage->facebookPixel;

// Get all pixel settings
$pixels = [
    'facebook' => $landingPage->facebookPixel,
    'tiktok' => $landingPage->tiktokPixel,
    'gtm' => $landingPage->googleTagManager,
];
```

### Migration Status
✅ **Completed** - Migration has been successfully executed
✅ **Model Updated** - LandingPage model includes new fillable attributes and relationships
✅ **Indexed** - Performance indexes added for key lookup columns

### Next Steps
1. Update API controllers to handle the new fields
2. Add validation rules for the new columns
3. Update frontend forms to save data to these columns
4. Implement file upload handling for favicon and logo
5. Add domain/subdomain validation and routing logic