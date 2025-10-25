<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SocialMedia extends Model
{
    protected $table = 'social_media';
    
    protected $fillable = [
        'uuid',
        'store_uuid',
        'platform',
        'url',
        'tiktok_url',
        'instagram_url',
        'facebook_url',
        'shopee_url',
        'tokopedia_url',
        'youtube_url',
        'twitter_url',
        'linkedin_url',
        'whatsapp_number',
        'telegram_url',
        'is_active'
    ];
    
    protected $casts = [
        'is_active' => 'boolean',
    ];
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid();
            }
        });
    }
    
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'store_uuid', 'uuid');
    }
}
