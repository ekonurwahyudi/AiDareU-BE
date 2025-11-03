<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProductDigital extends Model
{
    use HasFactory;

    protected $table = 'products_digital';

    protected $fillable = [
        'uuid',
        'nama_produk',
        'kategori',
        'deskripsi',
        'link_preview',
        'link_download',
        'gambar',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['image_url'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->uuid) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /**
     * Scope for active products
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Get full image URL
     */
    public function getImageUrlAttribute(): ?string
    {
        if (!$this->gambar) {
            return null;
        }

        // If already a full URL, return as is
        if (filter_var($this->gambar, FILTER_VALIDATE_URL)) {
            return $this->gambar;
        }

        // Otherwise, prepend storage URL
        return url('storage/' . $this->gambar);
    }
}
