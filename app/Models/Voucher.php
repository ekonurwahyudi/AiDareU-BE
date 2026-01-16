<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Voucher extends Model
{
    protected $fillable = [
        'uuid',
        'uuid_store',
        'kode_voucher',
        'keterangan',
        'kuota',
        'kuota_terpakai',
        'tgl_mulai',
        'tgl_berakhir',
        'status',
        'jenis_voucher',
        'tipe_diskon',
        'nilai_diskon',
        'minimum_pembelian',
        'maksimal_diskon'
    ];

    protected $casts = [
        'tgl_mulai' => 'date',
        'tgl_berakhir' => 'date',
        'kuota' => 'integer',
        'kuota_terpakai' => 'integer',
        'nilai_diskon' => 'decimal:2',
        'minimum_pembelian' => 'decimal:2',
        'maksimal_diskon' => 'decimal:2'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    // Relationship to Store
    public function store()
    {
        return $this->belongsTo(Store::class, 'uuid_store', 'uuid');
    }

    // Check if voucher is still valid
    public function isValid()
    {
        $today = Carbon::today();
        $tglMulai = $this->tgl_mulai instanceof Carbon
            ? $this->tgl_mulai->copy()->startOfDay()
            : Carbon::parse($this->tgl_mulai)->startOfDay();
        $tglBerakhir = $this->tgl_berakhir instanceof Carbon
            ? $this->tgl_berakhir->copy()->startOfDay()
            : Carbon::parse($this->tgl_berakhir)->startOfDay();

        return $this->status === 'active'
            && $tglMulai->lte($today)
            && $tglBerakhir->gte($today)
            && $this->kuota_terpakai < $this->kuota;
    }

    // Get remaining quota
    public function getRemainingQuotaAttribute()
    {
        return max(0, $this->kuota - $this->kuota_terpakai);
    }
}
