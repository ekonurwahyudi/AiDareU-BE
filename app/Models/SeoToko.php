<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SeoToko extends Model
{
    use HasFactory;

    protected $table = 'seo_toko';

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    protected $fillable = [
        'uuid',
        'uuid_store',
        'meta_title',
        'deskripsi',
        'keyword',
        'og_title',
        'og_deskripsi',
        'og_image',
    ];

    protected $hidden = [
        'id'
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
        return $this->belongsTo(Store::class, 'uuid_store', 'uuid');
    }
}
