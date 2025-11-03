<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class FaqToko extends Model
{
    use HasFactory;

    protected $table = 'faq_toko';

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    protected $fillable = [
        'uuid',
        'uuid_store',
        'pertanyaan',
        'jawaban',
        'urutan',
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

    public function scopeOrdered($query)
    {
        return $query->orderBy('urutan', 'asc');
    }
}
