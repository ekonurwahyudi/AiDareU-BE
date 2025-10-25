<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'module',
        'action',
        'resource',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    /**
     * Get the roles that have this permission.
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_permissions');
    }

    /**
     * Get the users that have this permission through roles.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_permissions')
                   ->withPivot('store_id')
                   ->withTimestamps();
    }

    /**
     * Scope to filter by module.
     */
    public function scopeByModule($query, $module)
    {
        return $query->where('module', $module);
    }

    /**
     * Scope to filter by action.
     */
    public function scopeByAction($query, $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope to filter by resource.
     */
    public function scopeByResource($query, $resource)
    {
        return $query->where('resource', $resource);
    }

    /**
     * Check if permission matches the given criteria.
     */
    public function matches(string $module, string $action, string $resource = null): bool
    {
        if ($this->module !== $module || $this->action !== $action) {
            return false;
        }

        if ($resource && $this->resource !== $resource) {
            return false;
        }

        return true;
    }
}