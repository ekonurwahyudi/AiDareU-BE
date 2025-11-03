<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class BankAccount extends Model
{
    protected $fillable = [
        'uuid',
        'store_uuid',
        'account_name',
        'account_number',
        'bank_name',
        'account_holder_name',
        'bank_code',
        'branch_name',
        'account_type',
        'is_primary',
        'is_active',
        'additional_info'
    ];
    
    protected $casts = [
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
        'additional_info' => 'array',
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
