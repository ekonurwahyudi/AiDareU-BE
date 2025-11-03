<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'uuid_store',
        'uuid_customer',
        'nomor_order',
        'voucher',
        'total_harga',
        'ekspedisi',
        'estimasi_tiba',
        'status',
        'uuid_bank_account'
    ];

    protected $casts = [
        'total_harga' => 'decimal:2',
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

            // Auto-generate nomor_order if not set
            if (empty($model->nomor_order)) {
                $model->nomor_order = static::generateOrderNumber();
            }
        });
    }

    /**
     * Generate order number with format AIDU-DDMMYYXXX
     */
    public static function generateOrderNumber()
    {
        $now = now();
        $day = $now->format('d');
        $month = $now->format('m');
        $year = $now->format('y');
        $datePrefix = "{$day}{$month}{$year}";

        // Get today's order count
        $startOfDay = $now->copy()->startOfDay();
        $endOfDay = $now->copy()->endOfDay();

        $ordersToday = static::whereBetween('created_at', [$startOfDay, $endOfDay])->count();
        $sequence = str_pad($ordersToday + 1, 3, '0', STR_PAD_LEFT);

        return "AIDU-{$datePrefix}{$sequence}";
    }

    /**
     * Relationship: Order belongs to Store
     */
    public function store()
    {
        return $this->belongsTo(Store::class, 'uuid_store', 'uuid');
    }

    /**
     * Relationship: Order belongs to Customer
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'uuid_customer', 'uuid');
    }

    /**
     * Relationship: Order belongs to BankAccount
     */
    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class, 'uuid_bank_account', 'uuid');
    }

    /**
     * Relationship: Order has many DetailOrders
     */
    public function detailOrders()
    {
        return $this->hasMany(DetailOrder::class, 'uuid_order', 'uuid');
    }
}