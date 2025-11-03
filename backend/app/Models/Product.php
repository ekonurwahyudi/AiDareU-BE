<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'uuid_store',
        'nama_produk',
        'deskripsi',
        'jenis_produk',
        'url_produk',
        'upload_gambar_produk',
        'harga_produk',
        'harga_diskon',
        'category_id',
        'status_produk',
        'slug',
        'stock',
        'sku',
        'meta_description',
        'meta_keywords',
    ];

    protected $casts = [
        'upload_gambar_produk' => 'array',
        'harga_produk' => 'decimal:2',
        'harga_diskon' => 'decimal:2',
        'stock' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->uuid) {
                $model->uuid = (string) Str::uuid();
            }
            if (!$model->slug) {
                $baseSlug = Str::slug($model->nama_produk);
                $slug = $baseSlug;
                $counter = 1;
                
                // Ensure unique slug
                while (static::where('slug', $slug)->exists()) {
                    $slug = $baseSlug . '-' . $counter;
                    $counter++;
                }
                
                $model->slug = $slug;
            }
            if (!$model->sku) {
                $model->sku = 'PRD-' . strtoupper(Str::random(8));
            }
        });

        static::updating(function ($model) {
            if ($model->isDirty('nama_produk')) {
                $model->slug = Str::slug($model->nama_produk);
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
     * Relationship with category
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Relationship with store
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'uuid_store', 'uuid');
    }

    /**
     * Scope for active products
     */
    public function scopeActive($query)
    {
        return $query->where('status_produk', 'active');
    }

    /**
     * Scope for digital products
     */
    public function scopeDigital($query)
    {
        return $query->where('jenis_produk', 'digital');
    }

    /**
     * Scope for physical products
     */
    public function scopePhysical($query)
    {
        return $query->where('jenis_produk', 'fisik');
    }

    /**
     * Get formatted product price
     */
    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->harga_produk, 0, ',', '.');
    }

    /**
     * Get formatted discount price
     */
    public function getFormattedDiscountPriceAttribute(): string
    {
        if (!$this->harga_diskon) {
            return '';
        }
        return 'Rp ' . number_format($this->harga_diskon, 0, ',', '.');
    }

    /**
     * Get discount percentage
     */
    public function getDiscountPercentageAttribute(): ?int
    {
        if (!$this->harga_diskon || $this->harga_diskon >= $this->harga_produk) {
            return null;
        }
        
        return (int) round((($this->harga_produk - $this->harga_diskon) / $this->harga_produk) * 100);
    }

    /**
     * Get main image
     */
    public function getMainImageAttribute(): ?string
    {
        $images = $this->upload_gambar_produk;
        return is_array($images) && count($images) > 0 ? $images[0] : null;
    }

    /**
     * Check if product has discount
     */
    public function getHasDiscountAttribute(): bool
    {
        return $this->harga_diskon && $this->harga_diskon < $this->harga_produk;
    }

    /**
     * Get effective price (discount price if available, otherwise regular price)
     */
    public function getEffectivePriceAttribute(): float
    {
        return $this->has_discount ? $this->harga_diskon : $this->harga_produk;
    }

    /**
     * Check if product is in stock (for physical products)
     */
    public function getInStockAttribute(): bool
    {
        if ($this->jenis_produk === 'digital') {
            return true; // Digital products are always in stock
        }
        
        return $this->stock > 0;
    }
}