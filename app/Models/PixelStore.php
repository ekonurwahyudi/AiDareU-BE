<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PixelStore extends Model
{
    protected $table = 'pixel_stores';
    
    protected $fillable = [
        'uuid',
        'store_uuid',
        'pixel_type',
        'nama_pixel',
        'pixel_id',
        'convention_event',
        'test_code',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_uuid', 'uuid');
    }
}
