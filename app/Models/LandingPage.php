<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LandingPage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'slug',
        'data',
        'uuid',
        'store_uuid',
        'nama_halaman',
        'title_tag',
        'favicon',
        'logo',
        'subdomain',
        'domain',
        'meta_description',
        'keywords',
        'meta_image',
        'facebook_pixel_uuid',
        'tiktok_pixel_uuid',
        'google_tag_manager_uuid',
    ];

    protected $casts = [
        'data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the store associated with this landing page.
     */
    public function store()
    {
        return $this->belongsTo(Store::class, 'store_uuid', 'uuid');
    }

    /**
     * Get the Facebook pixel associated with this landing page.
     */
    public function facebookPixel()
    {
        return $this->belongsTo(PixelStore::class, 'facebook_pixel_uuid', 'uuid')
                   ->where('pixel_type', 'facebook_pixel');
    }

    /**
     * Get the TikTok pixel associated with this landing page.
     */
    public function tiktokPixel()
    {
        return $this->belongsTo(PixelStore::class, 'tiktok_pixel_uuid', 'uuid')
                   ->where('pixel_type', 'tiktok_pixel');
    }

    /**
     * Get the Google Tag Manager associated with this landing page.
     */
    public function googleTagManager()
    {
        return $this->belongsTo(PixelStore::class, 'google_tag_manager_uuid', 'uuid')
                   ->where('pixel_type', 'google_tag_manager');
    }

    public static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });
    }
}


