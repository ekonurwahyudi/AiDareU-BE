<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CoinTransaction extends Model
{
    use HasFactory;

    protected $table = 'coin_transactions';

    protected $fillable = [
        'uuid_user',
        'keterangan',
        'coin_masuk',
        'coin_keluar',
        'status',
    ];

    protected $casts = [
        'coin_masuk' => 'integer',
        'coin_keluar' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relasi ke User
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'uuid_user', 'uuid');
    }

    /**
     * Scope untuk filter by user
     */
    public function scopeForUser($query, $uuidUser)
    {
        return $query->where('uuid_user', $uuidUser);
    }

    /**
     * Scope untuk filter by date range
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
