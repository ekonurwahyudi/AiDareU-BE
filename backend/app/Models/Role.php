<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'display_name',
        'description',
        'level',
        'is_system',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'level' => 'integer',
    ];

    /**
     * Get the permissions that belong to this role.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permissions');
    }

    /**
     * Get the users that have this role.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
                   ->withPivot('store_id')
                   ->withTimestamps();
    }

    /**
     * Check if role has a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        return $this->permissions()->where('name', $permission)->exists();
    }

    /**
     * Check if role has any of the given permissions.
     */
    public function hasAnyPermission(array $permissions): bool
    {
        return $this->permissions()->whereIn('name', $permissions)->exists();
    }

    /**
     * Check if role has all of the given permissions.
     */
    public function hasAllPermissions(array $permissions): bool
    {
        $rolePermissions = $this->permissions()->pluck('name')->toArray();
        return empty(array_diff($permissions, $rolePermissions));
    }

    /**
     * Assign permission to role.
     */
    public function assignPermission(Permission $permission): void
    {
        if (!$this->hasPermission($permission->name)) {
            $this->permissions()->attach($permission);
        }
    }

    /**
     * Remove permission from role.
     */
    public function removePermission(Permission $permission): void
    {
        $this->permissions()->detach($permission);
    }

    /**
     * Sync permissions for role.
     */
    public function syncPermissions(array $permissionIds): void
    {
        $this->permissions()->sync($permissionIds);
    }

    /**
     * Scope to filter system roles.
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope to filter custom roles.
     */
    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Scope to order by level (hierarchy).
     */
    public function scopeByLevel($query, $direction = 'desc')
    {
        return $query->orderBy('level', $direction);
    }
}