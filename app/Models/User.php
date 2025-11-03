<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles;
    
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
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'nama_lengkap',
        'email',
        'no_hp',
        'password',
        'alasan_gabung',
        'info_dari',
        'avatar',
        'is_active',
        'paket',
        'location',
        'address',
        'email_verification_code',
        'email_verification_code_expires_at',
        'uuid',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'email_verification_code',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'email_verification_code_expires_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) \Illuminate\Support\Str::uuid();
            }
        });

        // Assign default role after user is created
        static::created(function ($model) {
            if (!$model->hasAnyRole()) {
                $model->assignRole('owner');
            }
        });
    }

    /**
     * Get the user role assignments (for multi-tenant context).
     */
    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    /**
     * Get the stores owned by the user.
     */
    public function ownedStores(): HasMany
    {
        return $this->hasMany(Store::class, 'user_id', 'uuid');
    }

    /**
     * Get the stores owned by the user (alias for ownedStores).
     */
    public function stores(): HasMany
    {
        return $this->ownedStores();
    }

    /**
     * Get the stores the user is associated with via roles.
     */
    public function roleStores(): BelongsToMany
    {
        return $this->belongsToMany(Store::class, 'user_roles')
                   ->withPivot('role_id')
                   ->withTimestamps();
    }

    /**
     * Check if user has role with store context (for multi-tenant).
     */
    public function hasRoleInStore(string $roleName, ?int $storeId = null): bool
    {
        // Use Spatie's built-in hasRole but with store context check if needed
        if ($storeId === null) {
            return $this->hasRole($roleName);
        }

        // For store-specific roles, check in model_has_roles with store_id
        return $this->roles()
                    ->where('name', $roleName)
                    ->wherePivot('store_id', $storeId)
                    ->exists();
    }

    /**
     * Check if user has permission with store context (for multi-tenant).
     */
    public function hasPermissionInStore(string $permissionName, ?int $storeId = null): bool
    {
        // Superadmin has all permissions globally
        if ($this->hasRole('superadmin')) {
            return true;
        }

        // Use Spatie's built-in method for global permissions
        if ($storeId === null) {
            return $this->hasPermissionTo($permissionName);
        }

        // For store-specific permissions, check via roles with store context
        return $this->roles()
                    ->whereHas('permissions', function ($q) use ($permissionName) {
                        $q->where('name', $permissionName);
                    })
                    ->wherePivot('store_id', $storeId)
                    ->exists();
    }

    /**
     * Assign role to user with store context.
     */
    public function assignRoleInStore(string $roleName, ?int $storeId = null): void
    {
        if ($storeId === null) {
            // Use Spatie's built-in method for global roles
            $this->assignRole($roleName);
        } else {
            // For store-specific, attach via pivot with store_id
            $role = \Spatie\Permission\Models\Role::findByName($roleName);
            $this->roles()->attach($role->id, ['store_id' => $storeId]);
        }
    }

    /**
     * Remove role from user with store context.
     */
    public function removeRoleFromStore(string $roleName, ?int $storeId = null): void
    {
        if ($storeId === null) {
            $this->removeRole($roleName);
        } else {
            $role = \Spatie\Permission\Models\Role::findByName($roleName);
            $this->roles()->wherePivot('store_id', $storeId)->detach($role->id);
        }
    }

    /**
     * Generate email verification code.
     */
    public function generateEmailVerificationCode(): string
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        $this->update([
            'email_verification_code' => $code,
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ]);

        return $code;
    }

    /**
     * Verify email with code.
     */
    public function verifyEmailWithCode(string $code): bool
    {
        if ($this->email_verification_code === $code && 
            $this->email_verification_code_expires_at &&
            $this->email_verification_code_expires_at->isFuture()) {
            
            $this->update([
                'email_verified_at' => now(),
                'email_verification_code' => null,
                'email_verification_code_expires_at' => null,
            ]);

            return true;
        }

        return false;
    }

    /**
     * Scope to filter active users.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter verified users.
     */
    public function scopeVerified($query)
    {
        return $query->whereNotNull('email_verified_at');
    }
}
