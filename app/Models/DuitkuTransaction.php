<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DuitkuTransaction extends Model
{
    protected $fillable = [
        'user_id',
        'merchant_code',
        'merchant_order_id',
        'reference',
        'payment_method',
        'coin_amount',
        'payment_amount',
        'status',
        'result_code',
        'payment_code',
        'payment_url',
        'va_number',
        'qr_string',
        'callback_reference',
        'settlement_date',
    ];

    protected $casts = [
        'coin_amount' => 'integer',
        'payment_amount' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the transaction
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for pending transactions
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for successful transactions
     */
    public function scopeSuccess($query)
    {
        return $query->where('status', 'success');
    }

    /**
     * Scope for failed transactions
     */
    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope for user transactions
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
