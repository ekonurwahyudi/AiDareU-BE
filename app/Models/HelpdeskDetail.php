<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class HelpdeskDetail extends Model
{
    protected $fillable = [
        'uuid',
        'helpdesk_id',
        'user_id',
        'message',
        'type',
        'pic',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'file_size' => 'integer',
    ];

    protected $hidden = [
        'id',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($detail) {
            if (empty($detail->uuid)) {
                $detail->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the helpdesk ticket
     */
    public function helpdesk(): BelongsTo
    {
        return $this->belongsTo(Helpdesk::class);
    }

    /**
     * Get the user who created this detail
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
