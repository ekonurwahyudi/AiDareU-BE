<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'nama',
        'no_hp',
        'email',
        'provinsi',
        'kota',
        'kecamatan',
        'alamat',
        'uuid_store'
    ];

    protected $casts = [
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
     * Relationship: Customer belongs to Store
     */
    public function store()
    {
        return $this->belongsTo(Store::class, 'uuid_store', 'uuid');
    }

    /**
     * Relationship: Customer has many Orders
     */
    public function orders()
    {
        return $this->hasMany(Order::class, 'uuid_customer', 'uuid');
    }
}