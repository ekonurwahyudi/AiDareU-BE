<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TestimoniToko extends Model
{
    use HasFactory;

    protected $table = 'testimoni_toko';

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    protected $fillable = [
        'uuid',
        'uuid_store',
        'nama',
        'testimoni',
        'rating',
        'lokasi',
        'paket',
    ];

    protected $hidden = [
        'id'
    ];

    protected $casts = [
        'rating' => 'integer',
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
