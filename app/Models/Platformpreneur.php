<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Platformpreneur extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'platformpreneur';

    /**
     * Use UUID for route model binding.
     */
    public function getRouteKeyName()
    {
        return 'uuid';
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'uuid',
        'no_kontrak',
        'judul',
        'username',
        'perusahaan',
        'file',
        'nama',
        'email',
        'no_hp',
        'lokasi',
        'logo',
        'logo_footer',
        'coin_user',
        'kuota_user',
        'domain',
        'cart',
        'tgl_mulai',
        'tgl_akhir',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tgl_mulai' => 'date',
        'tgl_akhir' => 'date',
        'coin_user' => 'integer',
        'kuota_user' => 'integer',
        'cart' => 'boolean',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'coin_user' => 0,
        'kuota_user' => 0,
        'cart' => false,
    ];

    /**
     * Boot function to auto-generate UUID.
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
}
