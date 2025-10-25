<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DetailOrder extends Model
{
    use HasFactory;

    protected $table = 'detail_orders';

    protected $fillable = [
        'uuid',
        'uuid_order',
        'uuid_product',
        'quantity',
        'price'
    ];

    protected $casts = [
        'quantity' => 'integer',
        'price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Boot function to auto-generate UUID
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Relationship: DetailOrder belongs to Order
     */
    public function order()
    {
        return $this->belongsTo(Order::class, 'uuid_order', 'uuid');
    }

    /**
     * Relationship: DetailOrder belongs to Product
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'uuid_product', 'uuid');
    }
}