<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Store extends Model
{
    use HasFactory;
    
    /**
     * Use UUID for route model binding.
     */
    public function getRouteKeyName()
    {
        return 'uuid';
    }

    protected $fillable = [
        'uuid',
        'user_id',
        'name',
        'nama_toko',
        'subdomain',
        'custom_domain',
        'phone',
        'no_hp_toko',
        'category',
        'kategori_toko',
        'description',
        'deskripsi_toko',
        'logo',
        'banner',
        'theme_settings',
        'status',
        'is_active',
        'is_published',
        'verified_at',
        // Bank Account Info
        'bank_account_owner',
        'bank_account_number', 
        'bank_name',
        // Social Media URLs
        'instagram_url',
        'facebook_url',
        'tiktok_url',
        'youtube_url',
        // Address fields
        'provinsi',
        'kota',
        'kecamatan',
        // Legacy fields for backward compatibility
        'domain',
        'alamat',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_published' => 'boolean',
        'theme_settings' => 'array',
        'settings' => 'array',
        'verified_at' => 'datetime'
    ];

    protected $hidden = [
        'id'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Str::uuid();
            }
        });
    }


    /**
     * Get the user that owns the store.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'uuid');
    }

    /**
     * Get the owner of the store (legacy - maps to user relationship).
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'uuid');
    }

    /**
     * Get the users associated with this store.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_roles')
                   ->withPivot('role_id')
                   ->withTimestamps();
    }

    /**
     * Get the user roles for this store.
     */
    public function userRoles(): HasMany
    {
        return $this->hasMany(UserRole::class);
    }

    /**
     * Get the social media accounts for this store.
     */
    public function socialMedia(): HasMany
    {
        return $this->hasMany(SocialMedia::class, 'store_uuid', 'uuid');
    }

    /**
     * Get the bank accounts for this store.
     */
    public function bankAccounts(): HasMany
    {
        return $this->hasMany(BankAccount::class, 'store_uuid', 'uuid');
    }

    /**
     * Get the pixel stores for this store.
     */
    public function pixelStores(): HasMany
    {
        return $this->hasMany(PixelStore::class, 'store_uuid', 'uuid');
    }

    /**
     * Get the full subdomain URL.
     */
    public function getSubdomainUrlAttribute(): string
    {
        return "https://{$this->subdomain}." . config('app.domain', 'aidareu.com');
    }

    /**
     * Get the full domain URL (legacy).
     */
    public function getFullDomainAttribute(): string
    {
        if ($this->domain || $this->custom_domain) {
            return $this->domain ?? $this->custom_domain;
        }
        
        return $this->subdomain . '.aidareu.com';
    }

    /**
     * Get the full custom domain URL.
     */
    public function getCustomDomainUrlAttribute(): ?string
    {
        $domain = $this->custom_domain ?? $this->domain;
        return $domain ? "https://{$domain}" : null;
    }

    /**
     * Get the primary URL for the store.
     */
    public function getPrimaryUrlAttribute(): string
    {
        return $this->custom_domain_url ?? $this->subdomain_url;
    }

    /**
     * Get the store URL (legacy).
     */
    public function getUrlAttribute(): string
    {
        return 'https://' . $this->full_domain;
    }

    /**
     * Check if user has access to this store.
     */
    public function hasUser(User $user): bool
    {
        return $this->user_id === $user->id || 
               $this->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Check if user has specific role in this store.
     */
    public function userHasRole(User $user, string $roleName): bool
    {
        return $this->userRoles()
                   ->where('user_id', $user->id)
                   ->whereHas('role', function ($query) use ($roleName) {
                       $query->where('name', $roleName);
                   })
                   ->exists();
    }

    /**
     * Get user's roles in this store.
     */
    public function getUserRoles(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return $this->userRoles()
                   ->where('user_id', $user->id)
                   ->with('role')
                   ->get()
                   ->pluck('role');
    }

    /**
     * Assign user to store with role.
     */
    public function assignUser(User $user, Role $role): void
    {
        UserRole::updateOrCreate(
            [
                'user_id' => $user->id,
                'store_id' => $this->id,
                'role_id' => $role->id,
            ]
        );
    }

    /**
     * Remove user from store.
     */
    public function removeUser(User $user): void
    {
        $this->userRoles()->where('user_id', $user->id)->delete();
    }

    /**
     * Scope to filter active stores.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by category.
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('kategori_toko', $category);
    }

    /**
     * Scope to filter by owner.
     */
    public function scopeByOwner($query, $ownerId)
    {
        return $query->where('user_id', $ownerId);
    }

    /**
     * Scope to filter by user.
     */
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Check if subdomain is available.
     */
    public static function isSubdomainAvailable(string $subdomain): bool
    {
        return !static::where('subdomain', $subdomain)->exists();
    }

    /**
     * Get store by subdomain.
     */
    public static function findBySubdomain(string $subdomain): ?Store
    {
        return static::where('subdomain', $subdomain)->first();
    }

    /**
     * Check if custom domain is available.
     */
    public static function isCustomDomainAvailable(string $domain): bool
    {
        return !static::where('custom_domain', $domain)
                     ->orWhere('domain', $domain)
                     ->exists();
    }

    /**
     * Get store by custom domain.
     */
    public static function findByCustomDomain(string $domain): ?Store
    {
        return static::where('custom_domain', $domain)
                    ->orWhere('domain', $domain)
                    ->first();
    }
}