<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiGenerationHistory extends Model
{
    protected $fillable = [
        'uuid_user',
        'keterangan',
        'hasil_generated',
        'coin_used',
    ];

    /**
     * Scope to filter by user UUID
     */
    public function scopeForUser($query, string $uuidUser)
    {
        return $query->where('uuid_user', $uuidUser);
    }

    /**
     * Get the user that owns the AI generation history
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uuid_user', 'uuid');
    }
}
