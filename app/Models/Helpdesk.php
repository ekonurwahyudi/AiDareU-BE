<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Helpdesk extends Model
{
    protected $fillable = [
        'uuid',
        'user_id',
        'ticket_number',
        'title',
        'category',
        'department',
        'status',
        'priority',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $hidden = [
        'id',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($helpdesk) {
            if (empty($helpdesk->uuid)) {
                $helpdesk->uuid = (string) Str::uuid();
            }

            if (empty($helpdesk->ticket_number)) {
                $helpdesk->ticket_number = self::generateTicketNumber();
            }
        });
    }

    /**
     * Generate unique ticket number format: #08035176
     */
    protected static function generateTicketNumber(): string
    {
        do {
            $number = '#' . str_pad(mt_rand(10000000, 99999999), 8, '0', STR_PAD_LEFT);
        } while (self::where('ticket_number', $number)->exists());

        return $number;
    }

    /**
     * Get the user that owns the ticket
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get all details/messages for this ticket
     */
    public function details(): HasMany
    {
        return $this->hasMany(HelpdeskDetail::class);
    }

    /**
     * Get the latest update timestamp
     */
    public function getLatestUpdateAttribute()
    {
        $latestDetail = $this->details()->latest()->first();
        return $latestDetail ? $latestDetail->created_at : $this->updated_at;
    }

    /**
     * Scope for user tickets
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope for open tickets
     */
    public function scopeOpen($query)
    {
        return $query->whereIn('status', ['open', 'waiting_reply', 'replied']);
    }

    /**
     * Scope for closed tickets
     */
    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }
}
